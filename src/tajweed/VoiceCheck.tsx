import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { judgeRecitation, type CheckLetter, type TajweedTimeline, type VoiceResult } from '../core';
import { checkRecitation } from '../account/voice';
import { APP_TEXT as A } from '../core/appTexts';
import { fontStack } from '../core/fonts';
import { fill, useText } from '../core/lang';
import { MUSHAF_FONT } from './theme';

/** The sheikh's recitation of a verse as the aligner is given it, with each word's text to show. */
export function verseForCheck(timeline: TajweedTimeline, verseIndex: number): { letters: CheckLetter[]; words: string[] } {
  const verse = timeline.verses[verseIndex];
  const letters: CheckLetter[] = [];
  const words = verse.words.map((w, wi) => {
    const own = timeline.letters.slice(w.first, w.last + 1);
    own.forEach((l) => letters.push({ text: l.text, rule: l.rule ?? null, word: wi }));
    return own.map((l) => l.text).join('');
  });
  return { letters, words };
}

/**
 * "Check my reading": sends the child's take of a verse, then shows each word green, orange or grey, and one tip.
 * Shown only when a grown-up turned voice feedback on for this device.
 */
export function VoiceCheck({ timeline, verseIndex, takeUrl }: { timeline: TajweedTimeline; verseIndex: number; takeUrl: string }) {
  const tx = useText();
  const [state, setState] = useState<'idle' | 'checking' | 'failed'>('idle');
  const [result, setResult] = useState<VoiceResult | null>(null);
  const { letters, words } = verseForCheck(timeline, verseIndex);

  const check = async () => {
    setState('checking');
    const blob = await fetch(takeUrl).then((r) => r.blob()).catch(() => null);
    const heard = blob ? await checkRecitation(letters, blob) : null;
    if (!heard) return setState('failed');
    setResult(judgeRecitation(letters, heard));
    setState('idle');
  };

  const tip = result?.tip;
  return (
    <div className="tj-voice" aria-live="polite">
      {result ? (
        <>
          <p className="tj-voice-words" lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>
            {words.map((w, i) => <span key={i} data-state={result.words[i]}>{w}</span>)}
          </p>
          <p className="tj-voice-tip">
            {tip?.kind === 'great' ? tx(A.tipGreat) : tip?.kind === 'say' ? fill(tx(A.tipSay), { word: words[tip.word] }) : tip ? fill(tx(A.tipHold), { word: words[tip.word], n: tip.counts }) : null}
          </p>
        </>
      ) : (
        <button className="tj-pill" onClick={() => void check()} disabled={state === 'checking'}>
          <Sparkles size={18} strokeWidth={2.5} aria-hidden />{tx(state === 'checking' ? A.checking : A.checkMe)}<small className="tj-trial">{tx(A.trial)}</small>
        </button>
      )}
      {state === 'failed' && <p className="tj-voice-tip" role="alert">{tx(A.voiceFailed)}</p>}
    </div>
  );
}
