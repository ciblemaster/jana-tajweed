import type { TajweedSurahSource } from './types';

/**
 * Al-Falaq in a teaching recording: Sheikh Al-Minshawi recites each verse and children repeat it after him
 * (Quran.com recitation 168, "Kids repeat"). The letters are the Hafs text the site stores, without the basmala,
 * which this recording does not recite.
 *
 * Each letter is [text, ms, rule?]; `repeat` holds the children's times for the same letters. The times come from
 * Meta's MMS forced aligner (scripts/tajweed/align.py) and nobody has checked them by ear yet. The rules follow the
 * Quran.com tajweed text for the bounce that ends every verse, the hidden noon of "min sharri", the humming noon,
 * the madd, the silent alef and the sun lam; the moon lam and the heavy letters are added as in Al-Fatihah. The yeh
 * of "fi" is silent because the next word begins with a joining alef.
 */
export const FALAQ_MINSHAWI_KIDS: TajweedSurahSource = {
  surah: 113,
  reciterId: 'qdc.168',
  audioUrl: 'https://download.quranicaudio.com/qdc/siddiq_minshawi/kids_repeat/113.mp3',
  verses: [
    {
      ayah: 1,
      endMs: 3596,
      words: [
        { startMs: 30, endMs: 570, letters: [['قُ', 240, 'heavy'], ['لۡ', 300]] },
        { startMs: 570, endMs: 1490, letters: [['أَ', 180], ['عُ', 160], ['و', 320, 'madd2'], ['ذُ', 260]] },
        { startMs: 1490, endMs: 2471, letters: [['بِ', 261], ['رَ', 230, 'heavy'], ['بِّ', 490]] },
        { startMs: 2471, endMs: 3520, letters: [['ٱ', 30, 'silent'], ['لۡ', 150, 'qamari'], ['فَ', 300], ['لَ', 260], ['قِ', 309, 'qalqalah']] },
      ],
      repeat: {
        endMs: 7211,
        words: [
          { startMs: 3671, endMs: 4191, ms: [220, 300] },
          { startMs: 4191, endMs: 5112, ms: [180, 140, 341, 260] },
          { startMs: 5112, endMs: 6092, ms: [260, 210, 510] },
          { startMs: 6092, endMs: 7070, ms: [30, 170, 280, 260, 238] },
        ]
      }
    },
    {
      ayah: 2,
      endMs: 10617,
      words: [
        { startMs: 7352, endMs: 8433, letters: [['مِ', 360], ['ن', 721, 'ikhfa']] },
        { startMs: 8433, endMs: 9193, letters: [['شَ', 250], ['رِّ', 510]] },
        { startMs: 9193, endMs: 9653, letters: [['مَ', 120], ['ا', 340, 'madd2']] },
        { startMs: 9653, endMs: 10580, letters: [['خَ', 300, 'heavy'], ['لَ', 260], ['قَ', 367, 'qalqalah']] },
      ],
      repeat: {
        endMs: 13832,
        words: [
          { startMs: 10653, endMs: 11714, ms: [781, 280] },
          { startMs: 11714, endMs: 12474, ms: [250, 510] },
          { startMs: 12474, endMs: 12954, ms: [140, 340] },
          { startMs: 12954, endMs: 13750, ms: [280, 240, 276] },
        ]
      }
    },
    {
      ayah: 3,
      endMs: 18893,
      words: [
        { startMs: 13914, endMs: 15115, letters: [['وَ', 220], ['مِ', 401], ['ن', 580, 'ikhfa']] },
        { startMs: 15115, endMs: 15935, letters: [['شَ', 250], ['رِّ', 570]] },
        { startMs: 15935, endMs: 17295, letters: [['غَ', 140, 'heavy'], ['ا', 320, 'madd2'], ['سِ', 300], ['قٍ', 600, 'heavy']] },
        { startMs: 17295, endMs: 17996, letters: [['إِ', 160], ['ذَ', 160], ['ا', 381, 'madd2']] },
        { startMs: 17996, endMs: 18850, letters: [['وَ', 280], ['قَ', 240, 'heavy'], ['بَ', 334, 'qalqalah']] },
      ],
      repeat: {
        endMs: 23929,
        words: [
          { startMs: 18936, endMs: 20156, ms: [220, 460, 540] },
          { startMs: 20156, endMs: 20956, ms: [250, 550] },
          { startMs: 20956, endMs: 22317, ms: [161, 320, 260, 620] },
          { startMs: 22317, endMs: 23017, ms: [180, 140, 380] },
          { startMs: 23017, endMs: 23800, ms: [280, 240, 263] },
        ]
      }
    },
    {
      ayah: 4,
      endMs: 30055,
      words: [
        { startMs: 24057, endMs: 25358, letters: [['وَ', 221], ['مِ', 360], ['ن', 720, 'ikhfa']] },
        { startMs: 25358, endMs: 26088, letters: [['شَ', 230], ['رِّ', 500]] },
        { startMs: 26088, endMs: 28639, letters: [['ٱ', 9, 'silent'], ['ل', 21, 'shamsi'], ['نَّ', 970, 'ghunnah'], ['فَّ', 410], ['ـٰ', 341, 'madd2'], ['ثَ', 180], ['ـٰ', 360, 'madd2'], ['تِ', 260]] },
        { startMs: 28639, endMs: 29039, letters: [['فِ', 370], ['ي', 30, 'silent']] },
        { startMs: 29039, endMs: 29930, letters: [['ٱ', 30, 'silent'], ['لۡ', 110, 'qamari'], ['عُ', 300], ['قَ', 240, 'heavy'], ['دِ', 211, 'qalqalah']] },
      ],
      repeat: {
        endMs: 36161,
        words: [
          { startMs: 30179, endMs: 31480, ms: [220, 761, 320] },
          { startMs: 31480, endMs: 32210, ms: [250, 480] },
          { startMs: 32210, endMs: 34781, ms: [9, 21, 960, 420, 361, 180, 340, 280] },
          { startMs: 34781, endMs: 35161, ms: [350, 30] },
          { startMs: 35161, endMs: 36040, ms: [30, 70, 340, 260, 179] },
        ]
      }
    },
    {
      ayah: 5,
      endMs: 41111,
      words: [
        { startMs: 36281, endMs: 37462, letters: [['وَ', 240], ['مِ', 540], ['ن', 401, 'ikhfa']] },
        { startMs: 37462, endMs: 38242, letters: [['شَ', 250], ['رِّ', 530]] },
        { startMs: 38242, endMs: 39642, letters: [['حَ', 160], ['ا', 360, 'madd2'], ['سِ', 280], ['دٍ', 600]] },
        { startMs: 39642, endMs: 40302, letters: [['إِ', 160], ['ذَ', 140], ['ا', 360, 'madd2']] },
        { startMs: 40302, endMs: 41000, letters: [['حَ', 261], ['سَ', 260], ['دَ', 177, 'qalqalah']] },
      ],
      repeat: {
        endMs: 46174,
        words: [
          { startMs: 41223, endMs: 42403, ms: [240, 640, 300] },
          { startMs: 42403, endMs: 43183, ms: [250, 530] },
          { startMs: 43183, endMs: 44564, ms: [160, 361, 280, 580] },
          { startMs: 44564, endMs: 45224, ms: [180, 140, 340] },
          { startMs: 45224, endMs: 45940, ms: [280, 260, 176] },
        ]
      }
    },
  ]
};
