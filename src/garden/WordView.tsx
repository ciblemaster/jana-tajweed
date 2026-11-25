import type { TajweedLetter, TajweedTimeline } from '../core';
import { fontStack } from '../core/fonts';
import { MUSHAF_FONT } from '../tajweed/theme';
import type { ExampleWord } from './examples';
import { wordUnits } from './joining';

interface Props {
  timeline: TajweedTimeline;
  word: ExampleWord;
  /** The letters drawn in their rule's colour; the rest in ink. */
  coloured: (letter: TajweedLetter) => boolean;
  /** A letter ringed for a question. */
  marked?: number;
  /** The letter being said, while the word plays. */
  now?: number;
  /**
   * Letters become buttons when the child is asked to find one. Lam with its alif is one shape and one button: the
   * tap gives both letters, and the question decides if either is the one asked for.
   */
  onLetter?: (letters: TajweedLetter[]) => void;
  wrong?: number;
  size?: 'big' | 'small';
}

/** One word of the mushaf, each letter on its own so it can be coloured, ringed or tapped, and still joined to the next. */
export function WordView({ word, coloured, marked, now, onLetter, wrong, size = 'big' }: Props) {
  return (
    <div className={`jg-word jg-word-${size}`} lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>
      {wordUnits(word.letters).map(({ letters, text }) => {
        const has = (i?: number) => i !== undefined && letters.some((l) => l.index === i);
        const look = [
          'tj-letter', 'is-done',
          has(marked) ? 'jg-marked' : '',
          has(now) ? 'jg-now' : '',
          has(wrong) ? 'jg-wrong' : ''
        ].join(' ');
        // Lam-alif takes the colour of its letter with a rule, if one has.
        const ruled = letters.find((l) => l.rule && coloured(l));
        const rule = ruled?.rule;
        const key = letters[0].index;
        return onLetter
          ? (
            // A span, not a button: a button would cut the letter off from its neighbours and break the joined shape.
            <span
              key={key}
              role="button"
              tabIndex={0}
              className={`${look} jg-letter-btn`}
              data-rule={rule}
              onClick={() => onLetter(letters)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetter(letters);
                }
              }}
            >{text}</span>
          )
          : <span key={key} className={look} data-rule={rule}>{text}</span>;
      })}
    </div>
  );
}
