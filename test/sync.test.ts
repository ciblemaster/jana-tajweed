import { describe, expect, it } from 'vitest';
import { emptyProgress, mergeProgress, readProgressOf, type Progress } from '../src/tajweed/progress';

const at = (change: Partial<Progress>): Progress => ({ ...emptyProgress(), ...change });

describe('Putting two devices together', () => {
  it('keeps every star, day and award from both', () => {
    const phone = at({ surahs: { 1: { listen: true }, 112: { listen: true, recite: true } }, days: ['2026-11-20', '2026-11-22'], seen: ['first'] });
    const tablet = at({ surahs: { 112: { memorise: true }, 113: { listen: true } }, days: ['2026-11-21', '2026-11-22'], seen: ['first', 'quls'] });
    const both = mergeProgress(phone, tablet);
    expect(both.surahs).toEqual({ 1: { listen: true }, 112: { listen: true, recite: true, memorise: true }, 113: { listen: true } });
    expect(both.days).toEqual(['2026-11-20', '2026-11-21', '2026-11-22']);
    expect(both.seen).toEqual(['first', 'quls']);
  });

  it('keeps a level done and its best score, and the answers of the device with more', () => {
    const a = at({ garden: { madd: { done: true, best: 0.6 } }, rules: { madd2: { right: 3, tries: 4 }, qalqalah: { right: 1, tries: 1 } } });
    const b = at({ garden: { madd: { best: 0.9 }, lam: { best: 0.4 } }, rules: { madd2: { right: 5, tries: 8 } } });
    const both = mergeProgress(a, b);
    expect(both.garden).toEqual({ madd: { done: true, best: 0.9 }, lam: { done: false, best: 0.4 } });
    expect(both.rules).toEqual({ madd2: { right: 5, tries: 8 }, qalqalah: { right: 1, tries: 1 } });
  });

  it('joins the parts of today’s mission done on each device, and keeps the newer day', () => {
    expect(mergeProgress(at({ mission: { day: '2026-11-23', review: true } }), at({ mission: { day: '2026-11-23', verse: true } })).mission).toEqual({ day: '2026-11-23', review: true, verse: true });
    expect(mergeProgress(at({ mission: { day: '2026-11-22', review: true } }), at({ mission: { day: '2026-11-23' } })).mission).toEqual({ day: '2026-11-23' });
    expect(mergeProgress(at({}), at({})).mission).toBeUndefined();
  });

  it('gives the same answer whichever device goes first, and merging again changes nothing', () => {
    const a = at({ surahs: { 1: { listen: true } }, days: ['2026-11-22'], rules: { shamsi: { right: 2, tries: 3 } } });
    const b = at({ surahs: { 114: { listen: true } }, days: ['2026-11-23'], rules: { shamsi: { right: 1, tries: 3 } } });
    const ab = mergeProgress(a, b);
    expect(mergeProgress(b, a)).toEqual(ab);
    expect(mergeProgress(ab, b)).toEqual(ab);
  });

  it('starts each child from their own empty progress', () => {
    const one = readProgressOf('nobody');
    one.surahs[1] = { listen: true };
    expect(readProgressOf('someone').surahs).toEqual({});
  });
});
