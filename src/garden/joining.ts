import type { TajweedLetter } from '../core';

/**
 * Arabic letters join their neighbours. Each letter of a word is drawn in its own span so it can be coloured, ringed
 * or tapped, and Safari (so every iPhone) shapes each span on its own: the letters come apart and lam-alif loses its
 * ligature. A zero-width joiner on each side of a join keeps every letter in its joined shape, and lam with the alif
 * after it stays one shape, tapped as one.
 */

const ZWJ = '‍';

/** Letters that join only to the letter before them, never to the one after. */
const RIGHT_ONLY = new Set([...'آأؤإاةدذرزوٱٵٶٷڈډڊڑڒژۀۄۅۆۇۈۉۊۋۍےۓ']);
/** Letters that never join: hamza on the line. */
const NONE = new Set(['ء']);
/** The alifs that make a ligature with a lam before them. */
const ALIFS = new Set(['آ', 'أ', 'إ', 'ا', 'ٱ']);
const LAM = 'ل';

/** The letter itself, without its marks; none when the "letter" is only a mark (a small alif above, say). */
export function baseOf(text: string): string | undefined {
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if ((c >= 0x0620 && c <= 0x064a) || (c >= 0x0671 && c <= 0x06d3) || c === 0x06d5 || c === 0x0640) return ch;
  }
  return undefined;
}

const joinsBefore = (base?: string) => !!base && !NONE.has(base);
const joinsAfter = (base?: string) => !!base && !NONE.has(base) && !RIGHT_ONLY.has(base);

/** One tappable piece of a word: a letter, or lam with its alif. */
export interface LetterUnit {
  letters: TajweedLetter[];
  /** What is drawn, joiners included. */
  text: string;
}

/** Lam followed by an alif (marks may sit on either): drawn as one shape. */
function isLamAlif(a: TajweedLetter, b?: TajweedLetter): boolean {
  return !!b && baseOf(a.text) === LAM && ALIFS.has(baseOf(b.text) ?? '');
}

/** A word's letters as the pieces the child sees and taps, each with the joiners that keep it joined to its neighbours. */
export function wordUnits(letters: TajweedLetter[]): LetterUnit[] {
  const groups: TajweedLetter[][] = [];
  for (let i = 0; i < letters.length; i++) {
    if (isLamAlif(letters[i], letters[i + 1])) {
      groups.push([letters[i], letters[i + 1]]);
      i++;
    } else groups.push([letters[i]]);
  }
  const text = (g: TajweedLetter[]) => g.map((l) => l.text.replaceAll(ZWJ, '')).join('');
  const first = (g: TajweedLetter[]) => baseOf(text(g));
  const last = (g: TajweedLetter[]) => {
    const bases = [...text(g)].filter((ch) => baseOf(ch));
    return bases[bases.length - 1];
  };
  // Whether each piece joins the next piece that has a letter in it (pieces that are only marks are passed over).
  const joinsNext = groups.map((g, i) => {
    if (!joinsAfter(last(g))) return false;
    const next = groups.slice(i + 1).find((n) => first(n));
    return !!next && joinsBefore(first(next));
  });
  let open = false; // the letter before is waiting to join this piece
  return groups.map((g, i) => {
    const hasBase = !!first(g);
    const nextIsMarks = !!groups[i + 1] && !first(groups[i + 1]);
    let out = text(g);
    if (hasBase) {
      if (open) out = ZWJ + out;
      open = joinsNext[i];
      // A mark-only piece right after stays on its letter: the joiner goes after the mark instead.
      if (open && !nextIsMarks) out += ZWJ;
    } else if (open) {
      out += ZWJ;
    }
    return { letters: g, text: out };
  });
}

/** The letter of a tapped piece that answers the question, if one does: either letter of a lam-alif counts. */
export function tapHit(letters: TajweedLetter[], isAnswer: (letter: TajweedLetter) => boolean): TajweedLetter | undefined {
  return letters.find(isAnswer);
}
