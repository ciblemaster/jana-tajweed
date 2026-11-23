import type { TajweedSurahSource } from '../core';

/**
 * The surah being played. The player's modules build everything once from it when they are first loaded, so it is
 * handed over before they are, and the page is opened afresh to play another.
 */
let source: TajweedSurahSource | null = null;

export function provideSurah(surah: TajweedSurahSource) {
  source = surah;
}

export function currentSurah(): TajweedSurahSource {
  if (!source) throw new Error('The surah was not loaded before the player');
  return source;
}
