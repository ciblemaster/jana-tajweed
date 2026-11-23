/** The rules the letters are coloured by, in the order of the colour key. */
export const TAJWEED_RULES = [
  'madd2', 'madd4', 'madd5', 'madd6', 'shamsi', 'qamari', 'silent', 'izhar', 'heavy',
  'ghunnah', 'ikhfa', 'idghamg', 'idgham', 'iqlab', 'qalqalah'
] as const;
export type TajweedRule = (typeof TAJWEED_RULES)[number];

/**
 * How many counts a held sound lasts: the madds, and the humming of a doubled, hidden, merged or turned noon. The
 * madd before a stop may be 2, 4 or 6 and the madd before a hamza 4 or 5; both are shown as 4, as the sheikhs here
 * hold them.
 */
export const HELD_COUNTS: Partial<Record<TajweedRule, number>> = { madd2: 2, madd4: 4, madd5: 4, madd6: 6, ghunnah: 2, ikhfa: 2, idghamg: 2, iqlab: 2 };

/** Who is reciting: the sheikh, or the children repeating the verse after him. */
export type TajweedPass = 'reciter' | 'children';

/** A letter with its marks, its share of the word in ms, and its rule. */
export type TajweedLetterSource = [text: string, ms: number, rule?: TajweedRule];

export interface TajweedSurahSource {
  surah: number;
  reciterId: string;
  /** One recording of the whole surah; every time below is measured from its start. */
  audioUrl: string;
  verses: {
    ayah: number;
    /** Where to stop when one verse is played alone: in the silence after it. */
    endMs: number;
    words: { startMs: number; endMs: number; letters: TajweedLetterSource[] }[];
    /**
     * In a teaching recording, the children repeating the verse after the sheikh: the same words and letters, with
     * their own times. `ms` is each letter's share of its word, in the order of `letters`.
     */
    repeat?: { endMs: number; words: { startMs: number; endMs: number; ms: number[] }[] };
  }[];
}

export interface TajweedLetter {
  /** Position among all the letters of the surah. */
  index: number;
  verse: number;
  word: number;
  text: string;
  rule?: TajweedRule;
  startMs: number;
  endMs: number;
}

export interface TajweedWord {
  startMs: number;
  endMs: number;
  /** Its letters, as positions in the surah's letters. */
  first: number;
  last: number;
}

/** One recitation of a verse. A verse the children repeat is two of these, one after the other. */
export interface TajweedVerse {
  ayah: number;
  pass: TajweedPass;
  startMs: number;
  endMs: number;
  words: TajweedWord[];
  first: number;
  last: number;
}

export interface TajweedTimeline {
  surah: number;
  reciterId: string;
  audioUrl: string;
  letters: TajweedLetter[];
  verses: TajweedVerse[];
}
