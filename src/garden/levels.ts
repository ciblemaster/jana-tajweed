import type { TajweedRule } from '../core';
import { APP_TEXT as A } from '../core/appTexts';
import type { L } from '../core/lang';

export interface Level {
  id: string;
  name: L;
  line?: L;
  /** The rules the level teaches; none yet for a level that is coming. */
  rules: TajweedRule[];
  /** The colour it takes on the map: the rule it is best known by. */
  colour: TajweedRule;
}

/** The Rule Garden in the order a child learns it. The last three are on the plan and not built yet. */
export const LEVELS: Level[] = [
  { id: 'madd', name: A.maddName, line: A.maddLine, rules: ['madd2', 'madd4', 'madd5', 'madd6'], colour: 'madd2' },
  { id: 'lam', name: A.lamName, line: A.lamLine, rules: ['shamsi', 'qamari', 'silent'], colour: 'shamsi' },
  { id: 'qalqalah', name: A.qalqalahName, line: A.qalqalahLine, rules: ['qalqalah'], colour: 'qalqalah' },
  { id: 'heavy', name: A.heavyName, rules: [], colour: 'heavy' },
  { id: 'noon', name: A.noonName, rules: [], colour: 'ghunnah' },
  { id: 'together', name: A.togetherName, rules: [], colour: 'idghamg' }
];

export function levelById(id: string | null): Level | undefined {
  return LEVELS.find((l) => l.id === id && l.rules.length);
}

/** A level opens once the one before it is done. */
export function levelOpen(garden: Record<string, { done?: boolean }>, id: string, unlockAll?: boolean): boolean {
  const at = LEVELS.findIndex((l) => l.id === id);
  if (at < 0 || !LEVELS[at].rules.length) return false;
  return at === 0 || !!unlockAll || !!garden[LEVELS[at - 1].id]?.done;
}
