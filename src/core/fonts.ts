/** The faces the app draws in: the mushaf face is a file of its own, the rest come from Fontsource. */
const FACE_FILES: Record<string, string> = {
  'Uthmani Hafs Mushaf': '/fonts/UthmanicHafs.woff2'
};

const STYLESHEETS: Record<string, () => Promise<unknown>> = {
  Lalezar: () => import('@fontsource/lalezar/400.css'),
  'Noto Naskh Arabic': () => import('@fontsource/noto-naskh-arabic/400.css')
};

const SAMPLE = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ Aa';
const loading = new Map<string, Promise<void>>();

function loadOne(family: string): Promise<void> {
  const known = loading.get(family);
  if (known) return known;
  const task = (async () => {
    const file = FACE_FILES[family];
    if (file) {
      const face = new FontFace(family, `url(${import.meta.env.BASE_URL.replace(/\/$/, '')}${file})`);
      document.fonts.add(await face.load());
      return;
    }
    await STYLESHEETS[family]?.();
    await document.fonts.load(`400 24px "${family}"`, SAMPLE);
  })().catch((e) => {
    console.warn(`Could not load ${family}`, e);
  });
  loading.set(family, task);
  return task;
}

export async function ensureFonts(families: string[]): Promise<void> {
  await Promise.all([...new Set(families)].map(loadOne));
}

export function fontStack(font: string): string {
  return `"${font}", "Noto Naskh Arabic", "Noto Sans", serif`;
}
