import { TAJWEED_RULES, type TajweedRule } from '../core';
import { APP_TEXT as A } from '../core/appTexts';
import type { L } from '../core/lang';
import { weakestRule, type Progress } from '../tajweed/progress';

export interface Level {
  id: string;
  name: L;
  line?: L;
  /** The rules the level teaches; none yet for a level that is coming. */
  rules: TajweedRule[];
  /** The colour it takes on the map: the rule it is best known by. */
  colour: TajweedRule;
  /** Level 0 teaches letters, not rules, and plays its own games. */
  kind?: 'letters';
}

/** A level that can be played: one with rules, or Level 0. */
export const playable = (l: Level) => l.rules.length > 0 || !!l.kind;

/** The Rule Garden in the order a child learns it. */
export const LEVELS: Level[] = [
  { id: 'letters', name: A.lettersName, line: A.lettersLine, rules: [], colour: 'qamari', kind: 'letters' },
  { id: 'madd', name: A.maddName, line: A.maddLine, rules: ['madd2', 'madd4', 'madd5', 'madd6'], colour: 'madd2' },
  { id: 'lam', name: A.lamName, line: A.lamLine, rules: ['shamsi', 'qamari', 'silent'], colour: 'shamsi' },
  { id: 'qalqalah', name: A.qalqalahName, line: A.qalqalahLine, rules: ['qalqalah'], colour: 'qalqalah' },
  { id: 'heavy', name: A.heavyName, line: A.heavyLine, rules: ['heavy'], colour: 'heavy' },
  { id: 'noon', name: A.noonName, line: A.noonLine, rules: ['ghunnah', 'izhar', 'ikhfa', 'idghamg', 'idgham', 'iqlab'], colour: 'ghunnah' },
  { id: 'together', name: A.togetherName, line: A.togetherLine, rules: [...TAJWEED_RULES], colour: 'idghamg' }
];

export function levelById(id: string | null): Level | undefined {
  return LEVELS.find((l) => l.id === id && playable(l));
}

/**
 * A level opens once the one before it is done. Level 0 and Level 1 are both open from the start: a child who already
 * reads can begin with the rules.
 */
export function levelOpen(garden: Record<string, { done?: boolean }>, id: string, unlockAll?: boolean): boolean {
  const at = LEVELS.findIndex((l) => l.id === id);
  if (at < 0 || !playable(LEVELS[at])) return false;
  return at <= 1 || !!unlockAll || !!garden[LEVELS[at - 1].id]?.done;
}

/**
 * The rule today's review is about: the one the child gets wrong most, or else the first rule of the level they are
 * on. The review asks about the whole level that rule belongs to, so a "which rule?" question has choices.
 */
export function missionRule(progress: Progress): { rule: TajweedRule; rules: TajweedRule[] } {
  const weak = weakestRule(progress);
  const level = weak
    ? LEVELS.find((l) => l.id !== 'together' && l.rules.includes(weak))!
    : [...LEVELS].reverse().find((l) => l.id !== 'together' && l.rules.length > 0 && levelOpen(progress.garden, l.id, progress.unlockAll)) ?? LEVELS.find((l) => l.rules.length)!;
  return { rule: weak ?? level.rules[0], rules: level.rules };
}

