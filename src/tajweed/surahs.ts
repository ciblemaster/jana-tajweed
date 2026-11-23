import { FATIHA_HUSARY, FATIHA_HUSARY_MMS, type TajweedSurahSource } from '../core';
import catalogue from './surah-data/index.json';

/** A surah of the game: its number, its names and how many verses it has. */
export interface SurahInfo {
  n: number;
  ar: string;
  en: string;
  verses: number;
}

/**
 * The surahs in the order a child learns them: Al-Fatihah, then from An-Nas back through Juz Amma. Each one is
 * Sheikh Al-Minshawi's teaching recording, where children repeat every verse.
 */
export const GAME_SURAHS = catalogue as SurahInfo[];

export function surahInfo(n: number): SurahInfo | undefined {
  return GAME_SURAHS.find((s) => s.n === n);
}

/** A surah's name for a reader: in Arabic letters where the language is written in them, in Latin letters elsewhere. */
export function surahName(info: SurahInfo | undefined, lang: string): string {
  if (!info) return '';
  return lang === 'ar' || lang === 'ur' ? info.ar : info.en;
}

/** The surah the address asks for (?surah=113), or null for the map. */
export function surahFromUrl(): number | null {
  const asked = Number(new URLSearchParams(window.location.search).get('surah'));
  return surahInfo(asked) ? asked : null;
}

/** 'learn' follows the sheikh and the children; 'memorise' hides the verse on the child's turn. */
export type Mode = 'learn' | 'memorise';

export function modeFromUrl(): Mode {
  return new URLSearchParams(window.location.search).get('mode') === 'memorise' ? 'memorise' : 'learn';
}

/** The first trial, kept for comparison: Al-Fatihah by Sheikh Al-Husary, timed by hand or by the aligner. */
export type Trial = 'hand' | 'mms' | null;

export function trialFromUrl(): Trial {
  const timing = new URLSearchParams(window.location.search).get('timing');
  return timing === 'hand' || timing === 'mms' ? timing : null;
}

/** Where a surah is played, or the map. */
export function gameUrl(surah?: number, mode: Mode = 'learn'): string {
  const url = new URL(window.location.href);
  url.search = '';
  const lang = new URLSearchParams(window.location.search).get('lang');
  if (lang) url.searchParams.set('lang', lang);
  if (surah) url.searchParams.set('surah', String(surah));
  if (surah && mode === 'memorise') url.searchParams.set('mode', mode);
  return url.pathname + url.search;
}

// Each surah's letters and times are fetched only when it is opened.
const files = import.meta.glob<{ default: TajweedSurahSource }>(['./surah-data/*.json', '!./surah-data/index.json']);

export async function loadSurah(n: number, trial: Trial): Promise<TajweedSurahSource> {
  if (n === 1 && trial) return trial === 'mms' ? FATIHA_HUSARY_MMS : FATIHA_HUSARY;
  const file = files[`./surah-data/${n}.json`];
  if (!file) throw new Error(`No data for surah ${n}`);
  return (await file()).default;
}

/** Where a level of the Rule Garden is played. */
export function lessonUrl(level: string): string {
  return gameUrl() + (gameUrl().includes('?') ? '&' : '?') + `lesson=${level}`;
}

/** Where the child is picked or added. */
export function profilesUrl(): string {
  return gameUrl() + (gameUrl().includes('?') ? '&' : '?') + 'profiles';
}
