import type { TajweedLetter, TajweedTimeline } from '../core';
import { fontStack } from '../core/fonts';
import { letterInWord } from '../tajweed/letters';
import { MUSHAF_FONT } from '../tajweed/theme';
import type { ExampleWord } from './examples';

interface Props {
  timeline: TajweedTimeline;
  word: ExampleWord;
  /** The letters drawn in their rule's colour; the rest in ink. */
  coloured: (letter: TajweedLetter) => boolean;
  /** A letter ringed for a question. */
  marked?: number;
  /** The letter being said, while the word plays. */
  now?: number;
  /** Letters become buttons when the child is asked to find one. */
  onLetter?: (letter: TajweedLetter) => void;
  wrong?: number;
  size?: 'big' | 'small';
}

/** One word of the mushaf, each letter on its own so it can be coloured, ringed or tapped. */
export function WordView({ timeline, word, coloured, marked, now, onLetter, wrong, size = 'big' }: Props) {
  return (
    <div className={`jg-word jg-word-${size}`} lang="ar" dir="rtl" style={{ fontFamily: fontStack(MUSHAF_FONT) }}>
      {word.letters.map((l) => {
        const look = [
          'tj-letter', 'is-done',
          l.index === marked ? 'jg-marked' : '',
          l.index === now ? 'jg-now' : '',
          l.index === wrong ? 'jg-wrong' : ''
        ].join(' ');
        const text = letterInWord(timeline, l);
        const rule = coloured(l) ? l.rule : undefined;
        return onLetter
          ? (
            // A span, not a button: a button would cut the letter off from its neighbours and break the joined shape.
            <span
              key={l.index}
              role="button"
              tabIndex={0}
              className={`${look} jg-letter-btn`}
              data-rule={rule}
              onClick={() => onLetter(l)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetter(l);
                }
              }}
            >{text}</span>
          )
          : <span key={l.index} className={look} data-rule={rule}>{text}</span>;
      })}
    </div>
  );
}
