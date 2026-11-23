import type { TajweedLetter, TajweedLetterSource, TajweedPass, TajweedSurahSource, TajweedTimeline, TajweedVerse } from './types';

/** A verse starts a breath before its first sound, so the first letter is never clipped. */
const LEAD_IN_MS = 120;

/**
 * Gives every letter its own start and end: each word's span is shared out by the letters' measured lengths. A verse
 * the children repeat comes out twice, with the same letters and the children's times.
 */
export function buildTajweedTimeline(source: TajweedSurahSource): TajweedTimeline {
  const letters: TajweedLetter[] = [];
  const verses: TajweedVerse[] = [];
  let previousEnd = 0;

  const add = (ayah: number, pass: TajweedPass, endMs: number, words: { startMs: number; endMs: number; letters: TajweedLetterSource[] }[]) => {
    const v = verses.length;
    const first = letters.length;
    const timed = words.map((word, w) => {
      const total = word.letters.reduce((sum, [, ms]) => sum + ms, 0) || 1;
      const span = word.endMs - word.startMs;
      const wordFirst = letters.length;
      let spent = 0;
      for (const [text, ms, rule] of word.letters) {
        const startMs = Math.round(word.startMs + (span * spent) / total);
        spent += ms;
        const endMs = Math.round(word.startMs + (span * spent) / total);
        letters.push({ index: letters.length, verse: v, word: w, text, rule, startMs, endMs });
      }
      return { startMs: word.startMs, endMs: word.endMs, first: wordFirst, last: letters.length - 1 };
    });
    const startMs = Math.max(previousEnd, words[0].startMs - LEAD_IN_MS);
    verses.push({ ayah, pass, startMs, endMs, words: timed, first, last: letters.length - 1 });
    previousEnd = endMs;
  };

  for (const verse of source.verses) {
    add(verse.ayah, 'reciter', verse.endMs, verse.words);
    if (verse.repeat) {
      const repeated = verse.repeat.words.map((word, w) => ({
        startMs: word.startMs,
        endMs: word.endMs,
        letters: verse.words[w].letters.map(([text, , rule], i): TajweedLetterSource => [text, word.ms[i], rule])
      }));
      add(verse.ayah, 'children', verse.repeat.endMs, repeated);
    }
  }
  return { surah: source.surah, reciterId: source.reciterId, audioUrl: source.audioUrl, letters, verses };
}

/** The letter being recited at a time: the last one that has started. -1 before the first. */
export function tajweedLetterAt(timeline: TajweedTimeline, ms: number): number {
  const { letters } = timeline;
  let low = 0;
  let high = letters.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (letters[mid].startMs <= ms) {
      found = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return found;
}

/** The verse a time falls in; the silence after a verse still belongs to it. */
export function tajweedVerseAt(timeline: TajweedTimeline, ms: number): number {
  const at = timeline.verses.findIndex((verse) => ms < verse.endMs);
  return at === -1 ? timeline.verses.length - 1 : at;
}

/** How far through a letter a time is, from 0 to 1. */
export function tajweedLetterProgress(letter: TajweedLetter, ms: number): number {
  const span = letter.endMs - letter.startMs;
  return span <= 0 ? 1 : Math.min(1, Math.max(0, (ms - letter.startMs) / span));
}
