import { buildTajweedTimeline, TAJWEED_RULES, type TajweedLetter, type TajweedPass, type TajweedRule } from '../core';
import { currentSurah } from './current';
import { letterInWord, RuleMark, soloText } from './letters';

export { RuleMark, soloText };
import { modeFromUrl, trialFromUrl, type Trial } from './surahs';

// Everything here is built once, from the surah handed over before this module is loaded (see current.ts). The page
// is opened afresh to play another surah, another mode or the other timing of the trial.
const source = currentSurah();

/** The surah being played, by number. */
export const SURAH = source.surah;
/** Following the recitation, or reciting from memory on the child's turn. */
export const MODE = modeFromUrl();
/** Set only for the first trial, Al-Fatihah by Sheikh Al-Husary: who timed its letters. */
export const TRIAL: Trial = SURAH === 1 ? trialFromUrl() : null;

/** The surah with every letter timed. */
export const TIMELINE = buildTajweedTimeline(source);

/** Opens the trial again with the other timing. */
export function switchTrial(trial: Exclude<Trial, null>) {
  const url = new URL(window.location.href);
  url.searchParams.set('timing', trial);
  window.location.assign(url);
}

/** A verse as the child counts it: its recitations one after the other, the sheikh's first and the children's last. */
export interface Ayah {
  ayah: number;
  /** The recitations of it, as positions in the timeline's verses. */
  first: number;
  last: number;
}

export const AYAHS: Ayah[] = [];
TIMELINE.verses.forEach((verse, v) => {
  const open = AYAHS[AYAHS.length - 1];
  if (open && open.ayah === verse.ayah) open.last = v;
  else AYAHS.push({ ayah: verse.ayah, first: v, last: v });
});

/** Which verse a recitation belongs to, as a position in AYAHS. */
export function ayahOf(verse: number): number {
  return AYAHS.findIndex((ayah) => verse >= ayah.first && verse <= ayah.last);
}

/** Whether children repeat the verses in this recording. */
export const HAS_CHILDREN = TIMELINE.verses.some((verse) => verse.pass === 'children');

/** The colours this surah uses, in the order of the key. */
export const RULES_USED = TAJWEED_RULES.filter((rule) => TIMELINE.letters.some((letter) => letter.rule === rule));

export { DISPLAY_FONT, MUSHAF_FONT } from './theme';

export interface TimedWord {
  /** Position among all the words of the surah. */
  index: number;
  verse: number;
  pass: TajweedPass;
  startMs: number;
  endMs: number;
  first: number;
  last: number;
  /** Its coloured letters, as positions in the surah's letters. */
  rules: number[];
}

/** Every word of the surah in order, with its coloured letters. */
export const WORDS: TimedWord[] = TIMELINE.verses.flatMap((verse, v) => verse.words.map((word) => ({ ...word, verse: v, pass: verse.pass }))).map((word, index) => ({
  ...word,
  index,
  rules: TIMELINE.letters.slice(word.first, word.last + 1).filter((letter) => letter.rule).map((letter) => letter.index)
}));

/** When a word stops the recitation, its card opens on the rule a child hears best: a madd first, a silent letter last. */
const STOP_ORDER: TajweedRule[] = ['madd6', 'madd5', 'madd4', 'qalqalah', 'ghunnah', 'iqlab', 'idghamg', 'ikhfa', 'idgham', 'madd2', 'shamsi', 'qamari', 'heavy', 'izhar', 'silent'];

export function leadRule(word: TimedWord): number {
  return [...word.rules].sort((a, b) => STOP_ORDER.indexOf(TIMELINE.letters[a].rule!) - STOP_ORDER.indexOf(TIMELINE.letters[b].rule!))[0];
}

export function wordOfLetter(letter: number): TimedWord {
  return WORDS.find((word) => letter >= word.first && letter <= word.last) ?? WORDS[0];
}

/** The last word that has ended by a time, or -1. */
export function lastWordEndedBy(ms: number): number {
  let found = -1;
  for (const word of WORDS) {
    if (word.endMs <= ms) found = word.index;
    else break;
  }
  return found;
}

export function shownText(letter: TajweedLetter): string {
  return letterInWord(TIMELINE, letter);
}
