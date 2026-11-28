import { RotateCcw, Volume2 } from 'lucide-react';
import { APP_TEXT as A } from '../core/appTexts';
import { fontStack } from '../core/fonts';
import { fill, toArabicDigits, useLang, useText } from '../core/lang';
import type { VerseCheck, VerseFix } from '../parents/requests';
import { MUSHAF_FONT } from './theme';

/** The most corrections shown for one verse: a child works on a few at a time. */
export const FIXES_SHOWN = 3;

/** The corrections of a verse, most needed first. A check kept before corrections were listed falls back to its tip. */
export function fixesOf(check: VerseCheck): VerseFix[] {
  if (check.fixes) return check.fixes;
  const { tip } = check;
  return tip.kind === 'great' ? [] : tip.kind === 'say' ? [tip] : [{ ...tip, hum: false }];
}

/**
 * At the end of a surah: each verse the voice check heard with something to correct, the word and what to do, a
 * button to hear the sheikh say that word, and one to practise the verse again.
 */
export function Corrections({ checks, waiting, hearing, onHear, onPractise }: {
  /** The verses heard, in order, by their place in the surah's verses. */
  checks: [number, VerseCheck][];
  /** Whether some verses are still being heard. */
  waiting: boolean;
  /** The word whose sheikh recitation is playing, as `verse:word`. */
  hearing: string | null;
  onHear: (at: number, word: number) => void;
  onPractise: (at: number) => void;
}) {
  const tx = useText();
  const lang = useLang();
  const toFix = checks.filter(([, c]) => fixesOf(c).length);
  const say = (f: VerseFix, words: string[]) => {
    const word = words[f.word];
    if (f.kind === 'hold') return fill(tx(f.hum ? A.fixHum : A.tipHold), { word, n: f.counts });
    return fill(tx(f.kind === 'say' ? A.tipSay : A.fixAlmost), { word });
  };

  return (
    <section className="tj-fixes" aria-live="polite">
      <h3>{tx(A.fixesTitle)} <small className="tj-trial">{tx(A.trial)}</small></h3>
      {!toFix.length && !waiting && <p className="tj-voice-tip">{tx(A.fixesNone)}</p>}
      {toFix.map(([at, check]) => (
        <article key={at} className="tj-fix-verse">
          <p className="tj-fix-label">{fill(tx(A.fixesVerse), { n: lang === 'ar' ? toArabicDigits(check.ayah) : check.ayah })}</p>
          <p className="tj-voice-words" lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>
            {check.words.map((w, i) => <span key={i} data-state={check.states[i]}>{w}</span>)}
          </p>
          <ul>
            {fixesOf(check).slice(0, FIXES_SHOWN).map((f) => (
              <li key={`${f.kind}-${f.word}`} data-kind={f.kind}>
                <span>{say(f, check.words)}</span>
                <button
                  className="tj-pill tj-hear"
                  aria-pressed={hearing === `${at}:${f.word}`}
                  onClick={() => onHear(at, f.word)}
                >
                  <Volume2 size={18} strokeWidth={2.5} aria-hidden />{tx(A.hearWord)}
                </button>
              </li>
            ))}
          </ul>
          <button className="tj-pill" onClick={() => onPractise(at)}><RotateCcw size={18} strokeWidth={2.5} aria-hidden />{tx(A.practiseVerse)}</button>
        </article>
      ))}
      {waiting && <p className="tj-voice-tip">{tx(A.fixesWaiting)}</p>}
    </section>
  );
}
