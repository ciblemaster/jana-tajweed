import type { TajweedSurahSource } from './types';

/**
 * Al-Fatihah by Sheikh Al-Husary again, with the same letters and rules as FATIHA_HUSARY but timed by a machine:
 * Meta's MMS forced aligner (torchaudio MMS_FA) heard the recording and marked each sound. A trial, kept beside the
 * hand-measured timing so the two can be compared by ear on the page.
 *
 * The aligner marks a sound with a spike about 50 ms after it begins, so each letter starts that long before its
 * spike. It hears sounds, not letters, so some letters are placed by rule: a silent letter takes a sliver before the
 * next one, a long vowel starts just after its consonant's vowel, a doubled letter starts when the sound before it
 * ends, and the first of two merged lams takes the first part of their shared sound.
 */
export const FATIHA_HUSARY_MMS: TajweedSurahSource = {
  surah: 1,
  reciterId: 'ar.husary',
  audioUrl: 'https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/1.mp3',
  verses: [
    {
      ayah: 1,
      endMs: 5165,
      words: [
        { startMs: 30, endMs: 540, letters: [['بِ', 180], ['سۡ', 140], ['مِ', 190]] },
        { startMs: 540, endMs: 1320, letters: [['ٱ', 30, 'silent'], ['ل', 74], ['لَّ', 366, 'madd2'], ['هِ', 310]] },
        { startMs: 1320, endMs: 2480, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['رَّ', 280, 'heavy'], ['حۡ', 180], ['مَ', 140], ['ـٰ', 260, 'madd2'], ['نِ', 270]] },
        { startMs: 2480, endMs: 4480, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['رَّ', 260, 'heavy'], ['حِ', 180], ['ي', 1381, 'madd4'], ['مِ', 149]] },
      ]
    },
    {
      ayah: 2,
      endMs: 11121,
      words: [
        { startMs: 5851, endMs: 6631, letters: [['ٱ', 100], ['لۡ', 140, 'qamari'], ['حَ', 200], ['مۡ', 140, 'izhar'], ['دُ', 200]] },
        { startMs: 6631, endMs: 7531, letters: [['لِ', 190], ['لَّ', 450, 'madd2'], ['هِ', 260]] },
        { startMs: 7531, endMs: 8131, letters: [['رَ', 210, 'heavy'], ['بِّ', 390]] },
        { startMs: 8131, endMs: 10550, letters: [['ٱ', 30, 'silent'], ['لۡ', 130, 'qamari'], ['عَ', 140], ['ـٰ', 320, 'madd2'], ['لَ', 200], ['مِ', 140], ['ي', 1260, 'madd4'], ['نَ', 199]] },
      ]
    },
    {
      ayah: 3,
      endMs: 15696,
      words: [
        { startMs: 11691, endMs: 13122, letters: [['ٱ', 130], ['ل', 30, 'shamsi'], ['رَّ', 380, 'heavy'], ['حۡ', 181], ['مَ', 160], ['ـٰ', 260, 'madd2'], ['نِ', 290]] },
        { startMs: 13122, endMs: 15100, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['رَّ', 280, 'heavy'], ['حِ', 180], ['ي', 1300, 'madd4'], ['مِ', 188]] },
      ]
    },
    {
      ayah: 4,
      endMs: 20481,
      words: [
        { startMs: 16292, endMs: 17132, letters: [['مَ', 140], ['ـٰ', 260, 'madd2'], ['لِ', 180], ['كِ', 260]] },
        { startMs: 17132, endMs: 17982, letters: [['يَ', 240], ['وۡ', 240], ['مِ', 370]] },
        { startMs: 17982, endMs: 19790, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['دِّ', 240], ['ي', 1320, 'madd4'], ['نِ', 218]] },
      ]
    },
    {
      ayah: 5,
      endMs: 27422,
      words: [
        { startMs: 21173, endMs: 22133, letters: [['إِ', 130], ['يَّ', 310], ['ا', 320, 'madd2'], ['كَ', 200]] },
        { startMs: 22133, endMs: 22993, letters: [['نَ', 240], ['عۡ', 180], ['بُ', 220], ['دُ', 220]] },
        { startMs: 22993, endMs: 24333, letters: [['وَ', 320], ['إِ', 130], ['يَّ', 330], ['ا', 340, 'madd2'], ['كَ', 220]] },
        { startMs: 24333, endMs: 26810, letters: [['نَ', 220], ['سۡ', 140], ['تَ', 260], ['عِ', 180], ['ي', 1460, 'madd4'], ['نُ', 217]] },
      ]
    },
    {
      ayah: 6,
      endMs: 32947,
      words: [
        { startMs: 28033, endMs: 28763, letters: [['ٱ', 120], ['هۡ', 140], ['دِ', 180], ['نَ', 260], ['ا', 30, 'silent']] },
        { startMs: 28763, endMs: 29734, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['صِّ', 281, 'heavy'], ['رَ', 140, 'heavy'], ['ٰ', 260, 'madd2'], ['طَ', 260, 'heavy']] },
        { startMs: 29734, endMs: 32300, letters: [['ٱ', 30, 'silent'], ['لۡ', 130, 'qamari'], ['مُ', 220], ['سۡ', 180], ['تَ', 260], ['قِ', 140, 'heavy'], ['ي', 1380, 'madd4'], ['مَ', 226]] },
      ]
    },
    {
      ayah: 7,
      endMs: 47380,
      words: [
        { startMs: 33594, endMs: 34504, letters: [['صِ', 240, 'heavy'], ['رَ', 120, 'heavy'], ['ٰ', 240, 'madd2'], ['طَ', 310, 'heavy']] },
        { startMs: 34504, endMs: 35394, letters: [['ٱ', 30, 'silent'], ['لَّ', 240], ['ذِ', 160], ['ي', 200, 'madd2'], ['نَ', 260]] },
        { startMs: 35394, endMs: 36354, letters: [['أَ', 120], ['نۡ', 200, 'izhar'], ['عَ', 200], ['مۡ', 180, 'izhar'], ['تَ', 260]] },
        { startMs: 36354, endMs: 37455, letters: [['عَ', 220], ['لَ', 200], ['يۡ', 200], ['هِ', 261], ['مۡ', 220, 'izhar']] },
        { startMs: 37455, endMs: 38195, letters: [['غَ', 240, 'heavy'], ['يۡ', 260], ['رِ', 240]] },
        { startMs: 38195, endMs: 39495, letters: [['ٱ', 30, 'silent'], ['لۡ', 110, 'qamari'], ['مَ', 240], ['غۡ', 180, 'heavy'], ['ضُ', 180, 'heavy'], ['و', 320, 'madd2'], ['بِ', 240]] },
        { startMs: 39495, endMs: 40555, letters: [['عَ', 240], ['لَ', 180], ['يۡ', 200], ['هِ', 240], ['مۡ', 200, 'izhar']] },
        { startMs: 40555, endMs: 40985, letters: [['وَ', 220], ['لَ', 180], ['ا', 30, 'silent']] },
        { startMs: 40985, endMs: 47080, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['ضَّ', 580, 'heavy'], ['اۤ', 2980, 'madd6'], ['لِّ', 500], ['ي', 1781, 'madd4'], ['نَ', 224]] },
      ]
    },
  ]
};
