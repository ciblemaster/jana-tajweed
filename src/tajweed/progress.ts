import { progressKey } from '../profiles/store';
import type { TajweedRule } from '../core';
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
  /** Every rule's answers in the games, right and in all: what the parent view and the daily mission read. */
  rules: Partial<Record<TajweedRule, { right: number; tries: number }>>;
  /** Today's mission: its day, and which of its two parts are done. */
  mission?: { day: string; review?: boolean; verse?: boolean };
  /** For the grown-up testing the game: every surah open. */
  unlockAll?: boolean;
}

/** A fresh empty progress each time, so one child's first stars never land in another's. */
export const emptyProgress = (): Progress => ({ surahs: {}, days: [], seen: [], garden: {}, rules: {} });

/** Kept on this device only; a private window that refuses storage still plays, without remembering. */
export function readProgress(): Progress {
  return readProgressOf(undefined);
}

/** A child's progress by their id (the parent view), or the current child's. */
export function readProgressOf(id: string | undefined): Progress {
  try {
    const raw = localStorage.getItem(progressKey(id));
    return raw ? { ...emptyProgress(), ...(JSON.parse(raw) as Progress) } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(progress: Progress) {
  writeProgressOf(undefined, progress);
}

/** Saves a child's progress by their id, or the current child's. */
export function writeProgressOf(id: string | undefined, progress: Progress) {
  try {
    localStorage.setItem(progressKey(id), JSON.stringify(progress));
  } catch {
    // Nothing to do: the game goes on in memory.
  }
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Gives a surah its stars and notes that the child played today. Returns the new progress. */
export function earn(surah: number, stars: Star[]): Progress {
  const progress = readProgress();
  const had = progress.surahs[surah] ?? {};
  progress.surahs[surah] = { ...had, ...Object.fromEntries(stars.map((s) => [s, true])) };
  // Finishing any surah today is the second part of the daily mission.
  if (stars.length) progress.mission = { ...(progress.mission?.day === today() ? progress.mission : {}), day: today(), verse: true };
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

/**
 * The days in a row the child has played, ending today or yesterday. Gentle: one missed day a week is forgiven,
 * so a weekend away does not wipe it out. Only days played count towards the number.
 */
export function streak(progress: Progress, now = new Date()): number {
  const played = new Set(progress.days);
  const day = new Date(now);
  const key = () => day.toISOString().slice(0, 10);
  const back = () => day.setUTCDate(day.getUTCDate() - 1);
  if (!played.has(key())) back();
  let count = 0;
  let sinceForgiven = Infinity;
  for (;;) {
    if (played.has(key())) {
      count += 1;
      sinceForgiven += 1;
    } else {
      // A missed day: forgiven when the day before it was played and no other day was forgiven in the week after it.
      const before = new Date(day);
      before.setUTCDate(before.getUTCDate() - 1);
      if (count === 0 || sinceForgiven < 6 || !played.has(before.toISOString().slice(0, 10))) break;
      sinceForgiven = 0;
    }
    back();
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

/** Counts one answer in a game for a rule. */
export function noteAnswer(rule: TajweedRule, right: boolean) {
  const progress = readProgress();
  const had = progress.rules[rule] ?? { right: 0, tries: 0 };
  progress.rules = { ...progress.rules, [rule]: { right: had.right + (right ? 1 : 0), tries: had.tries + 1 } };
  writeProgress(progress);
}

/** Marks the review part of today's mission done. */
export function finishReview(): Progress {
  const progress = readProgress();
  progress.mission = { ...(progress.mission?.day === today() ? progress.mission : {}), day: today(), review: true };
  playedToday(progress);
  writeProgress(progress);
  return progress;
}

/** Today's mission as far as it has gone. */
export function missionToday(progress: Progress): { review: boolean; verse: boolean } {
  const m = progress.mission?.day === today() ? progress.mission : undefined;
  return { review: !!m?.review, verse: !!m?.verse };
}

export type Strength = 'strong' | 'growing' | 'practise' | 'new';

/** How sure a child is of a rule, from their game answers: 80% right is strong, 50% growing. Fewer than 3 answers is new. */
export function strengthOf(stats: { right: number; tries: number } | undefined): Strength {
  if (!stats || stats.tries < 3) return 'new';
  const share = stats.right / stats.tries;
  return share >= 0.8 ? 'strong' : share >= 0.5 ? 'growing' : 'practise';
}

/** The rule a child most needs to practise: the weakest one they have answered on, or null if none yet. */
export function weakestRule(progress: Progress): TajweedRule | null {
  const tried = (Object.entries(progress.rules) as [TajweedRule, { right: number; tries: number }][]).filter(([, s]) => s.tries >= 2);
  if (!tried.length) return null;
  tried.sort(([, a], [, b]) => a.right / a.tries - b.right / b.tries || b.tries - a.tries);
  return tried[0][0];
}

/** The days in the last 7, ending today, that the child played. */
export function daysThisWeek(progress: Progress): number {
  const day = new Date();
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (progress.days.includes(day.toISOString().slice(0, 10))) count += 1;
    day.setDate(day.getDate() - 1);
  }
  return count;
}

const union = <T,>(a: T[] = [], b: T[] = []) => [...new Set([...a, ...b])];

/**
 * Two devices' progress for one child, put together so nothing won on either is lost: every star, every day played,
 * every level done with the best score, and for each rule the answers of the device that has more of them
 * (adding them up would count the same answers twice once both devices have synced).
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const surahs: Progress['surahs'] = { ...a.surahs };
  for (const [n, stars] of Object.entries(b.surahs ?? {})) {
    const had = surahs[Number(n)] ?? {};
    surahs[Number(n)] = Object.fromEntries(STARS.filter((s) => had[s] || stars?.[s]).map((s) => [s, true]));
  }
  const garden: Progress['garden'] = { ...a.garden };
  for (const [id, level] of Object.entries(b.garden ?? {})) {
    const had = garden[id] ?? {};
    garden[id] = { done: !!(had.done || level.done), best: Math.max(had.best ?? 0, level.best ?? 0) };
  }
  const rules: Progress['rules'] = { ...a.rules };
  for (const [rule, stats] of Object.entries(b.rules ?? {}) as [TajweedRule, { right: number; tries: number }][]) {
    const had = rules[rule];
    if (!had || stats.tries > had.tries || (stats.tries === had.tries && stats.right > had.right)) rules[rule] = stats;
  }
  const [ma, mb] = [a.mission, b.mission];
  const mission =
    ma && mb && ma.day === mb.day ? { day: ma.day, review: !!(ma.review || mb.review), verse: !!(ma.verse || mb.verse) } : ma && mb ? (ma.day > mb.day ? ma : mb) : (ma ?? mb);
  return {
    surahs,
    days: union(a.days, b.days).sort().slice(-60),
    seen: union(a.seen, b.seen),
    garden,
    rules,
    ...(mission ? { mission } : {}),
    ...(a.unlockAll || b.unlockAll ? { unlockAll: true } : {})
  };
}
