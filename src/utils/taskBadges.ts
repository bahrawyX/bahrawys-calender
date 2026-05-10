/**
 * Shared badge metadata for task priority and difficulty.
 * Used by TaskCard (kanban) and TaskListView (list view).
 */
import type { TaskPriority, TaskDifficulty } from '../types/task';

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string; itemClassName: string }> = {
  high: {
    label: 'High',
    className: 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15',
    itemClassName: 'text-destructive focus:text-destructive focus:bg-destructive/15',
  },
  medium: {
    label: 'Medium',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15',
    itemClassName: 'text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300 focus:bg-amber-500/15',
  },
  low: {
    label: 'Low',
    className: 'border-border bg-muted/60 text-muted-foreground hover:bg-muted',
    itemClassName: 'text-muted-foreground focus:text-foreground focus:bg-muted',
  },
};

export const DIFFICULTY_META: Record<TaskDifficulty, { label: string; short: string; className: string; itemClassName: string }> = {
  easy: {
    label: 'Easy',
    short: 'E',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    itemClassName: 'text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300 focus:bg-emerald-500/15',
  },
  medium: {
    label: 'Medium',
    short: 'M',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    itemClassName: 'text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300 focus:bg-amber-500/15',
  },
  hard: {
    label: 'Hard',
    short: 'H',
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
    itemClassName: 'text-destructive focus:text-destructive focus:bg-destructive/15',
  },
};

export const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];
export const DIFFICULTY_OPTIONS: TaskDifficulty[] = ['easy', 'medium', 'hard'];
export const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
export const DIFFICULTY_ORDER: Record<TaskDifficulty, number> = { hard: 0, medium: 1, easy: 2 };
export const STATUS_ORDER: Record<string, number> = { todo: 0, doing: 1, done: 2 };
