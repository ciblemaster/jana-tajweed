import { buildTajweedTimeline, type TajweedLetter, type TajweedRule, type TajweedTimeline } from '../core';
import { GAME_SURAHS, loadSurah } from '../tajweed/surahs';
import type { ExampleWord } from './examples';
import { shuffle } from './examples';

/** Level 0 of the Rule Garden: the 28 letters, where each sound comes from, and the marks that tell how to say it. */

/** The alphabet in its usual order; alef stands for the hamza, the sound it carries. */
export const ALPHABET = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'];

/** Where a sound is made, kept to the three places a child can feel: the throat, the tongue and the lips. */
export type Zone = 'throat' | 'tongue' | 'lips';
export const ZONES: Zone[] = ['throat', 'tongue', 'lips'];
const THROAT = 'اهعحغخ';
const LIPS = 'بمفو';
export const zoneOf = (letter: string): Zone => (THROAT.includes(letter) ? 'throat' : LIPS.includes(letter) ? 'lips' : 'tongue');

/** The marks over and under a letter. Sukun is written as the small round head of the mushaf (U+06E1) or the usual one. */
export type Mark = 'fatha' | 'kasra' | 'damma' | 'sukun' | 'shaddah' | 'tanween';
export const MARKS: Record<Mark, string> = {
  fatha: 'َ',
  kasra: 'ِ',
  damma: 'ُ',
  sukun: 'ْۡ',
  shaddah: 'ّ',
  tanween: 'ًࣰٌࣱٍࣲ'
};
export const MARK_LIST = Object.keys(MARKS) as Mark[];
export const hasMark = (letter: TajweedLetter, mark: Mark) => [...letter.text.slice(1)].some((c) => MARKS[mark].includes(c));

/** How a mark looks on its own: on a tatweel, so it has something to sit on. */
export const markShape = (mark: Mark) => (mark === 'tanween' ? 'بً' : `ـ${MARKS[mark][0]}`);

// Letters whose own sound is not heard: a long vowel carries on the one before, a silent or sun-lam letter is skipped,
// and a merged noon becomes the next letter.
const NOT_HEARD: TajweedRule[] = ['madd2', 'madd4', 'madd5', 'madd6', 'silent', 'shamsi', 'idgham', 'idghamg', 'iqlab'];

/** The letter of the alphabet a letter of the mushaf says, or null when it says none of its own. */
export function soundOf(letter: TajweedLetter): string | null {
  if (letter.rule && NOT_HEARD.includes(letter.rule)) return null;
  const base = letter.text[0];
  if ('أإءؤئ'.includes(base)) return 'ا';
  // A bare alef has no sound of its own.
  return base !== 'ا' && ALPHABET.includes(base) ? base : null;
}

export interface LetterExamples {
  surah: number;
  timeline: TajweedTimeline;
  /** The sheikh's words, each once. */
  words: ExampleWord[];
  /** For each letter of the alphabet, a short word where it is clearly heard, and which letter of it. */
  byLetter: Map<string, { word: ExampleWord; letter: TajweedLetter }>;
}

export function letterExamples(surah: number, timeline: TajweedTimeline): LetterExamples {
  const words: ExampleWord[] = [];
  const seen = new Set<string>();
  const byLetter = new Map<string, { word: ExampleWord; letter: TajweedLetter }>();
  for (const verse of timeline.verses) {
    if (verse.pass !== 'reciter') continue;
    for (const w of verse.words) {
      const letters = timeline.letters.slice(w.first, w.last + 1);
      const text = letters.map((l) => l.text).join('');
      if (seen.has(text)) continue;
      seen.add(text);
      const word: ExampleWord = { startMs: w.startMs, endMs: w.endMs, letters, marked: [] };
      words.push(word);
      letters.forEach((l, i) => {
        const sound = soundOf(l);
        if (!sound) return;
        const had = byLetter.get(sound);
        // The shortest word wins, and among those one that starts with the letter.
        const score = letters.length * 2 + (i === 0 ? 0 : 1);
        const hadScore = had ? had.word.letters.length * 2 + (had.word.letters[0] === had.letter ? 0 : 1) : Infinity;
        if (score < hadScore) byLetter.set(sound, { word, letter: l });
      });
    }
  }
  return { surah, timeline, words, byLetter };
}

/** The surah Level 0 plays from: the first that has all 28 letters, trying the ones known to have them first. */
export async function findLetterExamples(): Promise<LetterExamples> {
  const order = [92, 88, ...GAME_SURAHS.map((s) => s.n)];
  let best: LetterExamples | null = null;
  for (const n of order) {
    if (!GAME_SURAHS.some((s) => s.n === n)) continue;
    const found = letterExamples(n, buildTajweedTimeline(await loadSurah(n, null)));
    if (found.byLetter.size === ALPHABET.length) return found;
    if (!best || found.byLetter.size > best.byLetter.size) best = found;
  }
  return best!;
}

export type LetterRound =
  | { kind: 'where'; word: ExampleWord; letter: TajweedLetter; zone: Zone }
  | { kind: 'mark'; word: ExampleWord; mark: Mark };

/** "Where does the ringed sound come from?" over different letters, each zone asked about in turn. */
function whereRounds(ex: LetterExamples, count: number): LetterRound[] {
  const pools = ZONES.map((z) => shuffle([...ex.byLetter.entries()].filter(([l]) => zoneOf(l) === z)));
  const out: LetterRound[] = [];
  for (let i = 0; out.length < count && i < count * 3; i++) {
    const pool = pools[i % pools.length];
    const next = pool.shift();
    if (next) out.push({ kind: 'where', word: next[1].word, letter: next[1].letter, zone: zoneOf(next[0]) });
  }
  return shuffle(out);
}

/** "Tap the letter with a fatha" in short words, where the word also has letters without that mark. */
function markRounds(ex: LetterExamples, count: number, marks: Mark[] = MARK_LIST): LetterRound[] {
  const out: LetterRound[] = [];
  const short = shuffle(ex.words.filter((w) => w.letters.length >= 2 && w.letters.length <= 6));
  for (let i = 0; out.length < count && i < count * 4; i++) {
    const mark = marks[i % marks.length];
    const word = short.find((w) => w.letters.some((l) => hasMark(l, mark)) && w.letters.some((l) => !hasMark(l, mark)) && !out.some((r) => r.word === w));
    if (word) out.push({ kind: 'mark', word, mark });
  }
  return shuffle(out);
}

export function makeLetterRounds(ex: LetterExamples, count: number, kind: 'where' | 'mark' | 'both'): LetterRound[] {
  if (kind === 'where') return whereRounds(ex, count);
  if (kind === 'mark') return markRounds(ex, count);
  const half = Math.ceil(count / 2);
  return shuffle([...whereRounds(ex, half), ...markRounds(ex, count - half)]);
}
