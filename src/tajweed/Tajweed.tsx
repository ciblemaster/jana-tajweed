import { HELD_COUNTS, tajweedLetterAt, tajweedLetterProgress, tajweedVerseAt, toArabicDigits, type TajweedRule } from '../core';
import { ArrowLeft, Brain, Check, Eye, Hand, Medal, Mic, MicOff, Pause, Play, RotateCcw, SkipBack, SkipForward, Star, Turtle, User, Users } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, useLang, useText } from '../core/lang';
import { AWARD_TEXT, RECITER_TEXT, RULE_TEXT, TAJWEED_TEXT as T } from '../core/texts';
import { RuleCard } from './RuleCard';
import { awards, earn, isOpen, readProgress, STARS, won, type Progress, type Star as StarKind } from './progress';
import { ayahOf, AYAHS, DISPLAY_FONT, HAS_CHILDREN, lastWordEndedBy, leadRule, MODE, MUSHAF_FONT, RuleMark, RULES_USED, shownText, SURAH, switchTrial, TIMELINE, TRIAL, wordOfLetter, WORDS } from './rules';
import { GAME_SURAHS, gameUrl, surahInfo, surahName } from './surahs';
import { useRecitation } from './useRecitation';
import { useRecorder } from './useRecorder';
import './tajweed.css';

/** Slow enough for a child to follow each letter; the browser keeps the sheikh's pitch. */
const SLOW_RATE = 0.7;
/** A word listened to from its card starts a little early and ends a little late, so no sound is clipped. */
const WORD_LEAD_MS = 60;
const WORD_TAIL_MS = 100;
/** The child's own turn lasts a little longer than the sheikh took over the verse, and never less than this. */
const TURN_SHARE = 1.3;
const TURN_MIN_MS = 3000;

interface Box { x: number; y: number; w: number; h: number }

const LAST = TIMELINE.verses.length - 1;
const LAST_VERSE = TIMELINE.verses[LAST];
const NONE_DONE = AYAHS.map(() => false);

/**
 * The child's own turn on a verse, and what follows it: the next verse, or the end of the surah. When memorising, the
 * verse is covered while the child recites, then shown so the child can say whether it was right.
 */
type Turn = { then: 'continue' | 'finish'; ms: number; ayah: number; phase: 'recite' | 'check' | 'compare' };

/** What finishing the surah won. */
type Result = { stars: StarKind[]; awards: string[]; progress: Progress };

/**
 * A short surah recited with every letter lighting up in the colour of its tajweed rule as it is said. A child can
 * pause, play a verse again, slow it down, and open any coloured word to see what its rule does. In a teaching
 * recording the sheikh recites a verse, children repeat it, and then the recording waits while the child recites it
 * alone. In the memorise mode the verse is covered for that turn.
 */
export default function Tajweed() {
  const tx = useText();
  const lang = useLang();
  const [fontReady, setFontReady] = useState(false);
  const [verse, setVerse] = useState(0);
  /** The last letter recited; the board shows the letters of its verse up to it. */
  const [reached, setReached] = useState(-1);
  const [started, setStarted] = useState(false);
  const [slow, setSlow] = useState(false);
  const [stops, setStops] = useState(false);
  const [completed, setCompleted] = useState(NONE_DONE);
  const [finished, setFinished] = useState(false);
  /** After each verse the recording waits for the child to recite it alone; on by default where children repeat. */
  const [myTurn, setMyTurn] = useState(HAS_CHILDREN || MODE === 'memorise');
  const [turn, setTurn] = useState<Turn | null>(null);
  /** Memorising: the verses recited from memory, and whether the child asked to see the covered verse. */
  const [known, setKnown] = useState(NONE_DONE);
  const [peeking, setPeeking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  /** The coloured letter whose card is open. */
  const [card, setCard] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [soundNow, setSoundNow] = useState(-1);
  const [boxes, setBoxes] = useState<Map<number, Box>>(new Map());

  /** 'word' while a card plays its word: the board then stays where it was. 'replay' while the sheikh's verse is
   * played again next to the child's take: the letters light up, and nothing else moves on. */
  const mode = useRef<'main' | 'word' | 'replay'>('main');
  /** Recording the child on their turn, and the take of each verse (in memory only). */
  const [recordOn, setRecordOn] = useState(false);
  const recordOnRef = useRef(recordOn);
  recordOnRef.current = recordOn;
  const [takes, setTakes] = useState<Map<number, string>>(new Map());
  const [hearing, setHearing] = useState<'me' | 'sheikh' | null>(null);
  const takeAudio = useRef<HTMLAudioElement | null>(null);
  const mainMs = useRef(0);
  /** The last word a stop was considered for, so each coloured word stops the recitation once. */
  const stopCursor = useRef(-1);
  const stopsOn = useRef(stops);
  stopsOn.current = stops;
  const myTurnOn = useRef(myTurn);
  myTurnOn.current = myTurn;
  /** The recitation the board is on, and the last one the child's turn was given for. */
  const onVerse = useRef(0);
  const turnCursor = useRef(-1);
  /** The verses the child took a turn on, and the ones recited from memory, for the stars at the end. */
  const turnsTaken = useRef(new Set<number>());
  const knownNow = useRef(known);
  knownNow.current = known;
  const stage = useRef<HTMLDivElement>(null);
  const cardPanel = useRef<HTMLDivElement>(null);
  const pauseRef = useRef<() => void>(() => {});

  const onTick = useCallback((ms: number) => {
    const at = tajweedLetterAt(TIMELINE, ms);
    const letter = at >= 0 ? TIMELINE.letters[at] : null;
    const progress = (letter ? tajweedLetterProgress(letter, ms) : 0).toFixed(3);
    if (mode.current === 'replay') {
      setReached(at);
      stage.current?.style.setProperty('--p', progress);
      return;
    }
    if (mode.current === 'word') {
      setSoundNow(at);
      cardPanel.current?.style.setProperty('--p', progress);
      return;
    }
    mainMs.current = ms;
    const v = tajweedVerseAt(TIMELINE, ms);
    const before = onVerse.current;
    const ended = ms >= LAST_VERSE.endMs;
    // A verse is over when its last recitation is: the child's turn comes then, before the next verse or the end.
    const over = ended ? LAST : v > before && AYAHS[ayahOf(before)].last === before ? before : -1;
    if (over >= 0) {
      setCompleted((done) => (done[ayahOf(over)] ? done : done.map((d, i) => d || i === ayahOf(over))));
      if (myTurnOn.current && turnCursor.current < over) {
        turnCursor.current = over;
        if (!ended) mainMs.current = TIMELINE.verses[v].startMs;
        pauseRef.current();
        // The board shows the verse the turn is for, even if the page fell behind the recording.
        onVerse.current = over;
        setVerse(over);
        setReached(TIMELINE.verses[over].last);
        const sheikh = TIMELINE.verses[AYAHS[ayahOf(over)].first];
        setPeeking(false);
        setTurn({ then: ended ? 'finish' : 'continue', ms: Math.max(TURN_MIN_MS, (sheikh.endMs - sheikh.startMs) * TURN_SHARE), ayah: ayahOf(over), phase: 'recite' });
        return;
      }
    }
    if (ended) {
      pauseRef.current();
      setFinished(true);
      return;
    }
    onVerse.current = v;
    setVerse(v);
    setReached(at);
    stage.current?.style.setProperty('--p', progress);
    if (!stopsOn.current) return;
    let k = stopCursor.current + 1;
    while (k < WORDS.length && WORDS[k].endMs <= ms) {
      // The children say the same words again: a word stops the recitation once, when the sheikh says it.
      if (WORDS[k].rules.length && WORDS[k].pass === 'reciter') {
        stopCursor.current = k;
        pauseRef.current();
        setCard(leadRule(WORDS[k]));
        return;
      }
      k++;
    }
    stopCursor.current = k - 1;
  }, []);

  // The recording may run out a moment before the last verse's own end: the same ending either way.
  const onEnd = useCallback(() => {
    if (mode.current === 'main') onTick(LAST_VERSE.endMs);
  }, [onTick]);

  const recitation = useRecitation(TIMELINE.audioUrl, onTick, onEnd);
  const recorder = useRecorder();
  const { playing, status, play, pause, seek, setRate, retry } = recitation;
  pauseRef.current = pause;

  useEffect(() => {
    void ensureFonts([MUSHAF_FONT, DISPLAY_FONT]).then(() => setFontReady(true));
  }, []);

  useEffect(() => {
    document.title = `${tx(T.title)} · ${surahName(surahInfo(SURAH), lang)}`;
  }, [tx, lang]);

  useEffect(() => {
    setRate(slow ? SLOW_RATE : 1);
  }, [slow, status, setRate]);

  // A long surah has more verses than fit in a row: the one being recited stays in view.
  useEffect(() => {
    document.querySelector('.tj-step.is-current')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [verse]);

  // A child who leaves the page should not come back to a surah that went on without them.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') pauseRef.current();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Where each letter sits on the board, so the star, the rule's mark and the madd beads can follow it.
  useLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const measure = () => {
      const base = root.getBoundingClientRect();
      const next = new Map<number, Box>();
      root.querySelectorAll<HTMLElement>('[data-i]').forEach((el) => {
        const r = el.getBoundingClientRect();
        next.set(Number(el.dataset.i), { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
      });
      setBoxes(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [verse, fontReady]);

  const goTo = useCallback((v: number, autoplay: boolean) => {
    const ms = TIMELINE.verses[v].startMs;
    takeAudio.current?.pause();
    setHearing(null);
    void recorder.stop();
    mode.current = 'main';
    mainMs.current = ms;
    stopCursor.current = lastWordEndedBy(ms);
    onVerse.current = v;
    turnCursor.current = v - 1;
    setTurn(null);
    setFinished(false);
    setVerse(v);
    setReached(TIMELINE.verses[v].first - 1);
    if (autoplay) {
      setStarted(true);
      play({ fromMs: ms });
    } else {
      pause();
      seek(ms);
    }
  }, [pause, play, seek]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = useCallback(() => {
    setCompleted(NONE_DONE);
    setKnown(NONE_DONE);
    turnsTaken.current.clear();
    setResult(null);
    goTo(0, true);
  }, [goTo]);

  // The surah is finished: its stars are kept on this device, and any award they win is announced once.
  useEffect(() => {
    if (!finished || TRIAL) return;
    const stars: StarKind[] = MODE === 'memorise'
      ? (knownNow.current.every(Boolean) ? ['memorise'] : [])
      : ['listen', ...(turnsTaken.current.size >= AYAHS.length ? ['recite' as const] : [])];
    const had = awards(readProgress()).filter(won).map((a) => a.id);
    const progress = earn(SURAH, stars);
    setResult({ stars, progress, awards: awards(progress).filter(won).map((a) => a.id).filter((id) => !had.includes(id)) });
  }, [finished]);

  /** The child's turn is over: on to the next verse, or to the end. */
  const endTurn = useCallback((ended: Turn) => {
    turnsTaken.current.add(ended.ayah);
    setTurn(null);
    if (ended.then === 'finish') setFinished(true);
    else play({ fromMs: mainMs.current });
  }, [play]);

  /** The time to recite is up. When memorising, the verse is shown and the child says how it went. */
  const reciteOver = useCallback(async (ended: Turn) => {
    const take = await recorder.stop();
    if (take) {
      const url = URL.createObjectURL(take);
      setTakes((all) => {
        const next = new Map(all);
        const old = next.get(ended.ayah);
        if (old) URL.revokeObjectURL(old);
        next.set(ended.ayah, url);
        return next;
      });
    }
    if (MODE === 'memorise') setTurn({ ...ended, phase: 'check' });
    else if (take) setTurn({ ...ended, phase: 'compare' });
    else endTurn(ended);
  }, [endTurn, recorder.stop]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Stops whatever the comparison is playing. */
  const hush = useCallback(() => {
    takeAudio.current?.pause();
    if (mode.current === 'replay') {
      pauseRef.current();
      mode.current = 'main';
      setVerse(onVerse.current);
      setReached(TIMELINE.verses[onVerse.current].last);
    }
    setHearing(null);
  }, []);

  /** Plays the child's take of the verse. */
  const hearMe = useCallback((ayahAt: number) => {
    hush();
    const url = takes.get(ayahAt);
    if (!url) return;
    const el = takeAudio.current ?? new Audio();
    takeAudio.current = el;
    el.src = url;
    el.onended = () => setHearing(null);
    setHearing('me');
    void el.play().catch(() => setHearing(null));
  }, [hush, takes]);

  /** Plays the sheikh's recitation of the verse again, its letters lighting up. */
  const hearSheikh = useCallback((ayahAt: number) => {
    hush();
    const sheikh = TIMELINE.verses[AYAHS[ayahAt].first];
    mode.current = 'replay';
    setHearing('sheikh');
    // The board shows the sheikh's recitation of the verse while it plays, then goes back to where it was.
    setVerse(AYAHS[ayahAt].first);
    setReached(sheikh.first - 1);
    play({
      fromMs: sheikh.startMs,
      untilMs: sheikh.endMs,
      onDone: () => {
        mode.current = 'main';
        setHearing(null);
        setVerse(onVerse.current);
        setReached(TIMELINE.verses[onVerse.current].last);
      }
    });
  }, [hush, play]);

  /** Done comparing: on to the next verse, or record the verse again. */
  const compareDone = useCallback((again: boolean) => {
    if (!turn) return;
    hush();
    setReached(TIMELINE.verses[onVerse.current].last);
    if (again) setTurn({ ...turn, phase: 'recite' });
    else endTurn(turn);
  }, [endTurn, hush, turn]);

  const toggleRecord = useCallback(async () => {
    if (recordOn) {
      recorder.disable();
      setRecordOn(false);
      return;
    }
    if (await recorder.enable()) setRecordOn(true);
  }, [recordOn, recorder]);

  // The child's voice is recorded for the whole of their turn.
  useEffect(() => {
    if (turn?.phase === 'recite' && recordOnRef.current) recorder.start();
  }, [turn, recorder.start]); // eslint-disable-line react-hooks/exhaustive-deps

  // Takes are let go when the page is.
  useEffect(() => () => takes.forEach((url) => URL.revokeObjectURL(url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!turn || turn.phase !== 'recite') return;
    const timer = window.setTimeout(() => reciteOver(turn), turn.ms);
    return () => window.clearTimeout(timer);
  }, [turn, reciteOver]);

  const toggle = useCallback(() => {
    if (finished) return restart();
    // Play during the child's turn means "I am done": it moves on without waiting.
    if (turn) {
      if (turn.phase === 'recite') return void reciteOver(turn);
      if (turn.phase === 'compare') return compareDone(false);
      return undefined;
    }
    if (playing) return pause();
    setStarted(true);
    play({ fromMs: mainMs.current });
  }, [compareDone, finished, pause, play, playing, reciteOver, restart, turn]);

  /** Moves a verse back or forward, or replays this one. */
  const goAyah = useCallback((step: number, autoplay: boolean) => {
    const to = ayahOf(onVerse.current) + step;
    if (to >= 0 && to < AYAHS.length) goTo(AYAHS[to].first, autoplay);
  }, [goTo]);

  /** Memorising: the child says whether the verse came out right. "Not yet" plays the verse again. */
  const answer = useCallback((right: boolean) => {
    if (!turn) return;
    if (!right) return goTo(AYAHS[turn.ayah].first, true);
    setKnown((list) => list.map((k, i) => k || i === turn.ayah));
    endTurn(turn);
  }, [endTurn, goTo, turn]);

  const openCard = useCallback((letter: number) => {
    pause();
    setTurn(null);
    setCard(letter);
  }, [pause]);

  const closeCard = useCallback((carryOn: boolean) => {
    pause();
    mode.current = 'main';
    setListening(false);
    setSoundNow(-1);
    setCard(null);
    if (carryOn) {
      setStarted(true);
      play({ fromMs: mainMs.current });
    } else seek(mainMs.current);
  }, [pause, play, seek]);
  const dismissCard = useCallback(() => closeCard(false), [closeCard]);

  const listen = useCallback(() => {
    if (card === null) return;
    const word = wordOfLetter(card);
    mode.current = 'word';
    setListening(true);
    play({
      fromMs: word.startMs - WORD_LEAD_MS,
      untilMs: word.endMs + WORD_TAIL_MS,
      onDone: () => {
        setListening(false);
        setSoundNow(-1);
      }
    });
  }, [card, play]);

  // Space plays and pauses; the arrows change verse, the way the page reads.
  useEffect(() => {
    if (card !== null) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea')) return;
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      }
      const forward = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const back = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === forward) goAyah(1, playing);
      if (e.key === back) goAyah(-1, playing);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [card, goAyah, playing, toggle]);

  const current = TIMELINE.verses[verse];
  const ayah = ayahOf(verse);
  /** Who the board is listening to. */
  const who = turn ? 'child' : current.pass;
  /** Memorising, on the child's turn: the verse is covered, but for its first word. */
  const covered = MODE === 'memorise' && turn?.phase === 'recite' && !peeking;
  const info = surahInfo(SURAH);
  const nextSurah = GAME_SURAHS[GAME_SURAHS.findIndex((s) => s.n === SURAH) + 1];
  const now = reached >= current.first && reached <= current.last ? reached : -1;
  const sounding = playing && card === null && !finished && !turn;
  const nowWord = now >= 0 ? wordOfLetter(now) : null;
  // The madd of the word being said keeps its beads until the word is over.
  const madd = nowWord?.rules.filter((i) => i <= now && HELD_COUNTS[TIMELINE.letters[i].rule!]).pop();
  // The mark of the last other rule met in this word pops out of its letter.
  const pop = nowWord?.rules.filter((i) => i <= now && !HELD_COUNTS[TIMELINE.letters[i].rule!]).pop();
  // Under the board: the last rule met in this verse.
  const lastRule = now >= 0 ? TIMELINE.letters.slice(current.first, now + 1).filter((l) => l.rule).pop() : undefined;
  const guide = now >= 0 && !(now === current.last && !sounding) ? boxes.get(now) : undefined;
  const maddBox = madd !== undefined ? boxes.get(madd) : undefined;
  const popBox = pop !== undefined ? boxes.get(pop) : undefined;

  /** A tap on a word opens the coloured letter nearest the finger. */
  const onWord = (e: MouseEvent, rules: number[]) => {
    const base = stage.current?.getBoundingClientRect();
    const x = base ? e.clientX - base.left : 0;
    const nearest = [...rules].sort((a, b) => {
      const boxA = boxes.get(a);
      const boxB = boxes.get(b);
      return Math.abs((boxA ? boxA.x + boxA.w / 2 : 0) - x) - Math.abs((boxB ? boxB.x + boxB.w / 2 : 0) - x);
    })[0];
    // A press from the keyboard has no place: it opens the rule the word is best known for.
    openCard(e.detail === 0 ? leadRule(wordOfLetter(rules[0])) : nearest);
  };

  /** A colour of the key opens its first letter in this verse, or else in the surah. */
  const onRule = (rule: TajweedRule) => {
    const inVerse = TIMELINE.letters.slice(current.first, current.last + 1).find((l) => l.rule === rule);
    const example = inVerse ?? TIMELINE.letters.find((l) => l.rule === rule);
    if (example) openCard(example.index);
  };

  return (
    <div className="tj" style={{ '--tj-display': fontStack(DISPLAY_FONT) } as CSSProperties}>
      <header className="tj-top">
        <a className="tj-btn tj-back" href={gameUrl()} aria-label={tx(T.backToMap)}><ArrowLeft size={22} strokeWidth={2.5} className="tj-flip" /></a>
        <div className="tj-heading">
          <h1 lang={lang === 'ar' || lang === 'ur' ? 'ar' : undefined}>
            {surahName(info, lang)}
            {MODE === 'memorise' && <span className="tj-tag tj-tag-mode"><Brain size={14} strokeWidth={2.5} aria-hidden />{tx(T.memorise)}</span>}
          </h1>
          <p>{tx(TRIAL ? RECITER_TEXT.husary : RECITER_TEXT.minshawi)}</p>
        </div>
      </header>

      <div className="tj-body">
        <main className="tj-main" id="main">
          <nav className="tj-steps" aria-label={tx(T.verses)}>
            {AYAHS.map((v, i) => (
              <button
                key={v.ayah}
                className={['tj-step', i === ayah ? 'is-current' : '', completed[i] ? 'is-done' : ''].join(' ')}
                aria-label={fill(tx(T.verse), { n: v.ayah })}
                aria-current={i === ayah ? 'step' : undefined}
                onClick={() => goTo(v.first, true)}
              >
                {completed[i] ? <Star size={18} strokeWidth={2.5} fill="currentColor" aria-hidden /> : v.ayah}
              </button>
            ))}
          </nav>

          <section className="tj-board" aria-label={fill(tx(T.verse), { n: current.ayah })}>
            {(HAS_CHILDREN || turn) && (
              <p key={who} className="tj-who" data-who={who}>
                {who === 'child' ? <Mic size={18} strokeWidth={2.5} aria-hidden /> : who === 'children' ? <Users size={18} strokeWidth={2.5} aria-hidden /> : <User size={18} strokeWidth={2.5} aria-hidden />}
                {tx(who === 'child' ? T.yourTurn : who === 'children' ? T.children : T.sheikh)}
              </p>
            )}
            <div className="tj-stage" ref={stage} data-sounding={sounding || undefined}>
              <p key={verse} className={covered ? 'tj-verse is-covered' : 'tj-verse'} lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT), opacity: fontReady ? undefined : 0 }}>
                {current.words.map((word, w) => {
                  const timed = WORDS.find((it) => it.first === word.first)!;
                  const letters = TIMELINE.letters.slice(word.first, word.last + 1).map((l) => (
                    <span
                      key={l.index}
                      data-i={l.index}
                      data-rule={l.rule}
                      className={['tj-letter', l.index <= reached ? 'is-done' : '', l.index === now && sounding ? 'is-now' : ''].join(' ')}
                    >{shownText(l)}</span>
                  ));
                  const saying = sounding && nowWord?.index === timed.index;
                  const look = ['tj-word', saying ? 'is-saying' : '', w === 0 ? 'is-first' : ''].join(' ');
                  return timed.rules.length && !covered
                    ? <button key={w} className={look} onClick={(e) => onWord(e, timed.rules)}>{letters}</button>
                    : <span key={w} className={look}>{letters}</span>;
                }).flatMap((node, i, all) => {
                  // The verse's number stays on the line of its last word.
                  const last = i === all.length - 1;
                  const piece = last
                    ? <span key="end" className="tj-nowrap">{node} <span className={reached >= current.last ? 'tj-ayah-end is-done' : 'tj-ayah-end'} aria-hidden>{toArabicDigits(current.ayah)}</span></span>
                    : node;
                  return i ? [' ', piece] : [piece];
                })}
              </p>

              {guide && (
                <span className="tj-guide" style={{ transform: `translate(${guide.x + guide.w / 2}px, ${guide.y}px)` }} aria-hidden>
                  <Star size={20} strokeWidth={2} fill="currentColor" />
                </span>
              )}
              {popBox && pop !== undefined && (
                <span key={pop} className="tj-pop" data-rule={TIMELINE.letters[pop].rule} style={{ left: popBox.x + popBox.w / 2, top: popBox.y }} aria-hidden>
                  <RuleMark rule={TIMELINE.letters[pop].rule!} size={16} />
                </span>
              )}
              {maddBox && madd !== undefined && (
                <span
                  key={madd}
                  className="tj-ribbon"
                  data-rule={TIMELINE.letters[madd].rule}
                  data-full={now > madd || undefined}
                  style={{ left: maddBox.x + maddBox.w / 2, top: maddBox.y + maddBox.h, '--n': HELD_COUNTS[TIMELINE.letters[madd].rule!] } as CSSProperties}
                  aria-hidden
                >
                  {Array.from({ length: HELD_COUNTS[TIMELINE.letters[madd].rule!]! }, (_, i) => <span key={i} className="tj-bead" style={{ '--i': i } as CSSProperties}>{i + 1}</span>)}
                </span>
              )}
            </div>

            <div className="tj-now">
              {turn?.phase === 'check' ? (
                <div className="tj-turn" role="group" aria-label={tx(T.didYou)}>
                  <p>{tx(T.didYou)}</p>
                  {takes.has(turn.ayah) && (
                    <div className="tj-check">
                      <button className="tj-pill tj-hear" aria-pressed={hearing === 'me'} onClick={() => (hearing === 'me' ? hush() : hearMe(turn.ayah))}><Mic size={18} strokeWidth={2.5} />{tx(T.listenMe)}</button>
                      <button className="tj-pill tj-hear" aria-pressed={hearing === 'sheikh'} onClick={() => (hearing === 'sheikh' ? hush() : hearSheikh(turn.ayah))}><User size={18} strokeWidth={2.5} />{tx(T.listenSheikh)}</button>
                    </div>
                  )}
                  <div className="tj-check">
                    <button className="tj-pill tj-pill-go" onClick={() => answer(true)}><Check size={20} strokeWidth={3} />{tx(T.yes)}</button>
                    <button className="tj-pill" onClick={() => answer(false)}><RotateCcw size={18} strokeWidth={2.5} />{tx(T.notYet)}</button>
                  </div>
                </div>
              ) : turn?.phase === 'compare' ? (
                <div className="tj-turn" role="group" aria-label={tx(T.compareHint)}>
                  <p>{tx(T.compareHint)}</p>
                  <div className="tj-check">
                    <button className="tj-pill tj-hear" aria-pressed={hearing === 'me'} onClick={() => (hearing === 'me' ? hush() : hearMe(turn.ayah))}><Mic size={18} strokeWidth={2.5} />{tx(T.listenMe)}</button>
                    <button className="tj-pill tj-hear" aria-pressed={hearing === 'sheikh'} onClick={() => (hearing === 'sheikh' ? hush() : hearSheikh(turn.ayah))}><User size={18} strokeWidth={2.5} />{tx(T.listenSheikh)}</button>
                  </div>
                  <div className="tj-check">
                    <button className="tj-pill" onClick={() => compareDone(true)}><RotateCcw size={18} strokeWidth={2.5} />{tx(T.recordAgain)}</button>
                    <button className="tj-pill tj-pill-go" onClick={() => compareDone(false)}><Check size={20} strokeWidth={3} />{tx(T.nextVerse)}</button>
                  </div>
                </div>
              ) : turn ? (
                <div className="tj-turn" role="status">
                  <p>{recorder.status === 'recording' ? <><span className="tj-rec-dot" aria-hidden />{tx(T.recording)}</> : tx(MODE === 'memorise' ? T.coverHint : T.yourTurnHint)}</p>
                  <span className="tj-turn-bar" style={{ '--ms': `${turn.ms}ms` } as CSSProperties} aria-hidden />
                  {covered && <button className="tj-pill tj-peek" onClick={() => setPeeking(true)}><Eye size={18} strokeWidth={2.5} />{tx(T.peek)}</button>}
                </div>
              ) : lastRule?.rule ? (
                <button key={lastRule.index} className="tj-chip tj-chip-now" data-rule={lastRule.rule} onClick={() => openCard(lastRule.index)}>
                  <span className="tj-dot"><RuleMark rule={lastRule.rule} size={15} /></span>
                  <span>{tx(RULE_TEXT[lastRule.rule].name)}</span>
                  {lang !== 'ar' && <span className="tj-chip-arabic" lang="ar" dir="rtl">{RULE_TEXT[lastRule.rule].name.ar}</span>}
                </button>
              ) : (
                <p className="tj-hint"><Hand size={18} strokeWidth={2.5} aria-hidden />{tx(started ? T.tapHint : T.hint)}</p>
              )}
            </div>

            {status === 'error' && (
              <div className="tj-over" role="alert">
                <p>{tx(T.loadError)}</p>
                <button className="tj-pill tj-pill-go" onClick={retry}><RotateCcw size={18} strokeWidth={2.5} />{tx(T.retry)}</button>
              </div>
            )}
            {finished && (
              <div className="tj-over tj-done" role="status">
                <div className="tj-burst" aria-hidden>
                  {Array.from({ length: 10 }, (_, i) => <Star key={i} size={22} fill="currentColor" strokeWidth={0} style={{ '--i': i } as CSSProperties} />)}
                </div>
                <h2>{tx(T.doneTitle)}</h2>
                <p>{tx(T.doneText)}</p>
                {result && (
                  <div className="tj-won" aria-label={tx(T.stars)}>
                    {STARS.map((star, i) => (
                      <Star
                        key={star}
                        size={44}
                        strokeWidth={2}
                        className={[result.progress.surahs[SURAH]?.[star] ? 'is-won' : '', result.stars.includes(star) ? 'is-new' : ''].join(' ')}
                        style={{ '--i': i } as CSSProperties}
                        fill="currentColor"
                        aria-hidden
                      />
                    ))}
                  </div>
                )}
                {result?.awards.map((id) => (
                  <p key={id} className="tj-new-award"><Medal size={20} strokeWidth={2.5} aria-hidden /><strong>{tx(T.newAward)}</strong> {tx(AWARD_TEXT[id].name)}</p>
                ))}
                <div className="tj-done-actions">
                  {!TRIAL && nextSurah && result && isOpen(result.progress, nextSurah.n) && (
                    <a className="tj-pill tj-pill-go" href={gameUrl(nextSurah.n)}>{tx(T.nextSurah)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></a>
                  )}
                  <a className="tj-pill" href={gameUrl()}>{tx(T.backToMap)}</a>
                  <button className="tj-pill" onClick={restart}><RotateCcw size={18} strokeWidth={2.5} />{tx(T.startAgain)}</button>
                </div>
              </div>
            )}
          </section>

          <div className="tj-controls">
            <button className="tj-btn" onClick={() => goAyah(0, true)} aria-label={tx(T.again)} title={tx(T.again)}><RotateCcw size={24} strokeWidth={2.5} /></button>
            <button className="tj-btn" onClick={() => goAyah(-1, playing)} disabled={ayah === 0} aria-label={tx(T.prev)} title={tx(T.prev)}><SkipBack size={22} strokeWidth={2.5} fill="currentColor" className="tj-flip" /></button>
            <button className={started && status === 'loading' ? 'tj-play is-waiting' : 'tj-play'} onClick={toggle} aria-label={tx(sounding ? T.pause : T.play)}>
              {sounding ? <Pause size={38} strokeWidth={0} fill="currentColor" /> : <Play size={38} strokeWidth={0} fill="currentColor" className="tj-play-icon" />}
            </button>
            <button className="tj-btn" onClick={() => goAyah(1, playing)} disabled={ayah === AYAHS.length - 1} aria-label={tx(T.next)} title={tx(T.next)}><SkipForward size={22} strokeWidth={2.5} fill="currentColor" className="tj-flip" /></button>
            <button className="tj-btn tj-toggle" onClick={() => setSlow((s) => !s)} aria-pressed={slow} aria-label={tx(T.slow)} title={tx(T.slow)}><Turtle size={26} strokeWidth={2.2} /></button>
          </div>
          <div className="tj-options">
            {(myTurn || MODE === 'memorise') && (
              <button className="tj-pill tj-toggle tj-stops tj-record" onClick={() => void toggleRecord()} aria-pressed={recordOn} disabled={recorder.status === 'asking'}>
                <span className="tj-switch" aria-hidden />{recordOn ? <Mic size={18} strokeWidth={2.5} aria-hidden /> : <MicOff size={18} strokeWidth={2.5} aria-hidden />}{tx(T.recordMe)}
              </button>
            )}
            {MODE !== 'memorise' && (
              <button className="tj-pill tj-toggle tj-stops" onClick={() => setMyTurn((on) => !on)} aria-pressed={myTurn}>
                <span className="tj-switch" aria-hidden />{tx(T.myTurn)}
              </button>
            )}
            <button className="tj-pill tj-toggle tj-stops" onClick={() => setStops((s) => !s)} aria-pressed={stops}>
              <span className="tj-switch" aria-hidden />{tx(T.stops)}
            </button>
          </div>
          {recorder.status === 'denied' && <p className="tj-mic-off" role="alert">{tx(T.micDenied)}</p>}
          {/* The first trial on Al-Fatihah: the same recitation timed by hand or by the aligner, to compare by ear. */}
          {TRIAL && (
            <div className="tj-timing" role="group" aria-label={tx(T.timing)}>
              <span>{tx(T.timing)}</span>
              <button className="tj-pill" aria-pressed={TRIAL === 'hand'} onClick={() => switchTrial('hand')}>{tx(T.timingHand)}</button>
              <button className="tj-pill" aria-pressed={TRIAL === 'mms'} onClick={() => switchTrial('mms')}>{tx(T.timingMachine)}</button>
            </div>
          )}
        </main>

        <aside className="tj-key" aria-labelledby="tj-key-title">
          <h2 id="tj-key-title">{tx(T.key)}</h2>
          <ul>
            {RULES_USED.map((rule) => (
              <li key={rule}>
                <button className="tj-chip" data-rule={rule} onClick={() => onRule(rule)}>
                  <span className="tj-dot"><RuleMark rule={rule} size={15} /></span>
                  <span className="tj-chip-names">
                    <span>{tx(RULE_TEXT[rule].name)}</span>
                    {lang !== 'ar' && <span className="tj-chip-arabic" lang="ar" dir="rtl">{RULE_TEXT[rule].name.ar}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {card !== null && (
        <RuleCard
          letter={card}
          soundNow={soundNow}
          listening={listening}
          panel={cardPanel}
          onPick={setCard}
          onListen={listen}
          onCarryOn={() => closeCard(true)}
          onClose={dismissCard}
        />
      )}
    </div>
  );
}
