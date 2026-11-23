"""Letter-level forced alignment of a recitation with Meta's MMS aligner (torchaudio MMS_FA).

Each letter of a verse (a consonant with its marks) is written the way it is said, in the Latin letters the model
knows; the model then says where each of those sounds is in the recording. Letters that are not said (the joining
alef, the sun lam, a dropped alef) get no sound of their own, and a long vowel shares the sound of its consonant.

A teaching recording, where children repeat each verse after the sheikh, is aligned with "passes": 2 in the letters
file: every verse is then expected twice, and each recitation gets its own times.

How the aligned datasets in shared/src/tajweed were made (a trial, not part of the site's build):

    uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python torch==2.5.1 torchaudio==2.5.1 soundfile numpy
    ffmpeg -i recitation.mp3 -ac 1 -ar 16000 recitation.wav     # the recording named in the dataset's audioUrl
    .venv/bin/python scripts/tajweed/align.py letters.json recitation.wav aligned.json

letters.json is {"passes": 1 or 2, "verses": [{"ayah": 1, "words": [{"letters": [{"text": "بِ", "rule": null}]}]}]};
scripts/tajweed/dump.ts writes it from a dataset that already exists. The first run downloads the model (1.2 GB).
A long recording is heard in windows and then aligned in one go, so no verse times are needed beforehand.

On Al-Husary's Al-Fatihah the letter starts land a median 43 ms from hand-measured ones, 86% within 100 ms. Where
they differ most is a doubled letter after a long vowel, which the model cannot place: see HOLD_AFTER_MADD_MS.

Usage: align.py <letters.json> <audio.wav> <out.json>
"""
import json
import sys

import torch
import torchaudio

LETTERS, WAV, OUT = sys.argv[1:4]

CONSONANT = {
    'ب': 'b', 'ت': 't', 'ث': 't', 'ج': 'j', 'ح': 'h', 'خ': 'k', 'د': 'd', 'ذ': 'd', 'ر': 'r', 'ز': 'z', 'س': 's',
    'ش': 's', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'g', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 't',
}
TATWEEL, DAGGER = '\u0640', '\u0670'
VOWEL = {'\u064E': 'a', '\u0650': 'i', '\u064F': 'u'}
TANWEEN = {'\u064B': 'a', '\u08F0': 'a', '\u064C': 'u', '\u08F1': 'u', '\u064D': 'i', '\u08F2': 'i'}
SMALL_MEEM = ('\u06E2', '\u06ED')
HAMZA_MARKS = ('\u0654', '\u0655')
MADD = ('madd2', 'madd4', 'madd5', 'madd6')
MERGED = ('idgham', 'idghamg')
SILENT = ('silent', 'shamsi')
# The long vowel's own share starts just after its consonant's vowel begins, so the consonant lights first.
HARAKA_MS = 40
# A spike comes about this long after its sound begins, and a short vowel lasts about this long after its spike.
LEAD_MS = 50
TAIL_MS = 80
# After a long vowel nothing marks where a doubled letter's hold begins: allow it this much before its release.
HOLD_AFTER_MADD_MS = 300
SILENT_MS = 30
FRAME_MS = 20
# The voice has stopped once it stays below this share of the loudest moment for three 10 ms windows.
QUIET = 0.04
# A long recording is heard in windows of this many 20 ms frames, each with some sound on both sides for context.
WINDOW, CONTEXT = 1500, 100


def said(flat, i):
    """The sounds of one letter of a recitation, or '' when it has none of its own."""
    text, rule = flat[i]['text'], flat[i]['rule']
    if rule in SILENT:
        return ''
    base, marks = text[0], text[1:]
    if rule in MADD and base in (TATWEEL, DAGGER, 'ا', 'ي', 'و', 'ى'):
        return ''  # a long vowel: it continues the vowel of the letter before it
    if base == 'ٱ':
        # Said only when a recitation begins with it: "al-", or before a verb "u" when its third letter has a damma, else "i".
        if i != 0:
            return ''
        if flat[1]['text'][0] == 'ل':
            return 'a'
        return 'u' if len(flat) > 2 and '\u064F' in flat[2]['text'] else 'i'
    seat = any(m in marks for m in HAMZA_MARKS)  # a hamza written on this letter: only its vowel is heard
    if base in ('ا', 'ى') and not seat:
        return ''
    sound = '' if seat else CONSONANT.get(base, '')
    vowel = next((VOWEL[m] for m in marks if m in VOWEL), '')
    tanween = next((TANWEEN[m] for m in marks if m in TANWEEN), '')
    if i == len(flat) - 1:
        return 'h' if base == 'ة' else sound  # we stop on the last letter: no vowel, and the round ta is a ha
    if tanween:
        ends_on_alef = i == len(flat) - 2 and flat[-1]['rule'] == 'madd2' and flat[-1]['text'][0] in ('ا', 'ى')
        if ends_on_alef or rule in MERGED:
            return sound + tanween
        return sound + tanween + ('m' if rule == 'iqlab' else 'n')
    if vowel and any(m in marks for m in SMALL_MEEM):
        return sound + vowel + 'm'  # a tanween turned into a meem
    if not vowel:
        if rule in MERGED:
            return ''  # merged into the next letter
        if base == 'ن' and rule == 'iqlab':
            return 'm'
    return sound + vowel


def loudness(wave, rate):
    """How loud each 10 ms window is, as a share of the loudest."""
    hop = rate // 100
    frames = wave[0, : wave.shape[1] // hop * hop].reshape(-1, hop)
    rms = frames.pow(2).mean(dim=1).sqrt()
    return rms / rms.max()


def voice_end(loud, after_ms, limit_ms):
    """Where the voice stops between a last sound and the next recitation; the quietest moment if it never quite does."""
    first, last = int(after_ms // 10) + 3, max(int(limit_ms // 10), int(after_ms // 10) + 4)
    last = min(last, len(loud))
    for t in range(first, last - 2):
        if loud[t] < QUIET and loud[t + 1] < QUIET and loud[t + 2] < QUIET:
            return t * 10
    window = loud[first:last]
    return (first + int(window.argmin())) * 10 if len(window) else limit_ms


def main():
    data = json.load(open(LETTERS))
    passes = data.get('passes', 1)
    bundle = torchaudio.pipelines.MMS_FA
    model = bundle.get_model(with_star=False)
    model.eval()
    dictionary = bundle.get_dict(star=None)
    vowels = {dictionary[v] for v in 'aiu'}
    wave, rate = torchaudio.load(WAV)
    assert rate == bundle.sample_rate
    audio_ms = wave.shape[1] / rate * 1000
    loud = loudness(wave, rate)

    # One recitation of one verse at a time, in the order they are heard.
    recitations = []
    tokens, owner = [], []
    for verse in data['verses']:
        verse['passes'] = []
        for _ in range(passes):
            flat = [dict(letter, word=w) for w, word in enumerate(verse['words']) for letter in word['letters']]
            for i, letter in enumerate(flat):
                sounds = said(flat, i)
                # A letter merged into the same letter after it (the two lams of the name of Allah) shares its sound.
                if letter['rule'] is None and len(letter['text']) == 1 and i + 1 < len(flat) and flat[i + 1]['text'][0] == letter['text'] and flat[i + 1]['rule'] not in SILENT:
                    sounds = ''
                    letter['merged'] = True
                letter['said'] = sounds
                for ch in sounds:
                    tokens.append(dictionary[ch])
                    owner.append((len(recitations), i))
            recitations.append(flat)
            verse['passes'].append(flat)

    # The model hears the recording window by window; the frames are 20 ms apart from the recording's start.
    hop, receptive = 320, 400
    frames = (wave.shape[1] - receptive) // hop + 1
    heard = []
    with torch.inference_mode():
        for at in range(0, frames, WINDOW):
            first, last = max(0, at - CONTEXT), min(frames, at + WINDOW + CONTEXT)
            window, _ = model(wave[:, first * hop: (last - 1) * hop + receptive])
            heard.append(window[:, at - first: at - first + min(WINDOW, frames - at)])
    emission = torch.cat(heard, dim=1)
    aligned, scores = torchaudio.functional.forced_align(emission, torch.tensor([tokens], dtype=torch.int32), blank=0)
    spans = torchaudio.functional.merge_tokens(aligned[0], scores[0].exp())
    assert len(spans) == len(tokens), (len(spans), len(tokens))
    ratio = FRAME_MS

    # The model marks each sound with a short spike a little after the sound begins, not with its edges.
    spike = {}
    for span, key in zip(spans, owner):
        at = span.start * ratio
        first, _, count, vowel = spike.get(key, (at, at, 0, None))
        if span.token in vowels and vowel is None and count > 0:
            vowel = at
        spike[key] = (first, at, count + 1, vowel)

    # A letter starts LEAD_MS before its first spike. A doubled letter is held before it is released, and its spike
    # comes at the release: it starts when the sound before it ends.
    onset = {}
    for r, flat in enumerate(recitations):
        heard = [i for i in range(len(flat)) if (r, i) in spike]
        for n, i in enumerate(heard):
            start = spike[(r, i)][0] - LEAD_MS
            if n == 0:
                start = max(start, 0)
            else:
                j = heard[n - 1]
                if 'ّ' in flat[i]['text']:
                    after_long_vowel = any(flat[k]['rule'] in MADD for k in range(j + 1, i))
                    held_from = spike[(r, j)][1] + TAIL_MS
                    start = max(held_from, start - HOLD_AFTER_MADD_MS) if after_long_vowel else min(start, max(held_from, onset[(r, j)] + FRAME_MS))
                start = max(start, onset[(r, j)] + FRAME_MS)
            onset[(r, i)] = start

    for r, flat in enumerate(recitations):
        heard = [i for i in range(len(flat)) if (r, i) in spike]
        following = recitations[r + 1] if r + 1 < len(recitations) else None
        limit = min(onset[(r + 1, i)] for i in range(len(following)) if (r + 1, i) in onset) if following else audio_ms
        stop = max(min(voice_end(loud, spike[(r, heard[-1])][1], limit), limit), onset[(r, heard[-1])] + FRAME_MS)
        times = [None] * len(flat)
        vowel_onset = {}
        for n, i in enumerate(heard):
            times[i] = [onset[(r, i)], onset[(r, heard[n + 1])] if n + 1 < len(heard) else stop]
            vowel = spike[(r, i)][3]
            vowel_onset[i] = None if vowel is None else max(onset[(r, i)], vowel - LEAD_MS)

        # A long vowel takes its consonant's vowel from just after it begins.
        for i, letter in enumerate(flat):
            if times[i] is None and letter['rule'] in MADD:
                # The letter whose vowel it lengthens: the nearest one before it that has a sound.
                j = i - 1
                while j >= 0 and times[j] is None:
                    j -= 1
                if j < 0:
                    continue
                begins = vowel_onset.get(j) if vowel_onset.get(j) is not None else times[j][0]
                cut = begins + min(HARAKA_MS, 0.4 * (times[j][1] - begins))
                times[i] = [cut, times[j][1]]
                times[j][1] = cut
        # The first of two merged letters takes the first part of their shared hold.
        for i, letter in enumerate(flat):
            if letter.get('merged'):
                j = i + 1
                start = times[j][0]
                hold_end = vowel_onset.get(j) if vowel_onset.get(j) is not None else times[j][1]
                cut = start + 0.45 * (hold_end - start)
                times[i] = [start, cut]
                times[j][0] = cut
        # A silent letter takes a sliver before the next letter, or after the one before it at a word's end.
        for i in range(len(flat) - 1, -1, -1):
            if times[i] is not None:
                continue
            before = next((j for j in range(i - 1, -1, -1) if times[j] is not None), None)
            in_word = i + 1 < len(flat) and times[i + 1] is not None and flat[i]['word'] == flat[i + 1]['word']
            if in_word or before is None:
                j = i + 1
                start = times[j][0]
                take = min(SILENT_MS, 0.3 * (times[j][1] - start))
                times[i] = [start, start + take]
                times[j][0] = start + take
            else:
                end = times[before][1]
                take = min(SILENT_MS, 0.3 * (end - times[before][0]))
                times[i] = [end - take, end]
                times[before][1] = end - take

        for i, letter in enumerate(flat):
            letter['startMs'], letter['endMs'] = round(times[i][0]), round(times[i][1])
        # The board moves on halfway through the breath that follows.
        flat.append(round(stop + (limit - stop) / 2) if following else round(min(audio_ms, stop + 300)))

    out = {'surah': data.get('surah'), 'audioUrl': data.get('audioUrl'), 'passes': passes, 'verses': []}
    for verse in data['verses']:
        entry = {'ayah': verse['ayah'], 'passes': []}
        for flat in verse['passes']:
            end = flat.pop()
            words = []
            for letter in flat:
                while len(words) <= letter['word']:
                    words.append([])
                words[letter['word']].append({k: letter[k] for k in ('text', 'rule', 'said', 'startMs', 'endMs')})
            entry['passes'].append({'endMs': end, 'words': words})
            print(f"verse {verse['ayah']}: {' '.join(l['said'] for l in flat if l['said'])}  [{flat[0]['startMs']}-{flat[-1]['endMs']}]")
        out['verses'].append(entry)
    json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)


main()
