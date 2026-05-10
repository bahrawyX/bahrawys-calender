export type GoalStatus = 'active' | 'completed' | 'archived';
export type GoalTimeframe = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type TargetType = 'number' | 'percentage' | 'boolean' | 'task_completion';
export type GoalColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'pink' | 'indigo' | 'cyan' | 'lime';

export interface GoalTarget {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  type: TargetType;
  currentValue: number;
  targetValue: number;
  unit?: string;
  linkedTaskIds: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  color?: GoalColor;
  status: GoalStatus;
  timeframe: GoalTimeframe;
  startDate: string;
  endDate: string;
  targets: GoalTarget[];
  createdAt: string;
  updatedAt: string;
  /**
   * Live, server-computed progress fields populated by GET /api/goals from
   * the linked tasks + focus sessions. Optional because they aren't stored
   * — the client only sees them after hydration.
   */
  progress?: number;
  taskCount?: number;
  completedTaskCount?: number;
  focusMinutes?: number;
}

/** Compute progress (0–100) for a single target. */
export function computeTargetProgress(target: GoalTarget): number {
  if (target.targetValue <= 0) return 0;
  switch (target.type) {
    case 'number':
      return Math.min(100, (target.currentValue / target.targetValue) * 100);
    case 'percentage':
      return Math.min(100, Math.max(0, target.currentValue));
    case 'boolean':
      return target.currentValue >= 1 ? 100 : 0;
    case 'task_completion': {
      const total = target.linkedTaskIds.length;
      if (total === 0) return 0;
      return Math.min(100, (target.currentValue / total) * 100);
    }
    default:
      return 0;
  }
}

/** Compute overall goal progress (0–100) = average of target progress. */
export function computeGoalProgress(goal: Goal): number {
  // Prefer the server-computed task-based percentage when the goal has
  // linked tasks — that's the canonical Goal-Driven Work signal. Fall
  // back to the manual target average for legacy / target-only goals.
  if (typeof goal.progress === 'number' && (goal.taskCount ?? 0) > 0) {
    return goal.progress;
  }
  if (goal.targets.length === 0) return 0;
  const sum = goal.targets.reduce((acc, t) => acc + computeTargetProgress(t), 0);
  return Math.round(sum / goal.targets.length);
}

/** Format focused minutes as "Xh Ym" / "Y min". Returns null at 0. */
export function formatFocusMinutes(minutes: number | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Status badge keyed off the live progress percentage. */
export type GoalProgressBadge = 'in-progress' | 'almost' | 'complete' | null;
export function getProgressBadge(progress: number): GoalProgressBadge {
  if (progress >= 100) return 'complete';
  if (progress > 75) return 'almost';
  if (progress >= 25) return 'in-progress';
  return null;
}

/** Color name → Tailwind class mappings */
export const GOAL_COLOR_MAP: Record<GoalColor, { border: string; bg: string; text: string; hex: string }> = {
  blue:   { border: 'border-primary',       bg: 'bg-primary/10',       text: 'text-primary',                                hex: '#6D59E0' },
  green:  { border: 'border-emerald-500',   bg: 'bg-emerald-500/10',   text: 'text-emerald-600 dark:text-emerald-400',      hex: '#10B981' },
  purple: { border: 'border-violet-500',    bg: 'bg-violet-500/10',    text: 'text-violet-600 dark:text-violet-400',        hex: '#8B5CF6' },
  orange: { border: 'border-amber-500',     bg: 'bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400',          hex: '#F59E0B' },
  red:    { border: 'border-destructive',   bg: 'bg-destructive/10',   text: 'text-destructive',                            hex: '#DA4E65' },
  teal:   { border: 'border-teal-500',      bg: 'bg-teal-500/10',      text: 'text-teal-600 dark:text-teal-400',            hex: '#14B8A6' },
  pink:   { border: 'border-pink-500',      bg: 'bg-pink-500/10',      text: 'text-pink-600 dark:text-pink-400',            hex: '#EC4899' },
  indigo: { border: 'border-indigo-500',    bg: 'bg-indigo-500/10',    text: 'text-indigo-600 dark:text-indigo-400',        hex: '#6366F1' },
  cyan:   { border: 'border-cyan-500',      bg: 'bg-cyan-500/10',      text: 'text-cyan-600 dark:text-cyan-400',            hex: '#06B6D4' },
  lime:   { border: 'border-lime-500',      bg: 'bg-lime-500/10',      text: 'text-lime-600 dark:text-lime-400',            hex: '#84CC16' },
};

export const GOAL_COLORS: GoalColor[] = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'indigo', 'cyan', 'lime'];

export const TIMEFRAME_LABELS: Record<GoalTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
};
