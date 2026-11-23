import { HELD_COUNTS, type TajweedRule } from './types';

/**
 * Tier 2 of recitation feedback: from where the aligner heard each letter of a verse in the child's recording, which
 * words were said clearly, and whether the long sounds were held long enough. It never judges how a letter sounds
 * (that is tier 3), and it is shown as a trial until a teacher has checked it agrees with them.
 */

/** A letter of the verse as the aligner is given it. */
export interface CheckLetter {
  text: string;
  rule?: TajweedRule | null;
  /** The word it belongs to, counted from 0 within the verse. */
  word: number;
}

/** Where the aligner heard a letter in the child's recording, and how sure it is (0 to 1); null when it has no sound of its own. */
export type Heard = { startMs: number; endMs: number; score: number } | null;

export type WordState = 'good' | 'almost' | 'again';

export type Tip =
  | { kind: 'great' }
  | { kind: 'say'; word: number }
  | { kind: 'hold'; word: number; rule: TajweedRule; counts: number };

export interface VoiceResult {
  words: WordState[];
  tip: Tip;
  /** How long one count lasted in this recitation, in ms. */
  beatMs: number;
}

/** A word is clear above this certainty, and almost there above the next. */
export const CLEAR = 0.55;
export const UNSURE = 0.25;
/** A held sound is too short below this share of its counts: it is then hardly longer than a short vowel. */
export const HOLD_SHARE = 0.65;

const SHORT_VOWELS = /[َُِ]/;
const MADD: TajweedRule[] = ['madd2', 'madd4', 'madd5', 'madd6'];
// Held letters with a sound of their own: the hum lasts from the letter until the next sound.
const HUM: TajweedRule[] = ['ghunnah', 'ikhfa', 'iqlab'];

const median = (list: number[]) => {
  const s = [...list].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** The next letter after `i` that was heard, if any. */
const nextHeard = (heard: Heard[], i: number) => heard.slice(i + 1).find((h) => h) ?? null;
/** The last letter before `i` that was heard, with its position. */
function prevHeard(heard: Heard[], i: number): { at: number; h: NonNullable<Heard> } | null {
  for (let j = i - 1; j >= 0; j--) if (heard[j]) return { at: j, h: heard[j]! };
  return null;
}

/**
 * One count of this recitation: the median time from a letter with a short vowel to the next sound, which is about
 * one count however fast or slowly the child recites.
 */
export function beatOf(letters: CheckLetter[], heard: Heard[]): number {
  const spans: number[] = [];
  letters.forEach((l, i) => {
    const h = heard[i];
    const next = heard[i + 1];
    if (!h || !next || !SHORT_VOWELS.test(l.text) || (l.rule && HELD_COUNTS[l.rule])) return;
    if (letters[i + 1].rule && MADD.includes(letters[i + 1].rule!)) return;
    spans.push(next.startMs - h.startMs);
  });
  if (spans.length >= 3) return Math.min(700, Math.max(120, median(spans)));
  const said = heard.filter(Boolean) as NonNullable<Heard>[];
  if (said.length < 2) return 300;
  return Math.min(700, Math.max(120, (said[said.length - 1].endMs - said[0].startMs) / said.length));
}

/** How many counts a held letter lasted, or null when it cannot be measured. */
export function heldCounts(letters: CheckLetter[], heard: Heard[], i: number, beatMs: number): number | null {
  const rule = letters[i].rule;
  if (!rule) return null;
  if (MADD.includes(rule)) {
    // A long vowel has no sound of its own: it carries on the letter before it until the next sound.
    const before = prevHeard(heard, i);
    if (!before) return null;
    const after = nextHeard(heard, i);
    const end = after ? after.startMs : before.h.endMs;
    return (end - before.h.startMs) / beatMs;
  }
  if (HUM.includes(rule) && heard[i]) {
    const after = nextHeard(heard, i);
    return ((after ? after.startMs : heard[i]!.endMs) - heard[i]!.startMs) / beatMs;
  }
  return null;
}

export function judgeRecitation(letters: CheckLetter[], heard: Heard[]): VoiceResult {
  const count = letters.length ? Math.max(...letters.map((l) => l.word)) + 1 : 0;
  const beatMs = beatOf(letters, heard);

  const words: WordState[] = Array.from({ length: count }, (_, w) => {
    const scores = letters.map((l, i) => (l.word === w && heard[i] ? heard[i]!.score : null)).filter((s): s is number => s !== null);
    if (!scores.length) return 'good';
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return mean >= CLEAR ? 'good' : mean >= UNSURE ? 'almost' : 'again';
  });

  let hold: Tip | null = null;
  letters.forEach((l, i) => {
    const want = l.rule ? HELD_COUNTS[l.rule] : undefined;
    if (!want || words[l.word] === 'again') return;
    const got = heldCounts(letters, heard, i, beatMs);
    if (got !== null && got < want * HOLD_SHARE) {
      if (words[l.word] === 'good') words[l.word] = 'almost';
      hold ??= { kind: 'hold', word: l.word, rule: l.rule!, counts: want };
    }
  });

  // One tip only: a word to say again comes first, then a sound to hold longer.
  const missed = words.indexOf('again');
  const tip: Tip = missed >= 0 ? { kind: 'say', word: missed } : hold ?? { kind: 'great' };
  return { words, tip, beatMs };
}
