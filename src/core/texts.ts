import type { TajweedRule } from './tajweed';
import type { L } from './lang';

/** What a child reads about each colour: the rule's name, its Arabic name, and one short line. */
export interface RuleText {
  name: L;
  line: L;
}

export const RULE_TEXT: Record<TajweedRule, RuleText> = {
  madd2: {
    name: { en: 'Natural madd', ar: 'المدّ الطبيعي', id: "Mad thabi'i", ur: 'مدِّ طبعی', bn: 'মাদ্দে তাবায়ি', tr: 'Tabii med', fr: 'Madd naturel', ms: 'Mad asli' },
    line: {
      en: 'Stretch the sound for 2 counts.',
      ar: 'نمدّ الصوت بمقدار حركتين.',
      id: 'Panjangkan suaranya 2 harakat.',
      ur: 'آواز کو دو حرکت کے برابر کھینچیں۔',
      bn: 'আওয়াজ ২ হরকত পর্যন্ত টেনে পড়ো।',
      tr: 'Sesi 2 hareke kadar uzat.',
      fr: 'On allonge le son pendant 2 temps.',
      ms: 'Panjangkan bunyinya 2 harakat.'
    }
  },
  madd4: {
    name: { en: 'Madd before a stop', ar: 'المدّ العارض للسكون', id: "Mad 'aridh lissukun", ur: 'مدِّ عارض', bn: 'মাদ্দে আরিয', tr: 'Med-i ârız', fr: 'Madd avant l’arrêt', ms: "Mad 'aridh lissukun" },
    line: {
      en: 'We stop here, so the sound stretches: 2, 4 or 6 counts. Here the sheikh holds it for 4.',
      ar: 'نقف هنا فنمدّ الصوت حركتين أو أربعًا أو ستًّا، والشيخ هنا يمدّه أربع حركات.',
      id: 'Kita berhenti di sini, jadi suaranya dipanjangkan 2, 4 atau 6 harakat. Di sini syekh membacanya 4 harakat.',
      ur: 'ہم یہاں رکتے ہیں، اس لیے آواز دو، چار یا چھ حرکت تک کھنچتی ہے۔ یہاں شیخ اسے چار حرکت کھینچتے ہیں۔',
      bn: 'আমরা এখানে থামি, তাই আওয়াজ ২, ৪ বা ৬ হরকত টানা যায়। এখানে শায়খ ৪ হরকত টানেন।',
      tr: 'Burada duruyoruz, bu yüzden ses 2, 4 ya da 6 hareke uzar. Şeyh burada 4 hareke uzatıyor.',
      fr: 'On s’arrête ici, alors le son s’allonge : 2, 4 ou 6 temps. Ici, le cheikh le tient 4 temps.',
      ms: 'Kita berhenti di sini, jadi bunyinya dipanjangkan 2, 4 atau 6 harakat. Di sini syeikh membacanya 4 harakat.'
    }
  },
  madd6: {
    name: { en: 'The long madd', ar: 'المدّ اللازم', id: 'Mad lazim', ur: 'مدِّ لازم', bn: 'মাদ্দে লাযিম', tr: 'Med-i lâzım', fr: 'Le long madd', ms: 'Mad lazim' },
    line: {
      en: 'The longest stretch: always 6 counts.',
      ar: 'أطول المدود: نمدّه ستّ حركات دائمًا.',
      id: 'Mad terpanjang: selalu 6 harakat.',
      ur: 'سب سے لمبا مد: ہمیشہ چھ حرکت۔',
      bn: 'সবচেয়ে লম্বা মাদ: সব সময় ৬ হরকত।',
      tr: 'En uzun med: her zaman 6 hareke.',
      fr: 'Le plus long : toujours 6 temps.',
      ms: 'Mad paling panjang: sentiasa 6 harakat.'
    }
  },
  shamsi: {
    name: { en: 'Sun lam', ar: 'اللام الشمسية', id: 'Lam syamsiyah', ur: 'لامِ شمسی', bn: 'লাম শামসি', tr: 'Şemsî lâm', fr: 'Lam solaire', ms: 'Lam syamsiah' },
    line: {
      en: 'This lam is not said. Jump over it and press on the next letter.',
      ar: 'هذه اللام لا تُنطق. نتجاوزها ونشدّد الحرف الذي بعدها.',
      id: 'Lam ini tidak dibaca. Lewati, lalu tekan huruf sesudahnya.',
      ur: 'یہ لام نہیں پڑھا جاتا۔ اسے چھوڑ کر اگلے حرف کو زور سے پڑھیں۔',
      bn: 'এই লাম পড়া হয় না। এটি বাদ দিয়ে পরের হরফে জোর দাও।',
      tr: 'Bu lâm okunmaz. Onu atla ve sonraki harfi şeddeli oku.',
      fr: 'Ce lam ne se prononce pas. On le saute et on appuie sur la lettre suivante.',
      ms: 'Lam ini tidak dibaca. Langkau, kemudian tekan huruf selepasnya.'
    }
  },
  qamari: {
    name: { en: 'Moon lam', ar: 'اللام القمرية', id: 'Lam qamariyah', ur: 'لامِ قمری', bn: 'লাম কামারি', tr: 'Kamerî lâm', fr: 'Lam lunaire', ms: 'Lam qamariah' },
    line: {
      en: 'This lam is said clearly, like the moon you can see at night.',
      ar: 'هذه اللام تُنطق واضحة، كالقمر الذي نراه في الليل.',
      id: 'Lam ini dibaca jelas, seperti bulan yang terlihat di malam hari.',
      ur: 'یہ لام صاف پڑھا جاتا ہے، جیسے رات کو چاند صاف نظر آتا ہے۔',
      bn: 'এই লাম স্পষ্ট করে পড়া হয়, রাতে দেখা চাঁদের মতো।',
      tr: 'Bu lâm açıkça okunur, gece gördüğün ay gibi.',
      fr: 'Ce lam se prononce clairement, comme la lune que l’on voit la nuit.',
      ms: 'Lam ini dibaca jelas, seperti bulan yang kelihatan pada waktu malam.'
    }
  },
  silent: {
    name: { en: 'Silent letter', ar: 'حرف لا يُنطق', id: 'Huruf yang tidak dibaca', ur: 'خاموش حرف', bn: 'নীরব হরফ', tr: 'Okunmayan harf', fr: 'Lettre muette', ms: 'Huruf yang tidak dibaca' },
    line: {
      en: 'It is written, but we do not say it when we join the words.',
      ar: 'حرف مكتوب، لكننا لا ننطقه عند وصل الكلمات.',
      id: 'Huruf ini ditulis, tetapi tidak dibaca ketika kata-katanya disambung.',
      ur: 'یہ لکھا جاتا ہے، مگر لفظوں کو ملا کر پڑھتے وقت نہیں پڑھا جاتا۔',
      bn: 'এটি লেখা থাকে, কিন্তু শব্দ মিলিয়ে পড়ার সময় পড়া হয় না।',
      tr: 'Yazılır ama kelimeler birleşince okunmaz.',
      fr: 'Elle est écrite, mais on ne la prononce pas quand on relie les mots.',
      ms: 'Huruf ini ditulis, tetapi tidak dibaca apabila perkataan disambung.'
    }
  },
  izhar: {
    name: { en: 'Clear letter', ar: 'الإظهار', id: 'Izhar', ur: 'اظہار', bn: 'ইযহার', tr: 'İzhar', fr: 'Lettre claire (izhar)', ms: 'Izhar' },
    line: {
      en: 'Say this letter clearly, with no humming in the nose.',
      ar: 'ننطق هذا الحرف واضحًا من غير غنّة.',
      id: 'Baca huruf ini dengan jelas, tanpa dengung.',
      ur: 'اس حرف کو صاف پڑھیں، ناک میں آواز لے جائے بغیر۔',
      bn: 'এই হরফ স্পষ্ট করে পড়ো, নাকে গুনগুন না করে।',
      tr: 'Bu harfi açıkça oku, genizden ses getirmeden.',
      fr: 'On prononce cette lettre clairement, sans son dans le nez.',
      ms: 'Baca huruf ini dengan jelas, tanpa dengung.'
    }
  },
  heavy: {
    name: { en: 'Heavy letter', ar: 'التفخيم', id: 'Huruf tebal (tafkhim)', ur: 'پُر حرف (تفخیم)', bn: 'মোটা হরফ (তাফখিম)', tr: 'Kalın harf', fr: 'Lettre lourde (tafkhim)', ms: 'Huruf tebal (tafkhim)' },
    line: {
      en: 'A strong letter: say it with a full mouth.',
      ar: 'حرف قويّ: ننطقه مفخّمًا يملأ الفم.',
      id: 'Huruf yang kuat: baca dengan suara tebal memenuhi mulut.',
      ur: 'یہ مضبوط حرف ہے: اسے منہ بھر کر پڑھیں۔',
      bn: 'শক্ত হরফ: মুখ ভরে মোটা করে পড়ো।',
      tr: 'Güçlü bir harf: ağzını doldurarak kalın oku.',
      fr: 'Une lettre forte : on la dit la bouche bien pleine.',
      ms: 'Huruf yang kuat: baca dengan suara tebal memenuhi mulut.'
    }
  },
  ghunnah: {
    name: { en: 'Ghunnah (humming)', ar: 'الغنّة', id: 'Ghunnah (dengung)', ur: 'غنّہ', bn: 'গুন্নাহ', tr: 'Gunne', fr: 'Ghunna (nasalisation)', ms: 'Ghunnah (dengung)' },
    line: {
      en: 'Hum the sound through your nose for 2 counts.',
      ar: 'نُخرج الصوت من الأنف بمقدار حركتين.',
      id: 'Dengungkan suaranya di hidung selama 2 harakat.',
      ur: 'آواز کو ناک میں دو حرکت تک گنگنائیں۔',
      bn: 'আওয়াজ নাকে ২ হরকত গুনগুন করো।',
      tr: 'Sesi genizden 2 hareke kadar getir.',
      fr: 'On fait résonner le son dans le nez pendant 2 temps.',
      ms: 'Dengungkan bunyinya di hidung selama 2 harakat.'
    }
  },
  ikhfa: {
    name: { en: 'Ikhfa (hidden sound)', ar: 'الإخفاء', id: 'Ikhfa', ur: 'اخفاء', bn: 'ইখফা', tr: 'İhfa', fr: 'Ikhfa (son caché)', ms: 'Ikhfa' },
    line: {
      en: 'Hide the noon or the meem: hum softly for 2 counts, ready for the next letter.',
      ar: 'نُخفي النون أو الميم مع غنّة بمقدار حركتين، ونتهيّأ للحرف الذي بعدها.',
      id: 'Samarkan nun atau mim: dengung lembut 2 harakat, bersiap ke huruf berikutnya.',
      ur: 'نون یا میم کو چھپائیں: دو حرکت ہلکا غنّہ کریں اور اگلے حرف کے لیے تیار رہیں۔',
      bn: 'নুন বা মিম লুকিয়ে পড়ো: ২ হরকত হালকা গুন্নাহ করো, পরের হরফের জন্য তৈরি থাকো।',
      tr: 'Nunu ya da mimi gizle: 2 hareke hafifçe genizden oku, sonraki harfe hazırlan.',
      fr: 'On cache le noun ou le mim : un léger son dans le nez pendant 2 temps, prêt pour la lettre suivante.',
      ms: 'Samarkan nun atau mim: dengung lembut 2 harakat, bersedia untuk huruf seterusnya.'
    }
  },
  madd5: {
    name: { en: 'Madd before a hamza', ar: 'المدّ المتصل والمنفصل', id: 'Mad wajib dan jaiz', ur: 'مدِّ متصل و منفصل', bn: 'হামযার আগের মাদ', tr: 'Hemzeli med', fr: 'Madd avant une hamza', ms: 'Mad wajib dan jaiz' },
    line: {
      en: 'A hamza comes after the long vowel, so stretch it for 4 or 5 counts.',
      ar: 'بعد حرف المدّ همزة، فنمدّه أربع أو خمس حركات.',
      id: 'Ada hamzah setelah huruf mad, jadi panjangkan 4 atau 5 harakat.',
      ur: 'حرفِ مد کے بعد ہمزہ ہے، اس لیے چار یا پانچ حرکت کھینچیں۔',
      bn: 'মাদের হরফের পরে হামযা আছে, তাই ৪ বা ৫ হরকত টানো।',
      tr: 'Uzun sesten sonra hemze geliyor; 4 ya da 5 hareke uzat.',
      fr: 'Une hamza suit la voyelle longue : on l’allonge pendant 4 ou 5 temps.',
      ms: 'Ada hamzah selepas huruf mad, jadi panjangkan 4 atau 5 harakat.'
    }
  },
  idghamg: {
    name: { en: 'Idgham with humming', ar: 'الإدغام بغنّة', id: 'Idgham bighunnah', ur: 'ادغام مع الغنّہ', bn: 'ইদগাম (গুন্নাহসহ)', tr: 'İdğam-ı maal-ğunne', fr: 'Idgham avec nasalisation', ms: 'Idgham bighunnah' },
    line: {
      en: 'The letter melts into the next one, with a hum for 2 counts.',
      ar: 'ندغم الحرف في الذي بعده مع غنّة بمقدار حركتين.',
      id: 'Hurufnya melebur ke huruf berikutnya, dengan dengung 2 harakat.',
      ur: 'حرف اگلے حرف میں مل جاتا ہے، دو حرکت غنّہ کے ساتھ۔',
      bn: 'হরফটি পরের হরফে মিশে যায়, ২ হরকত গুন্নাহসহ।',
      tr: 'Harf sonrakine katılır, 2 hareke genizden sesle.',
      fr: 'La lettre se fond dans la suivante, avec un son dans le nez pendant 2 temps.',
      ms: 'Hurufnya melebur ke dalam huruf seterusnya, dengan dengung 2 harakat.'
    }
  },
  idgham: {
    name: { en: 'Idgham without humming', ar: 'الإدغام بغير غنّة', id: 'Idgham bilaghunnah', ur: 'ادغام بلا غنّہ', bn: 'ইদগাম (গুন্নাহ ছাড়া)', tr: 'İdğam-ı bilâ-ğunne', fr: 'Idgham sans nasalisation', ms: 'Idgham bilaghunnah' },
    line: {
      en: 'The letter melts into the next one and is not heard.',
      ar: 'ندغم الحرف في الذي بعده فلا يُسمع.',
      id: 'Hurufnya melebur ke huruf berikutnya dan tidak terdengar.',
      ur: 'حرف اگلے حرف میں مل جاتا ہے اور سنائی نہیں دیتا۔',
      bn: 'হরফটি পরের হরফে মিশে যায়, শোনা যায় না।',
      tr: 'Harf sonrakine katılır ve duyulmaz.',
      fr: 'La lettre se fond dans la suivante et ne s’entend pas.',
      ms: 'Hurufnya melebur ke dalam huruf seterusnya dan tidak kedengaran.'
    }
  },
  iqlab: {
    name: { en: 'Iqlab (noon becomes meem)', ar: 'الإقلاب', id: 'Iqlab', ur: 'اقلاب', bn: 'ইকলাব', tr: 'İklab', fr: 'Iqlab (noun devient mim)', ms: 'Iqlab' },
    line: {
      en: 'Before a ba, the noon turns into a meem with a hum.',
      ar: 'قبل الباء تُقلب النون ميمًا مع غنّة.',
      id: 'Sebelum ba, nun berubah menjadi mim dengan dengung.',
      ur: 'باء سے پہلے نون میم بن جاتا ہے، غنّہ کے ساتھ۔',
      bn: 'বা-এর আগে নুন গুন্নাহসহ মিম হয়ে যায়।',
      tr: 'Be’den önce nun, genizden sesle mime döner.',
      fr: 'Devant un ba, le noun devient un mim, avec un son dans le nez.',
      ms: 'Sebelum ba, nun bertukar menjadi mim dengan dengung.'
    }
  },
  qalqalah: {
    name: { en: 'Qalqalah (bounce)', ar: 'القلقلة', id: 'Qalqalah', ur: 'قلقلہ', bn: 'কলকলা', tr: 'Kalkale', fr: 'Qalqala (rebond)', ms: 'Qalqalah' },
    line: {
      en: 'The letter stops, so let its sound bounce a little.',
      ar: 'حرف ساكن نُسمِع له نبرة خفيفة عند النطق به.',
      id: 'Hurufnya berhenti, jadi pantulkan sedikit suaranya.',
      ur: 'حرف ساکن ہے، اس کی آواز کو ہلکا سا اچھالیں۔',
      bn: 'হরফটি থামে, তাই এর আওয়াজ একটু ধাক্কা দিয়ে পড়ো।',
      tr: 'Harf durur; sesini hafifçe sektir.',
      fr: 'La lettre s’arrête : on fait rebondir légèrement son son.',
      ms: 'Hurufnya berhenti, jadi lantunkan sedikit bunyinya.'
    }
  }
};

/** Who recites: the teaching recording of the game, and the first trial on Al-Fatihah. */
export const RECITER_TEXT = {
  minshawi: {
    en: 'Sheikh Al-Minshawi, with children',
    ar: 'الشيخ محمد صديق المنشاوي مع ترديد الأطفال',
    id: 'Syekh Al-Minshawi, bersama anak-anak',
    ur: 'شیخ المنشاوی، بچوں کے ساتھ',
    bn: 'শায়খ আল-মিনশাবি, শিশুদের সাথে',
    tr: 'Şeyh el-Minşâvî, çocuklarla',
    fr: 'Cheikh Al-Minshawi, avec des enfants',
    ms: 'Syeikh Al-Minshawi, bersama kanak-kanak'
  },
  husary: { en: 'Sheikh Al-Husary', ar: 'الشيخ محمود خليل الحصري', id: 'Syekh Al-Husary', ur: 'شیخ الحصری', bn: 'শায়খ আল-হুসারি', tr: 'Şeyh el-Husarî', fr: 'Cheikh Al-Husary', ms: 'Syeikh Al-Husary' }
} satisfies Record<string, L>;

/** The awards of the game: a name and what earns it. */
export const AWARD_TEXT: Record<string, { name: L; how: L }> = {
  first: { name: { en: 'First steps', ar: 'الخطوة الأولى', fr: 'Premiers pas' }, how: { en: 'Finish your first surah.', ar: 'أكمل أول سورة.', fr: 'Termine ta première sourate.' } },
  quls: { name: { en: 'The three shields', ar: 'المعوّذات', fr: 'Les trois protectrices' }, how: { en: 'Finish Al-Ikhlas, Al-Falaq and An-Nas.', ar: 'أكمل الإخلاص والفلق والناس.', fr: 'Termine Al-Ikhlas, Al-Falaq et An-Nas.' } },
  five: { name: { en: 'Five surahs', ar: 'خمس سور', fr: 'Cinq sourates' }, how: { en: 'Finish five surahs.', ar: 'أكمل خمس سور.', fr: 'Termine cinq sourates.' } },
  ten: { name: { en: 'Ten surahs', ar: 'عشر سور', fr: 'Dix sourates' }, how: { en: 'Finish ten surahs.', ar: 'أكمل عشر سور.', fr: 'Termine dix sourates.' } },
  reciter: { name: { en: 'Little reciter', ar: 'القارئ الصغير', fr: 'Petit récitateur' }, how: { en: 'Take every turn in three surahs.', ar: 'اقرأ في كل دور في ثلاث سور.', fr: 'Récite à chaque tour dans trois sourates.' } },
  memory: { name: { en: 'By heart', ar: 'عن ظهر قلب', fr: 'Par cœur' }, how: { en: 'Memorise your first surah.', ar: 'احفظ أول سورة.', fr: 'Mémorise ta première sourate.' } },
  memory5: { name: { en: 'Five by heart', ar: 'خمس سور محفوظة', fr: 'Cinq par cœur' }, how: { en: 'Memorise five surahs.', ar: 'احفظ خمس سور.', fr: 'Mémorise cinq sourates.' } },
  gold: { name: { en: 'Three stars', ar: 'ثلاث نجوم', fr: 'Trois étoiles' }, how: { en: 'Win all three stars of one surah.', ar: 'اجمع النجوم الثلاث في سورة.', fr: 'Gagne les trois étoiles d’une sourate.' } },
  days3: { name: { en: 'Three days in a row', ar: 'ثلاثة أيام متتالية', fr: 'Trois jours de suite' }, how: { en: 'Play three days in a row.', ar: 'العب ثلاثة أيام متتالية.', fr: 'Joue trois jours de suite.' } },
  all: { name: { en: 'Juz Amma', ar: 'جزء عمّ', fr: 'Juz Amma' }, how: { en: 'Finish every surah on the path.', ar: 'أكمل كل سور الطريق.', fr: 'Termine toutes les sourates du chemin.' } }
};

/** The words of the page itself. */
export const TAJWEED_TEXT = {
  title: { en: 'Jana Tajweed', ar: 'جنى التجويد', id: 'Jana Tajweed', ur: 'جنیٰ تجوید', bn: 'জানা তাজবিদ', tr: 'Jana Tecvid', fr: 'Jana Tajweed', ms: 'Jana Tajwid' },
  experiment: { en: 'Experiment', ar: 'تجربة', id: 'Percobaan', ur: 'تجربہ', bn: 'পরীক্ষামূলক', tr: 'Deneme', fr: 'Expérience', ms: 'Percubaan' },
  hint: {
    en: 'Press play. Each letter lights up when the sheikh says it.',
    ar: 'اضغط زر التشغيل، وسيضيء كل حرف حين ينطقه الشيخ.',
    id: 'Tekan putar. Setiap huruf menyala saat syekh membacanya.',
    ur: 'چلائیں دبائیں۔ جب شیخ پڑھتے ہیں تو ہر حرف روشن ہوتا ہے۔',
    bn: 'প্লে চাপো। শায়খ পড়লে প্রতিটি হরফ জ্বলে ওঠে।',
    tr: 'Oynat’a bas. Şeyh okudukça her harf yanar.',
    fr: 'Appuie sur lecture. Chaque lettre s’allume quand le cheikh la prononce.',
    ms: 'Tekan main. Setiap huruf menyala apabila syeikh membacanya.'
  },
  tapHint: {
    en: 'Tap a coloured word to see its rule.',
    ar: 'المس كلمة ملوّنة لترى حكمها.',
    id: 'Ketuk kata berwarna untuk melihat hukumnya.',
    ur: 'رنگین لفظ کو چھو کر اس کا قاعدہ دیکھیں۔',
    bn: 'রঙিন শব্দে টোকা দিয়ে তার নিয়ম দেখো।',
    tr: 'Kuralını görmek için renkli bir kelimeye dokun.',
    fr: 'Touche un mot coloré pour voir sa règle.',
    ms: 'Ketik perkataan berwarna untuk melihat hukumnya.'
  },
  play: { en: 'Play', ar: 'تشغيل', id: 'Putar', ur: 'چلائیں', bn: 'চালাও', tr: 'Oynat', fr: 'Lecture', ms: 'Main' },
  pause: { en: 'Pause', ar: 'إيقاف مؤقت', id: 'Jeda', ur: 'روکیں', bn: 'থামাও', tr: 'Duraklat', fr: 'Pause', ms: 'Jeda' },
  again: { en: 'Again', ar: 'إعادة', id: 'Ulangi', ur: 'دوبارہ', bn: 'আবার', tr: 'Tekrar', fr: 'Encore', ms: 'Ulang' },
  prev: { en: 'Previous verse', ar: 'الآية السابقة', id: 'Ayat sebelumnya', ur: 'پچھلی آیت', bn: 'আগের আয়াত', tr: 'Önceki ayet', fr: 'Verset précédent', ms: 'Ayat sebelumnya' },
  next: { en: 'Next verse', ar: 'الآية التالية', id: 'Ayat berikutnya', ur: 'اگلی آیت', bn: 'পরের আয়াত', tr: 'Sonraki ayet', fr: 'Verset suivant', ms: 'Ayat seterusnya' },
  slow: { en: 'Slow', ar: 'ببطء', id: 'Pelan', ur: 'آہستہ', bn: 'ধীরে', tr: 'Yavaş', fr: 'Lent', ms: 'Perlahan' },
  stops: { en: 'Stop at each colour', ar: 'توقّف عند كل لون', id: 'Berhenti di setiap warna', ur: 'ہر رنگ پر رکیں', bn: 'প্রতিটি রঙে থামো', tr: 'Her renkte dur', fr: 'S’arrêter à chaque couleur', ms: 'Berhenti pada setiap warna' },
  map: { en: 'My path', ar: 'طريقي', id: 'Jalanku', ur: 'میرا راستہ', bn: 'আমার পথ', tr: 'Yolum', fr: 'Mon chemin', ms: 'Laluan saya' },
  backToMap: { en: 'Back to the path', ar: 'العودة إلى الطريق', id: 'Kembali ke jalan', ur: 'راستے پر واپس', bn: 'পথে ফিরে যাও', tr: 'Yola dön', fr: 'Retour au chemin', ms: 'Kembali ke laluan' },
  learn: { en: 'Learn', ar: 'تعلّم', id: 'Belajar', ur: 'سیکھیں', bn: 'শেখো', tr: 'Öğren', fr: 'Apprendre', ms: 'Belajar' },
  memorise: { en: 'Memorise', ar: 'احفظ', id: 'Hafalkan', ur: 'حفظ کریں', bn: 'মুখস্থ করো', tr: 'Ezberle', fr: 'Mémoriser', ms: 'Hafal' },
  versesCount: { en: '{n} verses', ar: '{n} آيات', id: '{n} ayat', ur: '{n} آیات', bn: '{n} আয়াত', tr: '{n} ayet', fr: '{n} versets', ms: '{n} ayat' },
  lockedHint: { en: 'Finish {name} to open this surah.', ar: 'أكمل {name} لتفتح هذه السورة.', id: 'Selesaikan {name} untuk membuka surah ini.', ur: 'یہ سورت کھولنے کے لیے {name} مکمل کریں۔', bn: 'এই সূরা খুলতে {name} শেষ করো।', tr: 'Bu sureyi açmak için {name} suresini bitir.', fr: 'Termine {name} pour ouvrir cette sourate.', ms: 'Selesaikan {name} untuk membuka surah ini.' },
  memoriseLocked: { en: 'Learn it first, then memorise it.', ar: 'تعلّمها أولًا ثم احفظها.', id: 'Pelajari dulu, lalu hafalkan.', ur: 'پہلے سیکھیں، پھر حفظ کریں۔', bn: 'আগে শেখো, তারপর মুখস্থ করো।', tr: 'Önce öğren, sonra ezberle.', fr: 'Apprends-la d’abord, puis mémorise-la.', ms: 'Belajar dahulu, kemudian hafal.' },
  starListen: { en: 'Follow the sheikh to the end', ar: 'تابع الشيخ إلى النهاية', id: 'Ikuti syekh sampai selesai', ur: 'شیخ کے ساتھ آخر تک چلیں', bn: 'শায়খের সাথে শেষ পর্যন্ত যাও', tr: 'Şeyhi sonuna kadar takip et', fr: 'Suis le cheikh jusqu’au bout', ms: 'Ikut syeikh hingga tamat' },
  starRecite: { en: 'Recite every verse on your turn', ar: 'اقرأ كل آية في دورك', id: 'Baca setiap ayat saat giliranmu', ur: 'اپنی باری پر ہر آیت پڑھیں', bn: 'তোমার পালায় প্রতিটি আয়াত পড়ো', tr: 'Sıran gelince her ayeti oku', fr: 'Récite chaque verset à ton tour', ms: 'Baca setiap ayat pada giliran kamu' },
  starMemorise: { en: 'Recite every verse from memory', ar: 'اقرأ كل آية من حفظك', id: 'Baca setiap ayat dari hafalan', ur: 'ہر آیت زبانی پڑھیں', bn: 'প্রতিটি আয়াত মুখস্থ পড়ো', tr: 'Her ayeti ezberden oku', fr: 'Récite chaque verset de mémoire', ms: 'Baca setiap ayat daripada hafalan' },
  stars: { en: 'Stars', ar: 'النجوم', id: 'Bintang', ur: 'ستارے', bn: 'তারা', tr: 'Yıldızlar', fr: 'Étoiles', ms: 'Bintang' },
  awards: { en: 'My awards', ar: 'جوائزي', id: 'Penghargaanku', ur: 'میرے انعامات', bn: 'আমার পুরস্কার', tr: 'Ödüllerim', fr: 'Mes récompenses', ms: 'Anugerah saya' },
  newAward: { en: 'New award!', ar: 'جائزة جديدة!', id: 'Penghargaan baru!', ur: 'نیا انعام!', bn: 'নতুন পুরস্কার!', tr: 'Yeni ödül!', fr: 'Nouvelle récompense !', ms: 'Anugerah baharu!' },
  daysInRow: { en: 'Days in a row', ar: 'أيام متتالية', id: 'Hari berturut-turut', ur: 'مسلسل دن', bn: 'টানা দিন', tr: 'Üst üste gün', fr: 'Jours de suite', ms: 'Hari berturut-turut' },
  nextSurah: { en: 'Next surah', ar: 'السورة التالية', id: 'Surah berikutnya', ur: 'اگلی سورت', bn: 'পরের সূরা', tr: 'Sonraki sure', fr: 'Sourate suivante', ms: 'Surah seterusnya' },
  coverHint: { en: 'Recite it from memory.', ar: 'اقرأها من حفظك.', id: 'Bacalah dari hafalanmu.', ur: 'زبانی پڑھیں۔', bn: 'মুখস্থ থেকে পড়ো।', tr: 'Ezberden oku.', fr: 'Récite-le de mémoire.', ms: 'Baca daripada hafalan.' },
  peek: { en: 'Show me', ar: 'أرِني', id: 'Tunjukkan', ur: 'دکھائیں', bn: 'দেখাও', tr: 'Göster', fr: 'Montre-moi', ms: 'Tunjukkan' },
  didYou: { en: 'Did you get it right?', ar: 'هل قرأتها صحيحة؟', id: 'Apakah bacaanmu benar?', ur: 'کیا آپ نے صحیح پڑھا؟', bn: 'তুমি কি ঠিক পড়েছ?', tr: 'Doğru okudun mu?', fr: 'Tu l’as bien récité ?', ms: 'Adakah bacaan kamu betul?' },
  yes: { en: 'Yes!', ar: 'نعم!', id: 'Ya!', ur: 'جی ہاں!', bn: 'হ্যাঁ!', tr: 'Evet!', fr: 'Oui !', ms: 'Ya!' },
  notYet: { en: 'Not yet', ar: 'ليس بعد', id: 'Belum', ur: 'ابھی نہیں', bn: 'এখনও না', tr: 'Henüz değil', fr: 'Pas encore', ms: 'Belum' },
  unlockAll: { en: 'Open every surah (for testing)', ar: 'افتح كل السور (للتجربة)', fr: 'Ouvrir toutes les sourates (test)' },
  surahs: { en: 'Surahs', ar: 'السور', id: 'Surah', ur: 'سورتیں', bn: 'সূরা', tr: 'Sureler', fr: 'Sourates', ms: 'Surah' },
  sheikh: { en: 'The sheikh', ar: 'الشيخ', id: 'Syekh', ur: 'شیخ', bn: 'শায়খ', tr: 'Şeyh', fr: 'Le cheikh', ms: 'Syeikh' },
  children: { en: 'The children', ar: 'الأطفال', id: 'Anak-anak', ur: 'بچے', bn: 'শিশুরা', tr: 'Çocuklar', fr: 'Les enfants', ms: 'Kanak-kanak' },
  yourTurn: { en: 'Your turn', ar: 'دورك', id: 'Giliranmu', ur: 'آپ کی باری', bn: 'তোমার পালা', tr: 'Sıra sende', fr: 'À toi', ms: 'Giliran kamu' },
  yourTurnHint: {
    en: 'Recite the verse on your own.',
    ar: 'اقرأ الآية وحدك.',
    id: 'Bacalah ayat ini sendiri.',
    ur: 'آیت اکیلے پڑھیں۔',
    bn: 'আয়াতটি একা পড়ো।',
    tr: 'Ayeti tek başına oku.',
    fr: 'Récite le verset tout seul.',
    ms: 'Bacalah ayat ini sendiri.'
  },
  myTurn: {
    en: 'My turn after each verse',
    ar: 'دوري بعد كل آية',
    id: 'Giliranku setelah tiap ayat',
    ur: 'ہر آیت کے بعد میری باری',
    bn: 'প্রতি আয়াতের পর আমার পালা',
    tr: 'Her ayetten sonra sıra bende',
    fr: 'Mon tour après chaque verset',
    ms: 'Giliran saya selepas setiap ayat'
  },
  timing: { en: 'Letter timing', ar: 'توقيت الحروف', fr: 'Synchronisation des lettres' },
  timingHand: { en: 'By hand', ar: 'يدوي', fr: 'À la main' },
  timingMachine: { en: 'By the aligner', ar: 'بالمحاذي الآلي', fr: 'Par l’aligneur' },
  key: { en: 'The colours', ar: 'الألوان', id: 'Warna-warna', ur: 'رنگ', bn: 'রঙগুলো', tr: 'Renkler', fr: 'Les couleurs', ms: 'Warna-warna' },
  listen: { en: 'Listen', ar: 'استمع', id: 'Dengarkan', ur: 'سنیں', bn: 'শোনো', tr: 'Dinle', fr: 'Écouter', ms: 'Dengar' },
  carryOn: { en: 'Carry on', ar: 'تابع', id: 'Lanjut', ur: 'آگے چلیں', bn: 'এগিয়ে চলো', tr: 'Devam et', fr: 'Continuer', ms: 'Teruskan' },
  close: { en: 'Close', ar: 'إغلاق', id: 'Tutup', ur: 'بند کریں', bn: 'বন্ধ করো', tr: 'Kapat', fr: 'Fermer', ms: 'Tutup' },
  verse: { en: 'Verse {n}', ar: 'الآية {n}', id: 'Ayat {n}', ur: 'آیت {n}', bn: 'আয়াত {n}', tr: '{n}. ayet', fr: 'Verset {n}', ms: 'Ayat {n}' },
  verses: { en: 'Verses', ar: 'الآيات', id: 'Ayat', ur: 'آیات', bn: 'আয়াত', tr: 'Ayetler', fr: 'Versets', ms: 'Ayat' },
  inWord: { en: 'In this word', ar: 'في هذه الكلمة', id: 'Dalam kata ini', ur: 'اس لفظ میں', bn: 'এই শব্দে', tr: 'Bu kelimede', fr: 'Dans ce mot', ms: 'Dalam perkataan ini' },
  doneTitle: { en: 'Masha’Allah!', ar: 'ما شاء الله!', id: 'Masya Allah!', ur: 'ماشاء اللہ!', bn: 'মাশাআল্লাহ!', tr: 'Maşallah!', fr: 'Macha’Allah !', ms: 'Masya-Allah!' },
  doneText: {
    en: 'You followed every letter of the surah.',
    ar: 'تابعتَ كل حروف السورة.',
    id: 'Kamu telah mengikuti semua huruf surah ini.',
    ur: 'آپ نے سورت کے تمام حروف کے ساتھ پڑھا۔',
    bn: 'তুমি সূরার সব হরফ অনুসরণ করেছ।',
    tr: 'Surenin bütün harflerini takip ettin.',
    fr: 'Tu as suivi toutes les lettres de la sourate.',
    ms: 'Kamu telah mengikuti semua huruf surah ini.'
  },
  startAgain: { en: 'Start again', ar: 'ابدأ من جديد', id: 'Mulai lagi', ur: 'دوبارہ شروع کریں', bn: 'আবার শুরু করো', tr: 'Baştan başla', fr: 'Recommencer', ms: 'Mula semula' },
  loadError: {
    en: 'The recitation did not load. Check the connection and try again.',
    ar: 'لم يُحمَّل التسجيل. تحقّق من الاتصال وحاول مرة أخرى.',
    id: 'Bacaan tidak termuat. Periksa koneksi lalu coba lagi.',
    ur: 'تلاوت لوڈ نہیں ہوئی۔ کنکشن دیکھ کر دوبارہ کوشش کریں۔',
    bn: 'তিলাওয়াত লোড হয়নি। সংযোগ দেখে আবার চেষ্টা করো।',
    tr: 'Kıraat yüklenmedi. Bağlantıyı kontrol edip tekrar dene.',
    fr: 'La récitation ne s’est pas chargée. Vérifie la connexion et réessaie.',
    ms: 'Bacaan tidak dimuatkan. Semak sambungan dan cuba lagi.'
  },
  retry: { en: 'Try again', ar: 'حاول مرة أخرى', id: 'Coba lagi', ur: 'دوبارہ کوشش کریں', bn: 'আবার চেষ্টা করো', tr: 'Tekrar dene', fr: 'Réessayer', ms: 'Cuba lagi' },
  back: { en: 'Back to the site', ar: 'العودة إلى الموقع', id: 'Kembali ke situs', ur: 'سائٹ پر واپس', bn: 'সাইটে ফিরে যাও', tr: 'Siteye dön', fr: 'Retour au site', ms: 'Kembali ke laman' }
} satisfies Record<string, L>;
