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

/** Something to correct in one word. Every one in a verse is kept, so the child can work through them at the end. */
export type Fix =
  | { kind: 'say'; word: number }
  | { kind: 'hold'; word: number; rule: TajweedRule; counts: number }
  | { kind: 'almost'; word: number };

export interface VoiceResult {
  words: WordState[];
  tip: Tip;
  /** Every correction, most needed first: words to say again, then sounds to hold longer, then words almost there. */
  fixes: Fix[];
  /** How long one count lasted in this recitation, in ms. */
  beatMs: number;
}

/**
 * A word is clear above this certainty, and almost there above the next. Measured on 6 surahs (37 verses) with the MMS
 * aligner: Sheikh Al-Minshawi's own words score 0.64 in the middle, and 0.40 keeps 94% of them clear; the children
 * repeating after him score 0.45 in the middle. Words of the wrong verse score 0.22 in the middle, and below 0.20 a
 * word is almost never one that was said right (no sheikh verse, 25% of the children's, 75% of wrong verses).
 */
export const CLEAR = 0.4;
export const UNSURE = 0.2;
/**
 * A long vowel is too short below this share of its counts. One count where two are due is a share of 0.5; the
 * sheikh's shortest measured hold was 0.63 once the stop at a verse end is counted as 2.
 */
export const HOLD_SHARE = 0.55;
/**
 * The hum of a noon or meem measures short: the aligner starts the next letter while the hum is still going, so the
 * sheikh's 2 counts measure 1 to 1.2 at times (a share of 0.33 to 0.6). Only a hum hardly there at all is pointed out.
 */
export const HUM_SHARE = 0.3;

const SHORT_VOWELS = /[َُِ]/;
const MADD: TajweedRule[] = ['madd2', 'madd4', 'madd5', 'madd6'];
// Held letters with a sound of their own: the hum lasts from the letter until the next sound.
const HUM: TajweedRule[] = ['ghunnah', 'ikhfa', 'iqlab'];
/** Whether a held letter is a hum (of a noon or meem) rather than a long vowel. */
export const isHum = (rule: TajweedRule) => HUM.includes(rule);

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
  if (spans.length >= 2) return Math.min(700, Math.max(120, median(spans)));
  const said = heard.filter(Boolean) as NonNullable<Heard>[];
  if (said.length < 2) return 300;
  // Too few for that in a short verse: the whole recitation over its counts, a held sound taking all of its own.
  const counts = said.length + letters.reduce((sum, _, i) => sum + Math.max(0, (wantedCounts(letters, i) ?? 1) - 1), 0);
  return Math.min(700, Math.max(120, (said[said.length - 1].endMs - said[0].startMs) / counts));
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
    // Measured between two letters the aligner placed: one it barely heard may sit anywhere, so it measures nothing.
    if (before.h.score < UNSURE || (after && after.score < UNSURE)) return null;
    const end = after ? after.startMs : before.h.endMs;
    return (end - before.h.startMs) / beatMs;
  }
  if (HUM.includes(rule) && heard[i]) {
    const after = nextHeard(heard, i);
    if (heard[i]!.score < UNSURE || (after && after.score < UNSURE)) return null;
    return ((after ? after.startMs : heard[i]!.endMs) - heard[i]!.startMs) / beatMs;
  }
  return null;
}

/**
 * How many counts a letter should be held. A long vowel before the last letter of a verse is held 2, 4 or 6 counts
 * when the reciter stops there (madd 'arid lil-sukun), so 2 is enough: the sheikh holds ٱلۡعَٰلَمِينَ and ٱلنَّاسِ
 * about 2.4 counts.
 */
export function wantedCounts(letters: CheckLetter[], i: number): number | undefined {
  const rule = letters[i].rule;
  const want = rule ? HELD_COUNTS[rule] : undefined;
  if (want && MADD.includes(rule!) && i === letters.length - 2) return Math.min(want, 2);
  return want;
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

  // The first sound held too short in each word.
  const holds = new Map<number, Extract<Fix, { kind: 'hold' }>>();
  letters.forEach((l, i) => {
    const want = wantedCounts(letters, i);
    if (!want || words[l.word] === 'again') return;
    const got = heldCounts(letters, heard, i, beatMs);
    if (got !== null && got < want * (HUM.includes(l.rule!) ? HUM_SHARE : HOLD_SHARE)) {
      if (words[l.word] === 'good') words[l.word] = 'almost';
      if (!holds.has(l.word)) holds.set(l.word, { kind: 'hold', word: l.word, rule: l.rule!, counts: want });
    }
  });

  const fixes: Fix[] = [
    ...words.flatMap((s, word): Fix[] => (s === 'again' ? [{ kind: 'say', word }] : [])),
    ...holds.values(),
    ...words.flatMap((s, word): Fix[] => (s === 'almost' && !holds.has(word) ? [{ kind: 'almost', word }] : []))
  ];

  // One tip only: a word to say again comes first, then a sound to hold longer.
  const first = fixes.find((f): f is Exclude<Fix, { kind: 'almost' }> => f.kind !== 'almost');
  const tip: Tip = first ?? { kind: 'great' };
  return { words, tip, beatMs, fixes };
}
