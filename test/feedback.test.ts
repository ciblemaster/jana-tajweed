import { describe, expect, it } from 'vitest';
import { beatOf, judgeRecitation, wantedCounts, type CheckLetter, type Heard } from '../src/core/tajweed/feedback';
import fixture from './fixtures/voice-112-1.json';

// قُلْ هُوَ ٱللَّهُ أَحَدٌ, simplified: each letter with the times a child might say it.
const L = (text: string, word: number, rule: CheckLetter['rule'] = null): CheckLetter => ({ text, word, rule });
const verse: CheckLetter[] = [
  L('قُ', 0), L('لۡ', 0),
  L('هُ', 1), L('وَ', 1),
  L('ٱ', 2, 'silent'), L('للَّ', 2), L('ا', 2, 'madd2'), L('هُ', 2),
  L('أَ', 3), L('حَ', 3), L('دٌ', 3)
];

/** A child reciting at `beat` ms a count, holding the madd for `madd` counts, every letter heard with `score`. */
function recite(beat: number, madd: number, score = 0.8): Heard[] {
  const out: Heard[] = [];
  let t = 200;
  for (const l of verse) {
    if (l.rule === 'silent' || l.rule === 'madd2') {
      out.push(null);
      if (l.rule === 'madd2') t += (madd - 1) * beat;
      continue;
    }
    out.push({ startMs: t, endMs: t + beat * 0.9, score });
    t += beat;
  }
  return out;
}

describe('Voice feedback (timing)', () => {
  it('finds the length of one count, however fast the child recites', () => {
    expect(beatOf(verse, recite(250, 2))).toBe(250);
    expect(beatOf(verse, recite(400, 2))).toBe(400);
  });

  it('is happy with a verse said clearly and held right', () => {
    const r = judgeRecitation(verse, recite(300, 2));
    expect(r.words).toEqual(['good', 'good', 'good', 'good']);
    expect(r.tip).toEqual({ kind: 'great' });
  });

  it('asks to hold a madd that was said as a short vowel', () => {
    const r = judgeRecitation(verse, recite(300, 1));
    expect(r.words[2]).toBe('almost');
    expect(r.tip).toEqual({ kind: 'hold', word: 2, rule: 'madd2', counts: 2 });
  });

  it('asks to say again a word the aligner barely heard, before anything else', () => {
    const heard = recite(300, 1);
    heard[8] = { ...heard[8]!, score: 0.1 };
    heard[9] = { ...heard[9]!, score: 0.1 };
    heard[10] = { ...heard[10]!, score: 0.1 };
    const r = judgeRecitation(verse, heard);
    expect(r.words[3]).toBe('again');
    expect(r.tip).toEqual({ kind: 'say', word: 3 });
  });

  it('lists every correction, most needed first', () => {
    const heard = recite(300, 1);
    heard[8] = { ...heard[8]!, score: 0.1 };
    heard[9] = { ...heard[9]!, score: 0.1 };
    heard[10] = { ...heard[10]!, score: 0.1 };
    heard[0] = { ...heard[0]!, score: 0.3 };
    heard[1] = { ...heard[1]!, score: 0.3 };
    const r = judgeRecitation(verse, heard);
    expect(r.fixes.map((f) => [f.kind, f.word])).toEqual([['say', 3], ['hold', 2], ['almost', 0]]);
  });

  it('has nothing to correct in a clear verse', () => {
    expect(judgeRecitation(verse, recite(300, 2)).fixes).toEqual([]);
  });

  it('calls a word almost when the aligner is unsure of it', () => {
    expect(judgeRecitation(verse, recite(300, 2, 0.3)).words).toEqual(['almost', 'almost', 'almost', 'almost']);
  });

  it('takes 2 counts for a long vowel before the last letter, where the reciter stops', () => {
    // ٱلنَّاسِ at the end of a verse: madd 'arid lil-sukun may be held 2, 4 or 6 counts.
    const end: CheckLetter[] = [L('مَ', 0), L('لِ', 0), L('كِ', 0), L('نَّ', 1, 'ghunnah'), L('ا', 1, 'madd4'), L('سِ', 1)];
    const heard: Heard[] = [
      { startMs: 0, endMs: 200, score: 0.9 }, { startMs: 250, endMs: 450, score: 0.9 }, { startMs: 500, endMs: 700, score: 0.9 },
      { startMs: 750, endMs: 1200, score: 0.9 }, null, { startMs: 1250, endMs: 1400, score: 0.9 }
    ];
    expect(wantedCounts(end, 4)).toBe(2);
    expect(judgeRecitation(end, heard).tip).toEqual({ kind: 'great' });
  });
});

describe('Voice feedback (held sounds the aligner cannot measure)', () => {
  it('does not measure a long vowel against a letter the aligner barely heard', () => {
    // ٱلَّذِي يُوَسۡوِسُ as the aligner heard the sheikh: ذِ placed with a score of 0.03, right before يُ.
    const v: CheckLetter[] = [L('ٱ', 0), L('لَّ', 0), L('ذِ', 0), L('ي', 0, 'madd2'), L('يُ', 1), L('وَ', 1), L('سۡ', 1), L('وِ', 1), L('سُ', 1)];
    const heard: Heard[] = [
      { startMs: 200, endMs: 580, score: 0.91 }, { startMs: 580, endMs: 840, score: 0.62 }, { startMs: 840, endMs: 940, score: 0.03 }, null,
      { startMs: 940, endMs: 1620, score: 0.6 }, { startMs: 1620, endMs: 1860, score: 0.6 }, { startMs: 1860, endMs: 2100, score: 0.82 },
      { startMs: 2100, endMs: 2360, score: 0.6 }, { startMs: 2360, endMs: 2600, score: 0.6 }
    ];
    expect(judgeRecitation(v, heard).tip).toEqual({ kind: 'great' });
    // The same short madd between two letters it is sure of is still pointed out.
    heard[2] = { ...heard[2]!, score: 0.8 };
    expect(judgeRecitation(v, heard).tip).toEqual({ kind: 'hold', word: 0, rule: 'madd2', counts: 2 });
  });

  it('finds the pace of a short verse from its counts, held sounds included', () => {
    // إِلَـٰهِ ٱلنَّاسِ by the sheikh: one short-vowel span only, so the beat comes from the whole verse.
    const v: CheckLetter[] = [L('إِ', 0), L('لَ', 0), L('ـٰ', 0, 'madd2'), L('هِ', 0), L('ٱ', 1, 'silent'), L('ل', 1, 'shamsi'), L('نَّ', 1, 'ghunnah'), L('ا', 1, 'madd4'), L('سِ', 1)];
    const heard: Heard[] = [
      { startMs: 221, endMs: 241, score: 0.67 }, { startMs: 342, endMs: 483, score: 0.71 }, null, { startMs: 804, endMs: 925, score: 0.62 }, null, null,
      { startMs: 1749, endMs: 1910, score: 0.6 }, null, { startMs: 2413, endMs: 2433, score: 0.63 }
    ];
    const r = judgeRecitation(v, heard);
    expect(r.beatMs).toBeCloseTo(2212 / 8, 0);
    expect(r.tip).toEqual({ kind: 'great' });
  });
});

describe('Voice feedback (real aligner output)', () => {
  const { letters, sheikh, wrongVerse, silence } = fixture as { letters: CheckLetter[]; sheikh: Heard[]; wrongVerse: Heard[]; silence: Heard[] };

  it('is happy with the sheikh reciting the verse', () => {
    const r = judgeRecitation(letters, sheikh);
    expect(r.words).toEqual(['good', 'good', 'good', 'good']);
    expect(r.tip).toEqual({ kind: 'great' });
    expect(r.beatMs).toBeGreaterThan(150);
    expect(r.beatMs).toBeLessThan(600);
  });

  it('asks to say again the words of another verse, and everything in silence', () => {
    expect(judgeRecitation(letters, wrongVerse).tip).toEqual({ kind: 'say', word: 0 });
    expect(judgeRecitation(letters, silence).words).toEqual(['again', 'again', 'again', 'again']);
  });

  it('measures the hum of a hidden noon until the next sound', () => {
    const hum: CheckLetter[] = [L('مِ', 0), L('نۡ', 0, 'ikhfa'), L('شَ', 0), L('رِّ', 0), L('مَ', 1), L('ا', 1, 'madd2')];
    const quick: Heard[] = [
      { startMs: 0, endMs: 280, score: 0.9 }, { startMs: 300, endMs: 400, score: 0.9 }, { startMs: 420, endMs: 700, score: 0.9 },
      { startMs: 720, endMs: 1000, score: 0.9 }, { startMs: 1020, endMs: 1700, score: 0.9 }, null
    ];
    expect(judgeRecitation(hum, quick).tip).toEqual({ kind: 'hold', word: 0, rule: 'ikhfa', counts: 2 });
  });
});

describe('A verse sent for checking', () => {
  it('has every letter of the sheikh’s recitation, with its word', async () => {
    const { buildTajweedTimeline } = await import('../src/core');
    const { loadSurah } = await import('../src/tajweed/surahs');
    const { verseForCheck } = await import('../src/tajweed/VoiceCheck');
    const timeline = buildTajweedTimeline(await loadSurah(112, null));
    const at = timeline.verses.findIndex((v) => v.pass === 'reciter');
    const { letters, words } = verseForCheck(timeline, at);
    const verse = timeline.verses[at];
    expect(letters).toHaveLength(verse.last - verse.first + 1);
    expect(words).toHaveLength(verse.words.length);
    expect(letters[letters.length - 1].word).toBe(words.length - 1);
    expect(words.join('')).toBe(letters.map((l) => l.text).join(''));
  });
});
