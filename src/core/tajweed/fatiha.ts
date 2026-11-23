import type { TajweedSurahSource } from './types';

/**
 * Al-Fatihah letter by letter, in the Hafs text the site stores (King Fahd Complex), with the tajweed rule each
 * letter carries and how long Sheikh Al-Husary holds it in his murattal recording (Quran.com recitation 6).
 *
 * Each letter is [text, ms, rule?]. A word's start and end are measured on the recording; the ms of its letters are
 * their share of that span, read off the spectrogram for the long vowels. The rules follow the Quran.com tajweed
 * text for the madd, the silent alef and the sun lam, and add the moon lam, the clear noon and meem, and the heavy
 * letters. Al-Fatihah has no ghunnah, ikhfa, idgham, iqlab or qalqalah.
 */
export const FATIHA_HUSARY: TajweedSurahSource = {
  surah: 1,
  reciterId: 'ar.husary',
  audioUrl: 'https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/1.mp3',
  verses: [
  {
    ayah: 1,
    endMs: 5200,
    words: [
      { startMs: 80, endMs: 500, letters: [['بِ', 130], ['سۡ', 130], ['مِ', 150]] },
      { startMs: 500, endMs: 1250, letters: [['ٱ', 30, 'silent'], ['ل', 120], ['لَّ', 450, 'madd2'], ['هِ', 180]] },
      { startMs: 1250, endMs: 2450, letters: [['ٱ', 30, 'silent'], ['ل', 30, 'shamsi'], ['رَّ', 400, 'heavy'], ['حۡ', 170], ['مَ', 230], ['ـٰ', 250, 'madd2'], ['نِ', 150]] },
      { startMs: 2450, endMs: 4550, letters: [['ٱ', 30, 'silent'], ['ل', 30, 'shamsi'], ['رَّ', 300, 'heavy'], ['حِ', 150], ['ي', 1450, 'madd4'], ['مِ', 200]] },
    ]
  },
  {
    ayah: 2,
    endMs: 11200,
    words: [
      { startMs: 5860, endMs: 6750, letters: [['ٱ', 150], ['لۡ', 100, 'qamari'], ['حَ', 200], ['مۡ', 250, 'izhar'], ['دُ', 200]] },
      { startMs: 6750, endMs: 7450, letters: [['لِ', 100], ['لَّ', 470, 'madd2'], ['هِ', 130]] },
      { startMs: 7450, endMs: 8150, letters: [['رَ', 280, 'heavy'], ['بِّ', 420]] },
      { startMs: 8150, endMs: 10600, letters: [['ٱ', 20, 'silent'], ['لۡ', 100, 'qamari'], ['عَ', 250], ['ـٰ', 300, 'madd2'], ['لَ', 150], ['مِ', 100], ['ي', 1350, 'madd4'], ['نَ', 200]] },
    ]
  },
  {
    ayah: 3,
    endMs: 15700,
    words: [
      { startMs: 11700, endMs: 13050, letters: [['ٱ', 120], ['ل', 20, 'shamsi'], ['رَّ', 410, 'heavy'], ['حۡ', 150], ['مَ', 270], ['ـٰ', 250, 'madd2'], ['نِ', 150]] },
      { startMs: 13050, endMs: 15150, letters: [['ٱ', 20, 'silent'], ['ل', 20, 'shamsi'], ['رَّ', 400, 'heavy'], ['حِ', 120], ['ي', 1380, 'madd4'], ['مِ', 200]] },
    ]
  },
  {
    ayah: 4,
    endMs: 20500,
    words: [
      { startMs: 16270, endMs: 17050, letters: [['مَ', 230], ['ـٰ', 220, 'madd2'], ['لِ', 180], ['كِ', 150]] },
      { startMs: 17050, endMs: 17650, letters: [['يَ', 250], ['وۡ', 150], ['مِ', 200]] },
      { startMs: 17650, endMs: 19850, letters: [['ٱ', 20, 'silent'], ['ل', 20, 'shamsi'], ['دِّ', 200], ['ي', 1800, 'madd4'], ['نِ', 200]] },
    ]
  },
  {
    ayah: 5,
    endMs: 27400,
    words: [
      { startMs: 21150, endMs: 22100, letters: [['إِ', 100], ['يَّ', 430], ['ا', 250, 'madd2'], ['كَ', 170]] },
      { startMs: 22100, endMs: 22900, letters: [['نَ', 150], ['عۡ', 250], ['بُ', 200], ['دُ', 180]] },
      { startMs: 22900, endMs: 24300, letters: [['وَ', 200], ['إِ', 200], ['يَّ', 580], ['ا', 250, 'madd2'], ['كَ', 170]] },
      { startMs: 24300, endMs: 26900, letters: [['نَ', 250], ['سۡ', 250], ['تَ', 130], ['عِ', 200], ['ي', 1600, 'madd4'], ['نُ', 200]] },
    ]
  },
  {
    ayah: 6,
    endMs: 33000,
    words: [
      { startMs: 28050, endMs: 28700, letters: [['ٱ', 150], ['هۡ', 150], ['دِ', 150], ['نَ', 150], ['ا', 30, 'silent']] },
      { startMs: 28700, endMs: 29750, letters: [['ٱ', 20, 'silent'], ['ل', 20, 'shamsi'], ['صِّ', 400, 'heavy'], ['رَ', 100, 'heavy'], ['ٰ', 300, 'madd2'], ['طَ', 250, 'heavy']] },
      { startMs: 29750, endMs: 32350, letters: [['ٱ', 20, 'silent'], ['لۡ', 100, 'qamari'], ['مُ', 250], ['سۡ', 280], ['تَ', 150], ['قِ', 150, 'heavy'], ['ي', 1470, 'madd4'], ['مَ', 180]] },
    ]
  },
  {
    ayah: 7,
    endMs: 48100,
    words: [
      { startMs: 33570, endMs: 34450, letters: [['صِ', 200, 'heavy'], ['رَ', 80, 'heavy'], ['ٰ', 400, 'madd2'], ['طَ', 200, 'heavy']] },
      { startMs: 34450, endMs: 35400, letters: [['ٱ', 20, 'silent'], ['لَّ', 380], ['ذِ', 100], ['ي', 300, 'madd2'], ['نَ', 150]] },
      { startMs: 35400, endMs: 36230, letters: [['أَ', 130], ['نۡ', 170, 'izhar'], ['عَ', 300], ['مۡ', 180, 'izhar'], ['تَ', 120]] },
      { startMs: 36230, endMs: 37400, letters: [['عَ', 250], ['لَ', 130], ['يۡ', 280], ['هِ', 150], ['مۡ', 180, 'izhar']] },
      { startMs: 37400, endMs: 38170, letters: [['غَ', 250, 'heavy'], ['يۡ', 200], ['رِ', 300]] },
      { startMs: 38170, endMs: 39480, letters: [['ٱ', 20, 'silent'], ['لۡ', 120, 'qamari'], ['مَ', 300], ['غۡ', 150, 'heavy'], ['ضُ', 250, 'heavy'], ['و', 350, 'madd2'], ['بِ', 150]] },
      { startMs: 39480, endMs: 40750, letters: [['عَ', 230], ['لَ', 150], ['يۡ', 250], ['هِ', 300], ['مۡ', 300, 'izhar']] },
      { startMs: 40750, endMs: 41000, letters: [['وَ', 130], ['لَ', 110], ['ا', 10, 'silent']] },
      { startMs: 41000, endMs: 47200, letters: [['ٱ', 10, 'silent'], ['ل', 10, 'shamsi'], ['ضَّ', 600, 'heavy'], ['اۤ', 2800, 'madd6'], ['لِّ', 750], ['ي', 1800, 'madd4'], ['نَ', 250]] },
    ]
  },
  ]
};
