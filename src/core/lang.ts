import { useSyncExternalStore } from 'react';

/** The languages the app speaks. English and Arabic are complete everywhere; the others may fall back to English. */
export const LANGS = ['en', 'ar', 'fr', 'id', 'ur', 'bn', 'tr', 'ms'] as const;
export type Lang = (typeof LANGS)[number];

/** Each language's own name, the way its speakers look for it. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English', ar: 'العربية', fr: 'Français', id: 'Bahasa Indonesia', ur: 'اردو', bn: 'বাংলা', tr: 'Türkçe', ms: 'Bahasa Melayu'
};

/** Page text: always English and Arabic, other languages where translated. */
export type L = { en: string; ar: string } & Partial<Record<Lang, string>>;

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function langDir(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr';
}

const KEY = 'jana-tajweed-lang';

/** ?lang= first, then the last choice on this device, then the browser's language, then English. */
function initialLang(): Lang {
  const asked = new URLSearchParams(window.location.search).get('lang');
  if (isLang(asked)) return asked;
  try {
    const kept = localStorage.getItem(KEY);
    if (isLang(kept)) return kept;
  } catch {
    // Storage refused: fall through.
  }
  const browser = navigator.language?.slice(0, 2);
  return isLang(browser) ? browser : 'en';
}

let current: Lang = initialLang();
const listeners = new Set<() => void>();

function apply(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = langDir(lang);
}
apply(current);

export function setLang(lang: Lang) {
  current = lang;
  apply(lang);
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // Remembered for this visit only.
  }
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
}

/** The text in `lang`, or in English where it is not translated yet. */
export function textIn(text: L, lang: Lang): string {
  return text[lang] ?? text.en;
}

/** Picks an entry's text in the page's language, or its English. */
export function useText(): (text: L) => string {
  const lang = useLang();
  return (text) => textIn(text, lang);
}

/** Fills {name} slots in a text. */
export function fill(text: string, values: Record<string, string | number | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (slot, name: string) => String(values[name] ?? slot));
}

export function toArabicDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}
