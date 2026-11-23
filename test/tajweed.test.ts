import { describe, expect, it } from 'vitest';
import { buildTajweedTimeline, FALAQ_MINSHAWI_KIDS, FATIHA_HUSARY, FATIHA_HUSARY_MMS, tajweedLetterAt, tajweedVerseAt, TAJWEED_RULES } from '../src/core/tajweed';

/** Al-Fatihah as the site stores it (King Fahd Complex, Hafs). */
const STORED = [
  'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
  'ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَـٰلَمِینَ',
  'ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
  'مَـٰلِكِ یَوۡمِ ٱلدِّینِ',
  'إِیَّاكَ نَعۡبُدُ وَإِیَّاكَ نَسۡتَعِینُ',
  'ٱهۡدِنَا ٱلصِّرَ\u200Aٰ\u2060طَ ٱلۡمُسۡتَقِیمَ',
  'صِرَ\u200Aٰ\u2060طَ ٱلَّذِینَ أَنۡعَمۡتَ عَلَیۡهِمۡ غَیۡرِ ٱلۡمَغۡضُوبِ عَلَیۡهِمۡ وَلَا ٱلضَّاۤلِّینَ'
];

/** The stored text without its invisible joiners and with the Arabic yeh every font draws. */
const plain = (text: string) => text.replace(/[\u200A\u2060]/g, '').replaceAll('\u06CC', '\u064A');

describe('tajweed letters of Al-Fatihah', () => {
  const timeline = buildTajweedTimeline(FATIHA_HUSARY);

  it('spell every verse exactly as the stored text', () => {
    FATIHA_HUSARY.verses.forEach((verse, v) => {
      const spelled = verse.words.map((word) => word.letters.map(([text]) => text).join('')).join(' ');
      expect(spelled).toBe(plain(STORED[v]));
    });
  });

  it('run forward in time and fill each word', () => {
    timeline.letters.forEach((letter, i) => {
      expect(letter.endMs).toBeGreaterThan(letter.startMs);
      if (i > 0) expect(letter.startMs).toBeGreaterThanOrEqual(timeline.letters[i - 1].endMs);
    });
    for (const verse of timeline.verses) {
      for (const word of verse.words) {
        expect(timeline.letters[word.first].startMs).toBe(word.startMs);
        expect(timeline.letters[word.last].endMs).toBe(word.endMs);
      }
      expect(verse.endMs).toBeGreaterThan(verse.words[verse.words.length - 1].endMs);
    }
  });

  it('carry only known rules, and the rules Al-Fatihah has', () => {
    const used = new Set(timeline.letters.map((l) => l.rule).filter(Boolean));
    for (const rule of used) expect(TAJWEED_RULES).toContain(rule);
    expect([...used].sort()).toEqual(['heavy', 'izhar', 'madd2', 'madd4', 'madd6', 'qamari', 'shamsi', 'silent']);
    // One madd of six counts, in the last word, and a madd before the stop of every verse.
    expect(timeline.letters.filter((l) => l.rule === 'madd6')).toHaveLength(1);
    expect(timeline.letters.filter((l) => l.rule === 'madd4')).toHaveLength(7);
  });

  it('find the letter and the verse being recited', () => {
    expect(tajweedLetterAt(timeline, 0)).toBe(-1);
    expect(timeline.letters[tajweedLetterAt(timeline, 3500)].rule).toBe('madd4');
    expect(timeline.letters[tajweedLetterAt(timeline, 43000)].rule).toBe('madd6');
    expect(tajweedVerseAt(timeline, 5100)).toBe(0);
    expect(tajweedVerseAt(timeline, 6000)).toBe(1);
    expect(tajweedVerseAt(timeline, 99999)).toBe(6);
  });
});

describe('Al-Fatihah timed by the aligner', () => {
  const hand = buildTajweedTimeline(FATIHA_HUSARY);
  const machine = buildTajweedTimeline(FATIHA_HUSARY_MMS);

  it('has the same letters and rules as the hand-measured timing', () => {
    expect(machine.letters.map((l) => [l.text, l.rule, l.verse, l.word])).toEqual(hand.letters.map((l) => [l.text, l.rule, l.verse, l.word]));
  });

  it('runs forward in time and stays inside each verse', () => {
    machine.letters.forEach((letter, i) => {
      expect(letter.endMs).toBeGreaterThan(letter.startMs);
      if (i > 0) expect(letter.startMs).toBeGreaterThanOrEqual(machine.letters[i - 1].endMs);
    });
    for (const verse of machine.verses) expect(verse.endMs).toBeGreaterThan(machine.letters[verse.last].endMs);
  });

  it('agrees with the hand-measured timing on most letters', () => {
    const apart = machine.letters.map((l, i) => Math.abs(l.startMs - hand.letters[i].startMs)).sort((a, b) => a - b);
    expect(apart[Math.floor(apart.length / 2)]).toBeLessThan(60);
    expect(apart.filter((ms) => ms <= 100).length / apart.length).toBeGreaterThan(0.8);
  });
});

describe('Al-Falaq with children repeating', () => {
  const timeline = buildTajweedTimeline(FALAQ_MINSHAWI_KIDS);

  it('spells the five verses as the stored text, without the basmala', () => {
    // Copied from the stored text by script, with the Arabic yeh every font draws.
    const stored = ['قُلۡ أَعُوذُ بِرَبِّ ٱلۡفَلَقِ', 'مِن شَرِّ مَا خَلَقَ', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِي ٱلۡعُقَدِ', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'];
    FALAQ_MINSHAWI_KIDS.verses.forEach((verse, v) => {
      expect(verse.words.map((word) => word.letters.map(([text]) => text).join('')).join(' ')).toBe(stored[v]);
    });
  });

  it('recites every verse twice: the sheikh, then the children, with the same letters', () => {
    expect(timeline.verses.map((v) => `${v.ayah}${v.pass[0]}`)).toEqual(['1r', '1c', '2r', '2c', '3r', '3c', '4r', '4c', '5r', '5c']);
    for (let v = 0; v < timeline.verses.length; v += 2) {
      const [sheikh, children] = [timeline.verses[v], timeline.verses[v + 1]];
      const letters = (verse: typeof sheikh) => timeline.letters.slice(verse.first, verse.last + 1).map((l) => [l.text, l.rule]);
      expect(letters(children)).toEqual(letters(sheikh));
      expect(children.startMs).toBeGreaterThanOrEqual(sheikh.endMs);
    }
  });

  it('runs forward in time', () => {
    timeline.letters.forEach((letter, i) => {
      expect(letter.endMs).toBeGreaterThan(letter.startMs);
      if (i > 0) expect(letter.startMs).toBeGreaterThanOrEqual(timeline.letters[i - 1].endMs);
    });
    for (const verse of timeline.verses) expect(verse.endMs).toBeGreaterThanOrEqual(timeline.letters[verse.last].endMs);
  });

  it('ends every verse on a bounce and hides the noon of "min sharri"', () => {
    const sheikh = timeline.verses.filter((v) => v.pass === 'reciter');
    for (const verse of sheikh) expect(timeline.letters[verse.last].rule).toBe('qalqalah');
    expect(timeline.letters.filter((l) => l.rule === 'ikhfa' && timeline.verses[l.verse].pass === 'reciter')).toHaveLength(4);
    expect(timeline.letters.filter((l) => l.rule === 'ghunnah' && timeline.verses[l.verse].pass === 'reciter')).toHaveLength(1);
  });
});
