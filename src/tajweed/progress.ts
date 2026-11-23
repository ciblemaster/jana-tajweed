import { progressKey } from '../profiles/store';
import { GAME_SURAHS } from './surahs';

/** The three stars of a surah: followed to the end, recited on every turn, recited from memory. */
export type Star = 'listen' | 'recite' | 'memorise';
export const STARS: Star[] = ['listen', 'recite', 'memorise'];

export interface Progress {
  surahs: Record<number, Partial<Record<Star, boolean>>>;
  /** The days the child played, as YYYY-MM-DD, newest last. */
  days: string[];
  /** The awards already shown, so a new one is announced once. */
  seen: string[];
  /** The Rule Garden: each level finished, and the best challenge score (0 to 1). */
  garden: Record<string, { done?: boolean; best?: number }>;
  /** For the grown-up testing the game: every surah open. */
  unlockAll?: boolean;
}

const EMPTY: Progress = { surahs: {}, days: [], seen: [], garden: {} };

/** Kept on this device only; a private window that refuses storage still plays, without remembering. */
export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(progressKey());
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Progress) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export function writeProgress(progress: Progress) {
  try {
    localStorage.setItem(progressKey(), JSON.stringify(progress));
  } catch {
    // Nothing to do: the game goes on in memory.
  }
}

const today = () => new Date().toISOString().slice(0, 10);

/** Gives a surah its stars and notes that the child played today. Returns the new progress. */
export function earn(surah: number, stars: Star[]): Progress {
  const progress = readProgress();
  const had = progress.surahs[surah] ?? {};
  progress.surahs[surah] = { ...had, ...Object.fromEntries(stars.map((s) => [s, true])) };
  if (progress.days[progress.days.length - 1] !== today()) progress.days = [...progress.days, today()].slice(-60);
  writeProgress(progress);
  return progress;
}

export function starsOf(progress: Progress, surah: number): number {
  return STARS.filter((s) => progress.surahs[surah]?.[s]).length;
}

export function totalStars(progress: Progress): number {
  return GAME_SURAHS.reduce((sum, s) => sum + starsOf(progress, s.n), 0);
}

/** A surah opens once the one before it on the path has its first star. */
export function isOpen(progress: Progress, surah: number): boolean {
  const at = GAME_SURAHS.findIndex((s) => s.n === surah);
  return at <= 0 || !!progress.unlockAll || !!progress.surahs[GAME_SURAHS[at - 1].n]?.listen;
}

/** The surah to play next: the first open one without its first star. */
export function nextUp(progress: Progress): number {
  return (GAME_SURAHS.find((s) => !progress.surahs[s.n]?.listen) ?? GAME_SURAHS[GAME_SURAHS.length - 1]).n;
}

/** The days in a row the child has played, ending today or yesterday. */
export function streak(progress: Progress): number {
  let count = 0;
  const day = new Date();
  if (!progress.days.includes(today())) day.setDate(day.getDate() - 1);
  while (progress.days.includes(day.toISOString().slice(0, 10))) {
    count += 1;
    day.setDate(day.getDate() - 1);
  }
  return count;
}

export interface Award {
  id: string;
  /** How far the child is, and how far the award asks. */
  have: number;
  need: number;
}

const count = (progress: Progress, star: Star) => GAME_SURAHS.filter((s) => progress.surahs[s.n]?.[star]).length;

/** Every award with how close the child is to it; one is won when `have` reaches `need`. */
export function awards(progress: Progress): Award[] {
  const quls = [112, 113, 114].filter((n) => progress.surahs[n]?.listen).length;
  const full = GAME_SURAHS.filter((s) => starsOf(progress, s.n) === 3).length;
  return [
    { id: 'first', have: Math.min(1, count(progress, 'listen')), need: 1 },
    { id: 'quls', have: quls, need: 3 },
    { id: 'five', have: Math.min(5, count(progress, 'listen')), need: 5 },
    { id: 'ten', have: Math.min(10, count(progress, 'listen')), need: 10 },
    { id: 'reciter', have: Math.min(3, count(progress, 'recite')), need: 3 },
    { id: 'memory', have: Math.min(1, count(progress, 'memorise')), need: 1 },
    { id: 'memory5', have: Math.min(5, count(progress, 'memorise')), need: 5 },
    { id: 'gold', have: Math.min(1, full), need: 1 },
    { id: 'days3', have: Math.min(3, streak(progress)), need: 3 },
    { id: 'all', have: count(progress, 'listen'), need: GAME_SURAHS.length }
  ];
}

export const won = (award: Award) => award.have >= award.need;

/** Notes that the child played today. */
function playedToday(progress: Progress) {
  if (progress.days[progress.days.length - 1] !== today()) progress.days = [...progress.days, today()].slice(-60);
}

/** Records a Rule Garden challenge: the level is done once a challenge is passed. Returns the new progress. */
export function earnLevel(level: string, score: number, passed: boolean): Progress {
  const progress = readProgress();
  const had = progress.garden[level] ?? {};
  progress.garden = { ...progress.garden, [level]: { done: had.done || passed, best: Math.max(had.best ?? 0, score) } };
  playedToday(progress);
  writeProgress(progress);
  return progress;
}
