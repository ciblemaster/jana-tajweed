import { buildTajweedTimeline, type TajweedLetter, type TajweedRule, type TajweedTimeline } from '../core';
import { GAME_SURAHS, loadSurah } from '../tajweed/surahs';

/** A word the sheikh says, with the letters of the level's rules in it. */
export interface ExampleWord {
  startMs: number;
  endMs: number;
  letters: TajweedLetter[];
  /** Its letters that carry one of the level's rules. */
  marked: TajweedLetter[];
}

export interface Examples {
  surah: number;
  timeline: TajweedTimeline;
  words: ExampleWord[];
  /** The level's rules this surah shows, in the level's order. */
  rules: TajweedRule[];
}

function wordsOf(timeline: TajweedTimeline, rules: TajweedRule[]): ExampleWord[] {
  const out: ExampleWord[] = [];
  const seen = new Set<string>();
  for (const verse of timeline.verses) {
    // The children repeat the same words: the sheikh's are enough.
    if (verse.pass !== 'reciter') continue;
    for (const word of verse.words) {
      const letters = timeline.letters.slice(word.first, word.last + 1);
      const marked = letters.filter((l) => l.rule && rules.includes(l.rule));
      const text = letters.map((l) => l.text).join('');
      if (!marked.length || seen.has(text)) continue;
      seen.add(text);
      out.push({ startMs: word.startMs, endMs: word.endMs, letters, marked });
    }
  }
  return out;
}

/**
 * The surah a lesson takes its words from: the first on the path that shows every rule of the level, or else the one
 * showing the most of them. Each surah is fetched only if the ones before it were not enough.
 */
export async function findExamples(rules: TajweedRule[]): Promise<Examples> {
  let best: Examples | null = null;
  for (const info of GAME_SURAHS) {
    const timeline = buildTajweedTimeline(await loadSurah(info.n, null));
    const words = wordsOf(timeline, rules);
    const shown = rules.filter((r) => words.some((w) => w.marked.some((l) => l.rule === r)));
    const found = { surah: info.n, timeline, words, rules: shown };
    if (!best || shown.length > best.rules.length || (shown.length === best.rules.length && words.length > best.words.length * 2)) best = found;
    if (shown.length === rules.length && words.length >= 4) return found;
  }
  return best!;
}

/** Fisher–Yates, on a copy. */
export function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Round =
  | { kind: 'tap'; word: ExampleWord; rule: TajweedRule }
  | { kind: 'which'; word: ExampleWord; letter: TajweedLetter; options: TajweedRule[] };

/**
 * A game of `count` questions over the example words: "tap the letter with this rule", and where the level has more
 * than one rule, "which rule is the marked letter?". Words repeat only when there are too few.
 */
export function makeRounds(examples: Examples, count: number): Round[] {
  const words = shuffle(examples.words);
  const rounds: Round[] = [];
  for (let i = 0; i < count && words.length; i++) {
    const word = words[i % words.length];
    const letter = word.marked[Math.floor(Math.random() * word.marked.length)];
    const which = examples.rules.length > 1 && i % 2 === 1;
    rounds.push(which ? { kind: 'which', word, letter, options: examples.rules } : { kind: 'tap', word, rule: letter.rule! });
  }
  return rounds;
}
