import { HELD_COUNTS, type TajweedLetter } from '../core';
import { Play, Volume2, X } from 'lucide-react';
import { useEffect, type CSSProperties, type RefObject } from 'react';
import { fontStack } from '../core/fonts';
import { useLang, useText } from '../core/lang';
import { RULE_TEXT, TAJWEED_TEXT as T } from '../core/texts';
import { MUSHAF_FONT, RuleMark, shownText, soloText, TIMELINE, wordOfLetter } from './rules';

/** The little play a rule gets: the letter alone, moving the way it is said. */
function Scene({ letter, live }: { letter: TajweedLetter; live: boolean }) {
  const rule = letter.rule!;
  const count = HELD_COUNTS[rule];
  const next = TIMELINE.letters[letter.index + 1];
  return (
    <div className="tj-scene" data-rule={rule} data-live={live || undefined} aria-hidden>
      <span className="tj-scene-mark"><RuleMark rule={rule} size={24} /></span>
      <div className="tj-scene-letters" lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>
        <span className="tj-scene-letter">{soloText(letter)}</span>
        {rule === 'shamsi' && next && <span className="tj-scene-next">{soloText(next)}</span>}
      </div>
      {count && (
        <div className="tj-beads" style={{ '--n': count } as CSSProperties}>
          {Array.from({ length: count }, (_, i) => <span key={i} className="tj-bead" style={{ '--i': i } as CSSProperties}>{i + 1}</span>)}
        </div>
      )}
    </div>
  );
}

interface Props {
  /** The coloured letter being explained. */
  letter: number;
  /** While the word is being listened to: the letter sounding now, or -1. */
  soundNow: number;
  listening: boolean;
  panel: RefObject<HTMLDivElement>;
  onPick: (letter: number) => void;
  onListen: () => void;
  onCarryOn: () => void;
  onClose: () => void;
}

/** One word with its coloured letters, the rule of the chosen one, and its animation. */
export function RuleCard({ letter, soundNow, listening, panel, onPick, onListen, onCarryOn, onClose }: Props) {
  const tx = useText();
  const lang = useLang();
  const picked = TIMELINE.letters[letter];
  const rule = picked.rule!;
  const word = wordOfLetter(letter);
  const letters = TIMELINE.letters.slice(word.first, word.last + 1);
  const text = RULE_TEXT[rule];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose, panel]);

  return (
    <div className="tj-card-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} className="tj-card" role="dialog" aria-modal aria-labelledby="tj-card-title" tabIndex={-1} data-rule={rule}>
        <button className="tj-btn tj-card-close" onClick={onClose} aria-label={tx(T.close)}><X size={22} strokeWidth={2.5} /></button>

        <div className="tj-card-word" lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>
          {letters.map((l) => (
            <span
              key={l.index}
              data-rule={l.rule}
              className={[
                'tj-letter',
                listening && l.index > soundNow ? '' : 'is-done',
                l.index === letter ? 'is-picked' : '',
                listening && l.index === soundNow ? 'is-now' : ''
              ].join(' ')}
            >{shownText(l)}</span>
          ))}
        </div>

        {word.rules.length > 1 && (
          <div className="tj-card-tabs" role="tablist" aria-label={tx(T.inWord)}>
            {word.rules.map((i) => {
              const l = TIMELINE.letters[i];
              return (
                <button key={i} role="tab" aria-selected={i === letter} aria-label={tx(RULE_TEXT[l.rule!].name)} className="tj-tab" data-rule={l.rule} onClick={() => onPick(i)}>
                  <span lang="ar" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>{soloText(l)}</span>
                  <RuleMark rule={l.rule!} size={14} />
                </button>
              );
            })}
          </div>
        )}

        <Scene key={letter} letter={picked} live={listening && soundNow === letter} />

        <h2 id="tj-card-title" className="tj-card-title">
          <span>{tx(text.name)}</span>
          {lang !== 'ar' && <span className="tj-card-arabic" lang="ar" dir="rtl">{text.name.ar}</span>}
        </h2>
        <p className="tj-card-line">{tx(text.line)}</p>

        <div className="tj-card-actions">
          <button className="tj-pill tj-pill-rule" onClick={onListen} disabled={listening}><Volume2 size={20} strokeWidth={2.5} />{tx(T.listen)}</button>
          <button className="tj-pill tj-pill-go" onClick={onCarryOn}><Play size={18} strokeWidth={2.5} fill="currentColor" />{tx(T.carryOn)}</button>
        </div>
      </div>
    </div>
  );
}
