import { lazy, Suspense } from 'react';
import { provideSurah } from './current';
import TajweedMap from './Map';
import { loadSurah, surahFromUrl, trialFromUrl } from './surahs';

// The address decides once what this page is: the path of surahs, or one surah being played. The links between them
// open the page afresh, because the player builds everything from its surah when it is first loaded.
const surah = surahFromUrl();

const Player = lazy(async () => {
  provideSurah(await loadSurah(surah!, trialFromUrl()));
  return import('./Tajweed');
});

/** Tajweed for kids: a path of short surahs to open one after the other, each played letter by letter. */
export default function TajweedPage() {
  if (!surah) return <TajweedMap />;
  return <Suspense fallback={<div className="page-wait" />}><Player /></Suspense>;
}
