// Writes Al-Fatihah's letters, rules and hand-measured times as JSON for the aligner.
import { writeFileSync } from 'node:fs';
import { buildTajweedTimeline, FATIHA_HUSARY } from '../../shared/src/tajweed';

const timeline = buildTajweedTimeline(FATIHA_HUSARY);
const verses = timeline.verses.map((verse, v) => ({
  ayah: verse.ayah,
  startMs: verse.startMs,
  endMs: verse.endMs,
  words: verse.words.map((word) => ({
    startMs: word.startMs,
    endMs: word.endMs,
    letters: timeline.letters.slice(word.first, word.last + 1).map((l) => ({ text: l.text, rule: l.rule ?? null, startMs: l.startMs, endMs: l.endMs }))
  })),
  first: v === 0
}));
writeFileSync(process.argv[2], JSON.stringify({ audioUrl: timeline.audioUrl, verses }, null, 1));
console.log('letters', timeline.letters.length);
