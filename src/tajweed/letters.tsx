import { AudioLines, Combine, Drum, EyeOff, Merge, Moon, RefreshCw, Sparkles, Sun, VolumeX, Weight, type LucideIcon } from 'lucide-react';
import { HELD_COUNTS, type TajweedLetter, type TajweedRule, type TajweedTimeline } from '../core';

const ICONS: Partial<Record<TajweedRule, LucideIcon>> = {
  shamsi: Sun, qamari: Moon, silent: VolumeX, izhar: Sparkles, heavy: Weight, ghunnah: AudioLines, ikhfa: EyeOff, qalqalah: Drum,
  idghamg: Combine, idgham: Merge, iqlab: RefreshCw
};

/** A rule's picture: an icon, or the count for a madd. */
export function RuleMark({ rule, size = 18 }: { rule: TajweedRule; size?: number }) {
  const Icon = ICONS[rule];
  if (Icon) return <Icon size={size} strokeWidth={2.5} aria-hidden />;
  return <span className="tj-count" style={{ fontSize: size }}>{HELD_COUNTS[rule]}</span>;
}

/**
 * A letter on its own. A long vowel written as a small alef needs a line to sit on, and a yeh keeps the shape it has
 * inside its word: alone, the mushaf writes it without its dots.
 */
export function soloText(letter: TajweedLetter): string {
  if (letter.text === '\u0670') return '\u0640\u0670';
  if (letter.text.startsWith('\u064A')) return `\u200D${letter.text}\u200D`;
  return letter.text;
}

/**
 * A letter as drawn inside its word. The mushaf face fuses a long yeh with the letter after it into one shape, which
 * would then take one colour; a joiner after the yeh keeps the two letters joined but separate, each with its own.
 */
/**
 * A letter as drawn inside its word. The mushaf face fuses a long yeh with the letter after it into one shape, which
 * would then take one colour; a joiner after the yeh keeps the two letters joined but separate, each with its own.
 */
export function letterInWord(timeline: TajweedTimeline, letter: TajweedLetter): string {
  const next = timeline.letters[letter.index + 1];
  const before = timeline.letters[letter.index - 1];
  const sameWord = (other?: TajweedLetter) => !!other && other.verse === letter.verse && other.word === letter.word;
  if (!letter.text.startsWith('\u064A')) return letter.text;
  // The face also fuses a yeh with the letter before it (فِي), leaving the yeh no width of its own: a joiner before it
  // keeps it a letter of its own, still joined, so it can take its colour and be tapped.
  const lead = sameWord(before) ? '\u200D' : '';
  const tail = letter.text === '\u064A' && sameWord(next) ? '\u200D' : '';
  return `${lead}${letter.text}${tail}`;
}
