# Jana Tajweed

A kids app (ages 4 to 12) to learn tajweed and improve Quran recitation. Every letter lights up in its rule's colour as
the sheikh says it, then the child takes their turn.

This is Phase 0 of the plan: the "Tajweed for kids" page from Quran Video Maker, running on its own.

## What is here

| Path | What it is |
| --- | --- |
| `src/tajweed/` | The surah path (`Map.tsx`), the letter-by-letter player (`Tajweed.tsx`), rule cards, stars and awards (`progress.ts`, kept on the device) |
| `src/tajweed/surah-data/` | 38 surahs (Al-Fatihah and Juz Amma): letters, tajweed rule per letter, timings, Sheikh Al-Minshawi's kids-repeat recording |
| `src/core/tajweed/` | Types, the 15 rules, the timeline builder |
| `src/core/texts.ts` | Texts in 8 languages (en, ar, fr, id, ur, bn, tr, ms) |
| `src/core/lang.ts` | Language choice (`?lang=`, then the last choice, then the browser), RTL for Arabic and Urdu |
| `src/core/fonts.ts` | The mushaf face (`public/fonts/UthmanicHafs.woff2`) and Lalezar for headings |
| `scripts/tajweed/` | Data pipeline: rules from the Quran.com tajweed text (`letters.py`), letter timing with Meta's MMS aligner (`align.py`), JSON output (`dataset.py`) |

## Run

```sh
npm install
npm run dev        # http://localhost:5173, add ?surah=114 to open a surah, ?lang=ar for Arabic
npm test           # timeline tests
npm run build      # type check + production build in dist/
```

Audio streams from download.quranicaudio.com. Check its terms before a public release, or host the files.
