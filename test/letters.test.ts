import { describe, expect, it } from 'vitest';
import { ALPHABET, findLetterExamples, hasMark, makeLetterRounds, soundOf, zoneOf } from '../src/garden/sounds';
import { missionRule } from '../src/garden/levels';

describe('Level 0: letters and sounds', () => {
  it('knows where each sound is made', () => {
    expect(ALPHABET).toHaveLength(28);
    expect([...'اهعحغخ'].every((l) => zoneOf(l) === 'throat')).toBe(true);
    expect([...'بمفو'].every((l) => zoneOf(l) === 'lips')).toBe(true);
    expect(zoneOf('ق')).toBe('tongue');
    expect(ALPHABET.filter((l) => zoneOf(l) === 'tongue')).toHaveLength(18);
  });

  it('hears a letter only when it has a sound of its own', () => {
    const at = (text: string, rule: string | null = null) => ({ index: 0, verse: 1, word: 0, text, rule, startMs: 0, endMs: 1 }) as never;
    expect(soundOf(at('بَ'))).toBe('ب');
    expect(soundOf(at('إِ'))).toBe('ا');
    expect(soundOf(at('ا', 'madd2'))).toBeNull();
    expect(soundOf(at('ا'))).toBeNull();
    expect(soundOf(at('ل', 'shamsi'))).toBeNull();
    expect(soundOf(at('نۡ', 'idghamg'))).toBeNull();
  });

  it('finds a word for every letter in one surah', async () => {
    const ex = await findLetterExamples();
    expect(ex.byLetter.size).toBe(28);
    for (const [letter, { word, letter: l }] of ex.byLetter) {
      expect(word.letters).toContain(l);
      expect(soundOf(l)).toBe(letter);
    }
  });

  it('asks about the ringed letter’s place, and marks that are really on a letter of the word', async () => {
    const ex = await findLetterExamples();
    const where = makeLetterRounds(ex, 6, 'where');
    expect(where).toHaveLength(6);
    for (const r of where) if (r.kind === 'where') expect(zoneOf(soundOf(r.letter)!)).toBe(r.zone);
    expect(new Set(where.map((r) => (r.kind === 'where' ? r.zone : '')))).toEqual(new Set(['throat', 'tongue', 'lips']));
    const marks = makeLetterRounds(ex, 6, 'mark');
    expect(marks).toHaveLength(6);
    for (const r of marks) {
      if (r.kind !== 'mark') continue;
      expect(r.word.letters.some((l) => hasMark(l, r.mark))).toBe(true);
      expect(r.word.letters.some((l) => !hasMark(l, r.mark))).toBe(true);
    }
    expect(makeLetterRounds(ex, 6, 'both')).toHaveLength(6);
  });

  it('never picks Level 0 for the daily review', () => {
    expect(missionRule({ surahs: {}, days: [], seen: [], garden: {}, rules: {} }).rules.length).toBeGreaterThan(0);
  });
});
