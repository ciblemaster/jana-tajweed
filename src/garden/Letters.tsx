import { ArrowLeft, Check, Medal, RotateCcw, Star, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { TajweedLetter } from '../core';
import { APP_TEXT as A } from '../core/appTexts';
import { ensureFonts, fontStack } from '../core/fonts';
import { fill, useLang, useText } from '../core/lang';
import { bandRules, currentProfile } from '../profiles/store';
import { earnLevel, readProgress } from '../tajweed/progress';
import { gameUrl, lessonUrl, surahInfo, surahName } from '../tajweed/surahs';
import { DISPLAY_FONT, MUSHAF_FONT } from '../tajweed/theme';
import type { ExampleWord } from './examples';
import { useWords } from './Lesson';
import type { Level } from './levels';
import { ALPHABET, findLetterExamples, hasMark, makeLetterRounds, markShape, ZONES, type LetterExamples, type LetterRound, type Zone } from './sounds';
import { WordView } from './WordView';
import '../tajweed/tajweed.css';
import './garden.css';

const STEPS = ['meet', 'where', 'marks', 'boss'] as const;
type Step = (typeof STEPS)[number];
const PASS_SHARE = 0.8;

/** A head from the side with the place a sound is made lit up. */
export function Mouth({ zone, size = 64 }: { zone: Zone; size?: number }) {
  const spot = { throat: [44, 74], tongue: [62, 58], lips: [83, 56] }[zone];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="jg-mouth">
      <path d="M40 92 V76 C26 70 20 56 22 40 C24 20 40 8 58 10 C74 12 84 24 84 38 L90 50 L84 52 L86 56 L84 60 C84 66 80 70 72 70 L62 72 V92" fill="#ffe3c2" stroke="#2b3550" strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 60 Q66 54 80 58" fill="none" stroke="#e57373" strokeWidth="4" strokeLinecap="round" />
      <circle cx={spot[0]} cy={spot[1]} r="10" fill="var(--zone)" fillOpacity="0.85" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

interface GameProps {
  ex: LetterExamples;
  rounds: LetterRound[];
  practice: boolean;
  words: ReturnType<typeof useWords>;
  onDone: (right: number) => void;
}

/** Questions on where a sound is made, or which letter carries a mark. */
function LettersGame({ ex, rounds, practice, words, onDone }: GameProps) {
  const tx = useText();
  const [at, setAt] = useState(0);
  const [right, setRight] = useState(0);
  const [tries, setTries] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; final: boolean; zone?: Zone; letter?: number } | null>(null);
  const round = rounds[at];

  const settle = (ok: boolean, picked: { zone?: Zone; letter?: number }) => {
    if (answer?.final) return;
    if (!ok && practice && tries === 0) {
      setTries(1);
      setAnswer({ ok: false, final: false, ...picked });
      window.setTimeout(() => setAnswer((a) => (a && !a.final ? null : a)), 900);
      return;
    }
    if (ok) setRight((n) => n + 1);
    setAnswer({ ok, final: true, ...picked });
    words.playWord(round.word);
  };

  const next = () => {
    words.stop();
    if (at + 1 >= rounds.length) return onDone(right);
    setAt(at + 1);
    setTries(0);
    setAnswer(null);
  };

  const finished = !!answer?.final;
  const showMark = round.kind === 'mark' && finished;
  const firstWithMark = round.kind === 'mark' ? round.word.letters.find((l) => hasMark(l, round.mark))?.index : undefined;

  return (
    <div className="jg-game">
      <p className="jg-count">{fill(tx(A.question), { n: at + 1, m: rounds.length })}</p>
      <div className="jg-prompt">
        {round.kind === 'where' ? (
          <p>{tx(A.whereAsk)}</p>
        ) : (
          <>
            <p>{tx(A.tapMark)}</p>
            <span className="tj-chip jg-chip-still jg-mark-chip">
              <span className="jg-mark-shape" lang="ar" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>{markShape(round.mark)}</span>
              <span>{tx(A[round.mark])}</span>
            </span>
          </>
        )}
      </div>
      <div className="jg-stage" data-answer={answer ? (answer.ok ? 'right' : 'wrong') : undefined}>
        <WordView
          timeline={ex.timeline}
          word={round.word}
          coloured={() => false}
          marked={round.kind === 'where' ? round.letter.index : showMark && !answer!.ok ? firstWithMark : undefined}
          now={words.playingWord === round.word ? words.now : undefined}
          wrong={answer && !answer.ok ? answer.letter : undefined}
          onLetter={round.kind === 'mark' && !finished ? (l: TajweedLetter) => settle(hasMark(l, round.mark), { letter: l.index }) : undefined}
        />
        <button className="tj-pill jg-listen" onClick={() => words.playWord(round.word)}><Volume2 size={18} strokeWidth={2.5} />{tx(A.listenWord)}</button>
      </div>
      {round.kind === 'where' && (
        <div className="jg-options jg-zones">
          {ZONES.map((z) => (
            <button
              key={z}
              className="jg-zone"
              data-zone={z}
              data-state={finished && z === round.zone ? 'right' : answer && !answer.ok && answer.zone === z ? 'wrong' : undefined}
              onClick={finished ? undefined : () => settle(z === round.zone, { zone: z })}
            >
              <Mouth zone={z} />
              <span>{tx(A[z])}</span>
            </button>
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

/** Level 0: meet the letters, find where each sound is made, read the marks, then the challenge. */
export default function Letters({ level }: { level: Level }) {
  const tx = useText();
  const lang = useLang();
  const band = bandRules(currentProfile()?.band);
  const [ex, setEx] = useState<LetterExamples | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState<Step>('meet');
  const [picked, setPicked] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ right: number; of: number; passed: boolean } | null>(null);
  const words = useWords(ex, band.slow);

  useEffect(() => {
    void ensureFonts([MUSHAF_FONT, DISPLAY_FONT, 'Noto Naskh Arabic']);
    document.title = `${tx(level.name)} · Jana Tajweed`;
    findLetterExamples().then(setEx, () => setFailed(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const whereRounds = useMemo(() => (ex ? makeLetterRounds(ex, band.rounds, 'where') : []), [ex, band.rounds]);
  const markRounds = useMemo(() => (ex ? makeLetterRounds(ex, band.rounds, 'mark') : []), [ex, band.rounds]);
  const bossRounds = useMemo(() => (ex ? makeLetterRounds(ex, Math.max(6, band.rounds), 'both') : []), [ex, band.rounds, round]); // eslint-disable-line react-hooks/exhaustive-deps
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

  const hear = (letter: string) => {
    const found = ex?.byLetter.get(letter);
    setPicked(letter);
    if (found) words.playWord(found.word);
  };

  const shown: { word: ExampleWord; letter: TajweedLetter } | undefined = picked ? ex?.byLetter.get(picked) : undefined;
  const surah = ex ? surahInfo(ex.surah) : undefined;
  const done = readProgress().garden[level.id]?.done;
  const nextUp = (to: Step) => <button className="tj-pill tj-pill-go jg-next" onClick={() => go(to)}>{tx(A.next)}<ArrowLeft size={18} strokeWidth={2.5} className="tj-flip tj-forward" /></button>;

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
            onClick={() => ex && go(s)}
            disabled={!ex}
          >
            <span className="jg-step-dot">{STEPS.indexOf(step) > i ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
            <span className="jg-step-name">{tx(A[s])}</span>
          </button>
        ))}
      </nav>

      <main className="jg-main" id="main">
        {failed ? (
          <div className="jg-card"><p>{tx(A.offline)}</p></div>
        ) : !ex ? (
          <div className="jg-card jg-wait" role="status"><p>{tx(A.loading)}</p></div>
        ) : step === 'meet' ? (
          <div className="jg-card">
            <p className="jg-lead">{tx(A.lettersMeet)}</p>
            {/* The mushaf font draws a lone ya without its dots: the letters on their own are in Naskh. */}
            <div className="jg-alphabet" lang="ar" dir="rtl" style={{ fontFamily: fontStack('Noto Naskh Arabic') }}>
              {ALPHABET.map((l) => (
                <button key={l} className="jg-abc" aria-pressed={picked === l} disabled={!ex.byLetter.has(l)} onClick={() => hear(l)}>{l}</button>
              ))}
            </div>
            {shown && (
              <div className="jg-stage" key={picked}>
                <WordView timeline={ex.timeline} word={shown.word} coloured={() => false} marked={shown.letter.index} now={words.playingWord === shown.word ? words.now : undefined} />
                <button className="tj-pill jg-listen" onClick={() => words.playWord(shown.word)}><Volume2 size={18} strokeWidth={2.5} />{tx(A.listenWord)}</button>
              </div>
            )}
            {nextUp('where')}
          </div>
        ) : step === 'where' ? (
          <div className="jg-card">
            <p className="jg-lead">{tx(A.whereHint)}</p>
            <LettersGame key={`where-${round}`} ex={ex} rounds={whereRounds} practice words={words} onDone={() => go('marks')} />
          </div>
        ) : step === 'marks' ? (
          <div className="jg-card">
            <LettersGame key={`marks-${round}`} ex={ex} rounds={markRounds} practice words={words} onDone={() => go('boss')} />
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
              {!result.passed && <button className="tj-pill tj-pill-go" onClick={() => { setResult(null); setRound((n) => n + 1); }}><RotateCcw size={18} strokeWidth={2.5} />{tx(A.again)}</button>}
              {result.passed && <a className="tj-pill tj-pill-go" href={lessonUrl('madd')}>{tx(A.maddName)}</a>}
              <a className="tj-pill" href={gameUrl()}>{tx(A.toGarden)}</a>
            </div>
          </div>
        ) : (
          <div className="jg-card">
            <p className="jg-lead jg-boss-hint">{fill(tx(A.bossHint), { n: need })}</p>
            <LettersGame key={`boss-${round}`} ex={ex} rounds={bossRounds} practice={false} words={words} onDone={finishBoss} />
          </div>
        )}
      </main>
    </div>
  );
}
