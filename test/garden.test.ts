import { describe, expect, it } from 'vitest';
import { buildTajweedTimeline, FATIHA_HUSARY } from '../src/core/tajweed';
import { makeRounds, shuffle, type Examples } from '../src/garden/examples';
import { LEVELS, levelById, levelOpen } from '../src/garden/levels';
import { bandRules } from '../src/profiles/store';

const timeline = buildTajweedTimeline(FATIHA_HUSARY);
const rules = ['shamsi', 'qamari', 'silent'] as const;
const words = timeline.verses.flatMap((v) =>
  v.words.map((w) => {
    const letters = timeline.letters.slice(w.first, w.last + 1);
    return { startMs: w.startMs, endMs: w.endMs, letters, marked: letters.filter((l) => l.rule && (rules as readonly string[]).includes(l.rule)) };
  })
).filter((w) => w.marked.length);
const examples: Examples = { surah: 1, timeline, words, rules: [...rules] };

describe('Rule Garden', () => {
  it('opens the first level, and each next one once the one before is done', () => {
    expect(levelOpen({}, 'madd')).toBe(true);
    expect(levelOpen({}, 'lam')).toBe(false);
    expect(levelOpen({ madd: { done: true } }, 'lam')).toBe(true);
    expect(levelOpen({}, 'qalqalah', true)).toBe(true);
  });

  it('never opens a level that is not built yet', () => {
    const coming = LEVELS.filter((l) => !l.rules.length);
    expect(coming.length).toBeGreaterThan(0);
    for (const l of coming) {
      expect(levelOpen({ madd: { done: true }, lam: { done: true }, qalqalah: { done: true }, heavy: { done: true }, noon: { done: true } }, l.id, true)).toBe(false);
      expect(levelById(l.id)).toBeUndefined();
    }
  });

  it('asks about letters that really carry the rule', () => {
    const rounds = makeRounds(examples, 6);
    expect(rounds).toHaveLength(6);
    for (const r of rounds) {
      if (r.kind === 'tap') expect(r.word.marked.some((l) => l.rule === r.rule)).toBe(true);
      else {
        expect(r.word.letters).toContain(r.letter);
        expect(r.options).toContain(r.letter.rule);
      }
    }
    expect(rounds.some((r) => r.kind === 'which')).toBe(true);
  });

  it('only asks "tap" questions when a level has one rule', () => {
    const one: Examples = { ...examples, rules: ['shamsi'], words: words.filter((w) => w.marked.some((l) => l.rule === 'shamsi')).map((w) => ({ ...w, marked: w.marked.filter((l) => l.rule === 'shamsi') })) };
    expect(makeRounds(one, 5).every((r) => r.kind === 'tap')).toBe(true);
  });

  it('shuffles without losing or adding anything', () => {
    const list = [1, 2, 3, 4, 5, 6];
    expect(shuffle(list).sort()).toEqual(list);
  });

  it('gives little ones fewer questions, hints and a slow sheikh', () => {
    expect(bandRules('little')).toEqual({ rounds: 3, hints: true, slow: true });
    expect(bandRules('junior').hints).toBe(false);
    expect(bandRules(undefined).rounds).toBe(5);
  });
});
