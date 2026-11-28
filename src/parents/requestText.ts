import { APP_TEXT as A } from '../core/appTexts';
import { fill, type L } from '../core/lang';
import { surahInfo, surahName } from '../tajweed/surahs';
import { requestShape, type RecordingRequest } from './requests';

/** "Al-Ikhlas, verses 1 to 3" in the reader's language. */
export function requestText(r: RecordingRequest, lang: string, tx: (l: L) => string): string {
  const info = surahInfo(r.surah);
  return fill(tx(A[requestShape(r, info?.verses ?? r.to)]), { surah: surahName(info, lang), from: r.from, to: r.to });
}
