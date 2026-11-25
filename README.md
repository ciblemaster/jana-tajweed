# Jana Tajweed

A kids app (ages 4 to 12) to learn tajweed and improve Quran recitation. Every letter lights up in its rule's colour as
the sheikh says it, then the child takes their turn.

What works today (Phase 1, the kids MVP):

- **Child profiles**: up to 5 children on a device, each with an animal and an age band (4 to 6, 7 to 9, 10 to 12).
- **Rule Garden**: levels for stretching sounds (madd), the lam of Al, and bouncing letters (qalqalah). Each level has
  five steps: meet it, hear it, spot it (a game), say it (record a word), and a challenge that opens the next level.
- **Surah journey**: 38 surahs where each letter lights up in its rule's colour as the sheikh says it. After each
  verse the child takes a turn, can record it, and compares their voice with the sheikh's.
- **Installable and offline**: the app and all surah data work without internet; the recitations still stream.

## What is here

| Path | What it is |
| --- | --- |
| `src/tajweed/` | The surah path (`Map.tsx`), the letter-by-letter player (`Tajweed.tsx`), rule cards, stars and awards (`progress.ts`, kept on the device) |
| `src/tajweed/surah-data/` | 38 surahs (Al-Fatihah and Juz Amma): letters, tajweed rule per letter, timings, Sheikh Al-Minshawi's kids-repeat recording |
| `src/core/tajweed/` | Types, the 15 rules, the timeline builder |
| `src/core/texts.ts` | Texts in 8 languages (en, ar, fr, id, ur, bn, tr, ms) |
| `src/core/lang.ts` | Language choice (`?lang=`, then the last choice, then the browser), RTL for Arabic and Urdu |
| `src/garden/` | Rule Garden levels (`levels.ts`), example words and game questions (`examples.ts`), the lesson screen (`Lesson.tsx`) |
| `src/profiles/` | Child profiles kept on the device, the "Who is learning today?" screen |
| `src/core/fonts.ts` | The mushaf face (`public/fonts/UthmanicHafs.woff2`) and Lalezar for headings |
| `scripts/tajweed/` | Data pipeline: rules from the Quran.com tajweed text (`letters.py`), letter timing with Meta's MMS aligner (`align.py`), JSON output (`dataset.py`) |

## Run

```sh
npm install
npm run dev        # http://localhost:5173, add ?surah=114 to open a surah, ?lang=ar for Arabic
npm test           # timeline and Rule Garden tests
npm run build      # type check + production build in dist/
```

Audio streams from download.quranicaudio.com. Check its terms before a public release, or host the files.

## Web: quranvideomaker.com/janatajweed

`BASE_PATH=/janatajweed npm run build` builds the app to be served under that path (fonts, icons, the install
manifest, the service worker and `/api` calls all follow it). `deploy/deploy.sh` does that and copies `dist/` to
`/var/www/janatajweed` on the quranvideomaker.com server; Apache serves the folder with the lines in
`deploy/apache-janatajweed.conf` (added once). Only the app itself goes there: accounts and voice feedback need
`server/` running behind `/janatajweed/api`, which is not set up yet.

## Server: accounts and sync (optional)

The app works fully on one device without any server. A grown-up can create an account on the grown-ups' page
to keep their children's progress on every phone and tablet. The server in `server/` is Node + Express + Postgres.

```sh
cd server
npm install
cp .env.example .env        # set DATABASE_URL and SESSION_SECRET
export $(cat .env | xargs)
npm run dev                 # creates its tables on start, listens on :8787
```

Then run `npm run dev` at the root as usual: Vite sends `/api` calls to the server. In production, run
`npm run build` at the root and `NODE_ENV=production npm start` in `server/`: the server hands out the built
app too, so the sign-in cookie stays on one site.

What it keeps: the grown-up's email and a scrypt password hash, and for each child (at most five) a first name,
animal, age group and game progress. Voice recordings never leave the device. Deleting the account deletes all of it.
A removed child keeps only their id, so other devices remove them too.

Sync runs when the app opens and when it goes to the background. Progress from both sides is merged
(`mergeProgress` in `src/tajweed/progress.ts`), so nothing won on either device is lost.

Server tests need a throwaway Postgres database:

```sh
cd server && TEST_DATABASE_URL=postgres://localhost/jana_test npm test
```

## Voice feedback (trial, optional)

With a grown-up's account, voice feedback can be turned on per device on the grown-ups' page. After a child recites a
verse with "Record me" on, "Check my reading" sends that one take to the server, which passes it to the speech service
and keeps nothing. Each word then shows green (clear), orange (almost, or a long sound held too short) or grey
(say it again), with one tip. Scoring is in `src/core/tajweed/feedback.ts`.

The speech service is `scripts/tajweed/serve.py` (Meta's MMS aligner, the same as `align.py`):

```sh
uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python torch==2.5.1 torchaudio==2.5.1 numpy
.venv/bin/python scripts/tajweed/serve.py      # 127.0.0.1:8790, downloads the 1.2 GB model on first start; needs ffmpeg
```

Then start the server with `SPEECH_URL=http://127.0.0.1:8790`. It is a trial: per the plan, it should be checked
against a teacher on real children's recitations (8 verses in 10 agreeing) before it is shown to children widely.
`python3 -m unittest scripts/tajweed/test_sounds.py` tests how letters are said (no torch needed).

## Phone and tablet apps (Capacitor)

`android/` and `ios/` hold the native shells around the same web app. To build them:

```sh
VITE_API_URL=https://your-server.example npm run app:sync   # build the web app and copy it into both shells
npm run app:android                                        # opens Android Studio: Run, or Build > Generate Signed Bundle
npm run app:ios                                            # opens Xcode (on a Mac, after `cd ios/App && pod install`)
```

Without `VITE_API_URL` the apps work fully on the device, without accounts or voice feedback. Calls to the server
go through Capacitor's native HTTP layer, so the sign-in cookie works inside the app. The microphone permission is
declared for both (Android `RECORD_AUDIO`, iOS `NSMicrophoneUsageDescription`). The service worker is only
registered on the web. Store icons and splash screens still need to be made from `public/icons/`
(for example with `npx @capacitor/assets generate`).
