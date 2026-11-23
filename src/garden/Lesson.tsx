import { ArrowLeft, Check, Medal, Mic, Play, RotateCcw, Square, Star, User, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { tajweedLetterAt, type TajweedLetter, type TajweedRule } from '../core';
import { APP_TEXT as A } from '../core/appTexts';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, useLang, useText } from '../core/lang';
import { RULE_TEXT } from '../core/texts';
import { bandRules, currentProfile } from '../profiles/store';
import { RuleMark } from '../tajweed/letters';
import { earnLevel, noteAnswer, readProgress } from '../tajweed/progress';
import { gameUrl, surahInfo, surahName } from '../tajweed/surahs';
import { DISPLAY_FONT, MUSHAF_FONT } from '../tajweed/theme';
import { useRecitation } from '../tajweed/useRecitation';
import { useRecorder } from '../tajweed/useRecorder';
import { findExamples, makeRounds, type ExampleWord, type Examples, type Round } from './examples';
import type { Level } from './levels';
import { WordView } from './WordView';
import '../tajweed/tajweed.css';
import './garden.css';

const STEPS = ['meet', 'hear', 'spot', 'say', 'boss'] as const;
type Step = (typeof STEPS)[number];
/** A word is played from a little before it starts to a little after it ends, so no sound is clipped. */
const LEAD_MS = 60;
const TAIL_MS = 120;
/** The share of the challenge a child must get right to finish the level. */
const PASS_SHARE = 0.8;

/** The words a lesson plays: one recording, and the letter being said while a word plays. */
export function useWords(examples: Examples | null, slow: boolean) {
  const [now, setNow] = useState(-1);
  const [playingWord, setPlayingWord] = useState<ExampleWord | null>(null);
  const timeline = examples?.timeline;
  const onTick = useCallback((ms: number) => {
    if (timeline) setNow(tajweedLetterAt(timeline, ms));
  }, [timeline]);
  const onEnd = useCallback(() => {
    setPlayingWord(null);
    setNow(-1);
  }, []);
  const { play, pause, setRate, status } = useRecitation(timeline?.audioUrl ?? '', onTick, onEnd);
  useEffect(() => setRate(slow ? 0.75 : 1), [slow, status, setRate]);

  const playWord = useCallback((word: ExampleWord, then?: () => void) => {
    setPlayingWord(word);
    play({
      fromMs: word.startMs - LEAD_MS,
      untilMs: word.endMs + TAIL_MS,
      onDone: () => {
        setPlayingWord(null);
        setNow(-1);
        then?.();
      }
    });
  }, [play]);

  const stop = useCallback(() => {
    pause();
    setPlayingWord(null);
    setNow(-1);
  }, [pause]);

  return { now, playingWord, playWord, stop, status };
}

/** A rule's chip: its mark in its colour, its name, and its Arabic name. */
export function RuleChip({ rule, onClick, state }: { rule: TajweedRule; onClick?: () => void; state?: 'right' | 'wrong' }) {
  const tx = useText();
  const lang = useLang();
  const inner = (
    <>
      <span className="tj-dot"><RuleMark rule={rule} size={15} /></span>
      <span className="tj-chip-names">
        <span>{tx(RULE_TEXT[rule].name)}</span>
        {lang !== 'ar' && <span className="tj-chip-arabic" lang="ar" dir="rtl">{RULE_TEXT[rule].name.ar}</span>}
      </span>
    </>
  );
  return onClick
    ? <button className="tj-chip jg-option" data-rule={rule} data-state={state} onClick={onClick}>{inner}</button>
    : <span className="tj-chip jg-chip-still" data-rule={rule}>{inner}</span>;
}

interface GameProps {
  examples: Examples;
  rounds: Round[];
  /** Practice gives a second try and shows the answer; the challenge does neither. */
  practice: boolean;
  hints: boolean;
  words: ReturnType<typeof useWords>;
  onDone: (right: number) => void;
}

/** A run of questions: find the letter with a rule, or name the rule of a marked letter. */
export function Game({ examples, rounds, practice, hints, words, onDone }: GameProps) {
  const tx = useText();
  const [at, setAt] = useState(0);
  const [right, setRight] = useState(0);
  const [tries, setTries] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; final: boolean; letter?: number; rule?: TajweedRule } | null>(null);
  const round = rounds[at];
  const target = round.kind === 'tap' ? round.word.marked.find((l) => l.rule === round.rule)! : round.letter;

  const settle = (ok: boolean, picked: { letter?: number; rule?: TajweedRule }) => {
    if (answer) return;
    noteAnswer(target.rule!, ok);
    if (!ok && practice && hints && tries === 0) {
      // One more try: the wrong answer shakes for a moment, then the question is open again.
      setTries(1);
      setAnswer({ ok: false, final: false, ...picked });
      window.setTimeout(() => setAnswer((a) => (a && !a.final ? null : a)), 900);
      return;
    }
    // A second try that is right still counts: the child found it.
    if (ok) setRight((n) => n + 1);
    setAnswer({ ok, final: true, ...picked });
    words.playWord(round.word);
  };

  const onLetter = (letter: TajweedLetter) => {
    if (round.kind !== 'tap') return;
    settle(letter.rule === round.rule, { letter: letter.index });
  };

  const next = () => {
    words.stop();
    if (at + 1 >= rounds.length) return onDone(right);
    setAt(at + 1);
    setTries(0);
    setAnswer(null);
  };

  const finished = !!answer?.final;
  const reveal = finished && !answer!.ok;
  // Before an answer, only the rule asked about stays hidden; after it, the word shows all its colours.
  const coloured = (l: TajweedLetter) => !!finished && (l.index === target.index || examples.rules.includes(l.rule!));

  return (
    <div className="jg-game">
      <p className="jg-count">{fill(tx(A.question), { n: at + 1, m: rounds.length })}</p>
      <div className="jg-prompt">
        {round.kind === 'tap' ? (
          <>
            <p>{tx(A.tapRule)}</p>
            <RuleChip rule={round.rule} />
          </>
        ) : (
          <p>{tx(A.whichRule)}</p>
        )}
      </div>
      <div className="jg-stage" data-answer={answer ? (answer.ok ? 'right' : 'wrong') : undefined}>
        <WordView
          timeline={examples.timeline}
          word={round.word}
          coloured={coloured}
          marked={round.kind === 'which' || reveal ? target.index : undefined}
          now={words.playingWord === round.word ? words.now : undefined}
          wrong={answer && !answer.ok ? answer.letter : undefined}
          onLetter={round.kind === 'tap' && !finished ? onLetter : undefined}
        />
        <button className="tj-pill jg-listen" onClick={() => words.playWord(round.word)}><Volume2 size={18} strokeWidth={2.5} />{tx(A.listenWord)}</button>
      </div>
      {round.kind === 'which' && (
        <div className="jg-options">
          {round.options.map((rule) => (
            <RuleChip
              key={rule}
              rule={rule}
              state={finished && rule === round.letter.rule ? 'right' : answer && !answer.ok && answer.rule === rule ? 'wrong' : undefined}
              onClick={finished ? undefined : () => settle(rule === round.letter.rule, { rule })}
            />
          ))}
        </div>
      )}
      <div className="jg-feedback" role="status">
        {answer && <p className={answer.ok ? 'jg-right' : 'jg-wrong-text'}>{tx(answer.ok ? A.right : finished ? A.wrong : A.tryAgain)}</p>}
      </div>
      {finished && <button className="tj-pill tj-pill-go jg-next" onClick={next}>{tx(A.next)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></button>}
    </div>
  );
}

/** The child says one word after the sheikh, then hears both. */
function SayIt({ examples, words, onDone }: { examples: Examples; words: ReturnType<typeof useWords>; onDone: () => void }) {
  const tx = useText();
  const recorder = useRecorder();
  const word = examples.words[0];
  const [take, setTake] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    audio.current?.pause();
    recorder.disable();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    if (take) URL.revokeObjectURL(take);
  }, [take]);

  const record = async () => {
    words.stop();
    if (recorder.status === 'recording') {
      const blob = await recorder.stop();
      if (blob) setTake(URL.createObjectURL(blob));
      return;
    }
    if (await recorder.enable()) recorder.start();
  };

  const hearMe = () => {
    if (!take) return;
    words.stop();
    audio.current ??= new Audio();
    audio.current.src = take;
    void audio.current.play();
  };

  return (
    <div className="jg-say">
      <p className="jg-lead">{tx(A.sayHint)}</p>
      <div className="jg-stage">
        <WordView
          timeline={examples.timeline}
          word={word}
          coloured={(l) => examples.rules.includes(l.rule!)}
          now={words.playingWord === word ? words.now : undefined}
        />
      </div>
      <div className="jg-say-actions">
        <button className="tj-pill" onClick={() => words.playWord(word)}><User size={18} strokeWidth={2.5} />{tx(A.listenWord)}</button>
        <button className={recorder.status === 'recording' ? 'tj-pill jg-recording' : 'tj-pill'} onClick={() => void record()} disabled={recorder.status === 'asking' || recorder.status === 'denied'}>
          {recorder.status === 'recording' ? <><Square size={16} strokeWidth={0} fill="currentColor" />{tx(A.stop)}</> : <><Mic size={18} strokeWidth={2.5} />{tx(A.record)}</>}
        </button>
        {take && <button className="tj-pill" onClick={hearMe}><Play size={18} strokeWidth={2.5} fill="currentColor" />{tx({ en: 'My voice', ar: 'صوتي', fr: 'Ma voix' })}</button>}
      </div>
      {recorder.status === 'denied' && <p className="tj-mic-off" role="alert">{tx({ en: 'The microphone is off. Ask a grown-up to allow it in the browser settings.', ar: 'الميكروفون مغلق. اطلب من أحد الكبار السماح به في إعدادات المتصفح.', fr: 'Le micro est coupé. Demande à un adulte de l’autoriser dans le navigateur.' })}</p>}
      <button className="tj-pill tj-pill-go jg-next" onClick={onDone}>{tx(take ? A.next : A.skip)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></button>
    </div>
  );
}

/**
 * One level of the Rule Garden, in five steps: meet each rule, hear it in real words, find it in a game, say a word
 * after the sheikh, and pass the challenge to finish the level.
 */
export default function Lesson({ level }: { level: Level }) {
  const tx = useText();
  const lang = useLang();
  const profile = currentProfile();
  const rules = bandRules(profile?.band);
  const [examples, setExamples] = useState<Examples | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState<Step>('meet');
  const [meetAt, setMeetAt] = useState(0);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ right: number; of: number; passed: boolean } | null>(null);
  const words = useWords(examples, rules.slow);

  useEffect(() => {
    void ensureFonts([MUSHAF_FONT, DISPLAY_FONT]);
    document.title = `${tx(level.name)} · Jana Tajweed`;
    findExamples(level.rules).then(setExamples, () => setFailed(true));
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  const practiceRounds = useMemo(() => (examples ? makeRounds(examples, rules.rounds) : []), [examples, rules.rounds, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const bossRounds = useMemo(() => (examples ? makeRounds(examples, Math.max(5, rules.rounds)) : []), [examples, rules.rounds, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const need = Math.ceil(bossRounds.length * PASS_SHARE);

  const go = (to: Step) => {
    words.stop();
    setStep(to);
    window.scrollTo({ top: 0 });
  };

  const finishBoss = (right: number) => {
    const passed = right >= need;
    earnLevel(level.id, right / bossRounds.length, passed);
    setResult({ right, of: bossRounds.length, passed });
  };

  const retry = () => {
    setResult(null);
    setRound((n) => n + 1);
  };

  const surah = examples ? surahInfo(examples.surah) : undefined;
  const meetRule = examples?.rules[meetAt];
  const meetWord = meetRule ? examples!.words.find((w) => w.marked.some((l) => l.rule === meetRule)) : undefined;
  const done = readProgress().garden[level.id]?.done;

  return (
    <div className="tj jg" style={{ '--tj-display': fontStack(DISPLAY_FONT) } as CSSProperties} data-rule={level.colour}>
      <header className="tj-top">
        <a className="tj-btn tj-back" href={gameUrl()} aria-label={tx(A.toGarden)}><ArrowLeft size={22} strokeWidth={2.5} className="tj-flip" /></a>
        <div className="tj-heading">
          <h1>{tx(level.name)}{done && <Star size={20} fill="currentColor" strokeWidth={0} className="jg-done-star" aria-hidden />}</h1>
          {surah && <p>{fill(tx(A.fromSurah), { surah: surahName(surah, lang) })}</p>}
        </div>
      </header>

      <nav className="jg-steps" aria-label={tx(level.name)}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            className={['jg-step', s === step ? 'is-current' : '', STEPS.indexOf(step) > i ? 'is-done' : ''].join(' ')}
            aria-current={s === step ? 'step' : undefined}
            onClick={() => examples && go(s)}
            disabled={!examples}
          >
            <span className="jg-step-dot">{STEPS.indexOf(step) > i ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
            <span className="jg-step-name">{tx(A[s])}</span>
          </button>
        ))}
      </nav>

      <main className="jg-main" id="main">
        {failed ? (
          <div className="jg-card"><p>{tx(A.offline)}</p></div>
        ) : !examples ? (
          <div className="jg-card jg-wait" role="status"><p>{tx(A.loading)}</p></div>
        ) : step === 'meet' && level.id === 'together' ? (
          // The last level meets nothing new: it shows every colour the child has learned, then mixes them.
          <div className="jg-card">
            <h2>{tx(level.name)}</h2>
            <p className="jg-lead">{tx(level.line!)}</p>
            <div className="jg-key">{examples.rules.map((r) => <RuleChip key={r} rule={r} />)}</div>
            <button className="tj-pill tj-pill-go jg-next" onClick={() => go('hear')}>{tx(A.next)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></button>
          </div>
        ) : step === 'meet' && meetRule ? (
          <div className="jg-card jg-meet" data-rule={meetRule} key={meetRule}>
            <span className="jg-hero"><RuleMark rule={meetRule} size={44} /></span>
            <h2>{tx(RULE_TEXT[meetRule].name)}</h2>
            {lang !== 'ar' && <p className="jg-arabic" lang="ar" dir="rtl">{RULE_TEXT[meetRule].name.ar}</p>}
            <p className="jg-lead">{tx(RULE_TEXT[meetRule].line)}</p>
            {meetWord && (
              <div className="jg-stage">
                <WordView
                  timeline={examples.timeline}
                  word={meetWord}
                  coloured={(l) => l.rule === meetRule}
                  now={words.playingWord === meetWord ? words.now : undefined}
                />
                <button className="tj-pill tj-pill-rule jg-listen" data-rule={meetRule} onClick={() => words.playWord(meetWord)}><Volume2 size={18} strokeWidth={2.5} />{tx(A.listenWord)}</button>
              </div>
            )}
            <p className="jg-count">{meetAt + 1} / {examples.rules.length}</p>
            <button
              className="tj-pill tj-pill-go jg-next"
              onClick={() => (meetAt + 1 < examples.rules.length ? (words.stop(), setMeetAt(meetAt + 1)) : go('hear'))}
            >{tx(A.next)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></button>
          </div>
        ) : step === 'hear' ? (
          <div className="jg-card">
            <p className="jg-lead">{tx(A.hearHint)}</p>
            <ul className="jg-words">
              {examples.words.slice(0, 6).map((w, i) => (
                <li key={i}>
                  <button className="jg-word-btn" onClick={() => words.playWord(w)} data-playing={words.playingWord === w || undefined}>
                    <WordView timeline={examples.timeline} word={w} coloured={(l) => examples.rules.includes(l.rule!)} now={words.playingWord === w ? words.now : undefined} size="small" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="jg-key">{examples.rules.map((r) => <RuleChip key={r} rule={r} />)}</div>
            <button className="tj-pill tj-pill-go jg-next" onClick={() => go('spot')}>{tx(A.next)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></button>
          </div>
        ) : step === 'spot' ? (
          <div className="jg-card">
            <Game key={`spot-${round}`} examples={examples} rounds={practiceRounds} practice hints={rules.hints} words={words} onDone={() => go('say')} />
          </div>
        ) : step === 'say' ? (
          <div className="jg-card">
            <SayIt examples={examples} words={words} onDone={() => go('boss')} />
          </div>
        ) : result ? (
          <div className="jg-card jg-result" role="status">
            {result.passed && (
              <div className="tj-burst" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => <Star key={i} size={22} fill="currentColor" strokeWidth={0} style={{ '--i': i } as CSSProperties} />)}
              </div>
            )}
            <span className="jg-hero" data-rule={level.colour}>{result.passed ? <Medal size={44} strokeWidth={2.2} /> : <RotateCcw size={40} strokeWidth={2.5} />}</span>
            <h2>{tx(result.passed ? A.passed : A.almost)}</h2>
            <p className="jg-score">{fill(tx(A.score), { n: result.right, m: result.of })}</p>
            <p className="jg-lead">{tx(result.passed ? A.passedText : A.almostText)}</p>
            <div className="jg-say-actions">
              {!result.passed && <button className="tj-pill tj-pill-go" onClick={retry}><RotateCcw size={18} strokeWidth={2.5} />{tx(A.again)}</button>}
              {result.passed && surah && <a className="tj-pill tj-pill-go" href={gameUrl(surah.n)}>{fill(tx(A.practiseSurah), { surah: surahName(surah, lang) })}</a>}
              <a className="tj-pill" href={gameUrl()}>{tx(A.toGarden)}</a>
            </div>
          </div>
        ) : (
          <div className="jg-card">
            <p className="jg-lead jg-boss-hint">{fill(tx(A.bossHint), { n: need })}</p>
            <Game key={`boss-${round}`} examples={examples} rounds={bossRounds} practice={false} hints={false} words={words} onDone={finishBoss} />
          </div>
        )}
      </main>
    </div>
  );
}
