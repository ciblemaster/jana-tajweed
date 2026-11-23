import { describe, expect, it } from 'vitest';
import { missionRule } from '../src/garden/levels';
import { answerOk, newSum, sumInWords } from '../src/parents/Parents';
import { strengthOf, weakestRule, type Progress } from '../src/tajweed/progress';

const empty: Progress = { surahs: {}, days: [], seen: [], garden: {}, rules: {} };

describe('Grown-up check', () => {
  it('asks a sum in words, from 3 to 9', () => {
    for (let i = 0; i < 50; i++) {
      const { a, b } = newSum();
      expect(a).toBeGreaterThanOrEqual(3);
      expect(b).toBeLessThanOrEqual(9);
    }
    expect(sumInWords({ a: 7, b: 8 }, 'en')).toBe('seven times eight');
    expect(sumInWords({ a: 7, b: 8 }, 'tr')).toBe('seven times eight');
  });

  it('takes the answer in Western or Arabic digits, and nothing else', () => {
    expect(answerOk({ a: 7, b: 8 }, ' 56 ')).toBe(true);
    expect(answerOk({ a: 7, b: 8 }, '٥٦')).toBe(true);
    expect(answerOk({ a: 7, b: 8 }, '۵۶')).toBe(true);
    expect(answerOk({ a: 7, b: 8 }, '54')).toBe(false);
    expect(answerOk({ a: 7, b: 8 }, '56a')).toBe(false);
  });
});

describe('Rule strengths and the daily mission', () => {
  it('calls a rule new until it has three answers, then strong, growing or practise', () => {
    expect(strengthOf(undefined)).toBe('new');
    expect(strengthOf({ right: 2, tries: 2 })).toBe('new');
    expect(strengthOf({ right: 4, tries: 5 })).toBe('strong');
    expect(strengthOf({ right: 3, tries: 5 })).toBe('growing');
    expect(strengthOf({ right: 1, tries: 5 })).toBe('practise');
  });

  it('finds the weakest rule, or none before any answers', () => {
    expect(weakestRule(empty)).toBeNull();
    expect(weakestRule({ ...empty, rules: { madd2: { right: 5, tries: 5 }, qalqalah: { right: 1, tries: 4 } } })).toBe('qalqalah');
  });

  it('reviews the weakest rule, else the first level', () => {
    expect(missionRule(empty).rules.length).toBeGreaterThan(0);
    const weak = missionRule({ ...empty, rules: { qalqalah: { right: 0, tries: 4 } } });
    expect(weak.rule).toBe('qalqalah');
    expect(weak.rules).toContain('qalqalah');
  });
});
