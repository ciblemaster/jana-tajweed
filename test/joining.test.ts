import { afterEach, describe, expect, it, vi } from 'vitest';
import { tapHit, wordUnits } from '../src/garden/joining';

const ZWJ = '‍';
const word = (...parts: [string, string?][]) =>
  parts.map(([text, rule], index) => ({ index, verse: 1, word: 0, text, rule, startMs: 0, endMs: 1 }) as never);

describe('letters stay joined in their spans', () => {
  it('keeps lam and alif as one piece, with the waw before it on its own', () => {
    // وَلَا
    const units = wordUnits(word(['وَ'], ['لَ'], ['ا', 'madd2']));
    expect(units.map((u) => u.letters.length)).toEqual([1, 2]);
    expect(units[1].text).toBe('لَا');
    // Waw never joins the letter after it: no joiners anywhere.
    expect(units.map((u) => u.text).join('')).not.toContain(ZWJ);
  });

  it('groups every alif with a lam before it', () => {
    for (const alif of ['ا', 'أ', 'إ', 'آ', 'ٱ']) {
      const units = wordUnits(word(['قَ'], ['لْ'], [alif]));
      expect(units).toHaveLength(2);
      expect(units[1].letters.map((l: { text: string }) => l.text)).toEqual(['لْ', alif]);
      // The qaf joins the lam-alif.
      expect(units[0].text.endsWith(ZWJ)).toBe(true);
      expect(units[1].text.startsWith(ZWJ)).toBe(true);
    }
  });

  it('puts a joiner on both sides of every join, and none after a letter that joins only before it', () => {
    // صَفًّا: sad joins fa, fa joins alif.
    const units = wordUnits(word(['صَ'], ['فًّ'], ['ا', 'madd2']));
    expect(units.map((u) => u.text)).toEqual([`صَ${ZWJ}`, `${ZWJ}فًّ${ZWJ}`, `${ZWJ}ا`]);
    // دَرَسَ: dal and ra join nothing after them.
    const dars = wordUnits(word(['دَ'], ['رَ'], ['سَ']));
    expect(dars.map((u) => u.text)).toEqual(['دَ', 'رَ', 'سَ']);
  });

  it('keeps a mark-only letter on its letter and the join after it', () => {
    // A small alif above as a letter of its own between two joined letters.
    const units = wordUnits(word(['هَ'], ['ٰ', 'madd2'], ['ذَ']));
    expect(units.map((u) => u.text)).toEqual(['هَ', `ٰ${ZWJ}`, `${ZWJ}ذَ`]);
  });

  it('does not double the joiners a letter already carries', () => {
    const units = wordUnits(word(['فِ'], [`${ZWJ}ي${ZWJ}`, 'madd2'], ['هِ']));
    expect(units[1].text).toBe(`${ZWJ}ي${ZWJ}`);
  });
});

describe('tapping a letter', () => {
  it('counts a tap on lam-alif as right when either letter is the answer', () => {
    const [, lamAlif] = wordUnits(word(['وَ'], ['لَ'], ['ا', 'madd2']));
    expect(tapHit(lamAlif.letters, (l) => l.rule === 'madd2')?.text).toBe('ا');
    const [, lamAlifLam] = wordUnits(word(['وَ'], ['لْ', 'qamari'], ['ا']));
    expect(tapHit(lamAlifLam.letters, (l) => l.rule === 'qamari')?.text).toBe('لْ');
    const [waw] = wordUnits(word(['وَ'], ['لَ'], ['ا', 'madd2']));
    expect(tapHit(waw.letters, (l) => l.rule === 'madd2')).toBeUndefined();
  });
});

describe('the way home', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is never an empty link, even inside the iPhone app', async () => {
    const { gameUrl, missionUrl } = await import('../src/tajweed/surahs');
    vi.stubGlobal('window', { location: new URL('capacitor://localhost?mission') });
    expect(gameUrl()).toBe('/');
    expect(missionUrl()).toBe('/?mission');
    vi.stubGlobal('window', { location: new URL('http://localhost:5173/?mission&lang=ar') });
    expect(gameUrl()).toBe('/?lang=ar');
    expect(gameUrl(112)).toBe('/?lang=ar&surah=112');
  });
});
