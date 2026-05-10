import {
  format,
  isToday,
  isTomorrow,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';

import type { CalendarEvent } from '../types';
import type { Task, TaskPriority, TaskStatus } from '../types/task';

const VALID_STATUSES = new Set<TaskStatus>(['todo', 'doing', 'done']);
const VALID_PRIORITIES = new Set<TaskPriority>(['low', 'medium', 'high']);
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_REGEX = /^\d{2}:\d{2}$/;

type PersistedTaskRecord = Record<string, unknown>;

export interface DueDatePresentation {
  label: string;
  title: string;
  className: string;
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && VALID_STATUSES.has(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && VALID_PRIORITIES.has(value as TaskPriority);
}

export function normalizeDueDateString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!DATE_ONLY_REGEX.test(trimmed)) return null;

  const parsed = parseISO(trimmed);
  if (!isValid(parsed)) return null;

  return format(parsed, 'yyyy-MM-dd');
}

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = normalizeDueDateString(value);
  if (!normalized) return null;

  const parsed = parseISO(normalized);
  return isValid(parsed) ? parsed : null;
}

export function formatDateOnly(value: string | null | undefined, pattern = 'MMM d, yyyy'): string | null {
  const parsed = parseDateOnly(value);
  return parsed ? format(parsed, pattern) : null;
}

export function getPriorityBadgeClassName(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'border-slate-300/80 bg-slate-100/80 text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300';
    case 'high':
      return 'border-rose-300/70 bg-rose-50/85 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/45 dark:text-rose-300';
    case 'medium':
    default:
      return 'border-amber-300/70 bg-amber-50/85 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/45 dark:text-amber-300';
  }
}

export function getDueDatePresentation(dueDate: string | null | undefined, status: TaskStatus): DueDatePresentation | null {
  const parsed = parseDateOnly(dueDate);
  if (!parsed) return null;

  const fullDate = format(parsed, 'EEEE, MMMM d');
  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(parsed).getTime();

  if (status !== 'done' && target < today) {
    return {
      label: 'Overdue',
      title: `Due ${fullDate}`,
      className: 'border-rose-300/70 bg-rose-50/90 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/45 dark:text-rose-300',
    };
  }

  if (status === 'done') {
    return {
      label: format(parsed, 'EEE, MMM d'),
      title: `Completed task due ${fullDate}`,
      className: 'border-zinc-300/40 bg-zinc-100/60 text-zinc-600 dark:border-zinc-700/60 dark:bg-zinc-800/55 dark:text-zinc-300',
    };
  }

  if (isToday(parsed)) {
    return {
      label: 'Today',
      title: `Due today · ${fullDate}`,
      className: 'border-primary/25 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary-foreground/90',
    };
  }

  if (isTomorrow(parsed)) {
    return {
      label: 'Tomorrow',
      title: `Due tomorrow · ${fullDate}`,
      className: 'border-border/70 bg-muted/60 text-muted-foreground dark:border-border/80 dark:bg-muted/50 dark:text-muted-foreground',
    };
  }

  return {
    label: format(parsed, 'EEE, MMM d'),
    title: `Due ${fullDate}`,
    className: 'border-border/70 bg-muted/60 text-muted-foreground dark:border-border/80 dark:bg-muted/50 dark:text-muted-foreground',
  };
}

export function getDoingFocusHint(count: number): string {
  if (count === 0) return 'No active tasks';
  if (count <= 3) return 'Good focus range';
  if (count <= 5) return 'Getting busy';
  return 'Consider narrowing focus';
}

export function addMinutesToTime(time: string, durationMinutes: number): string {
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;

  const total = Math.min((hour * 60) + minute + durationMinutes, (23 * 60) + 59);
  const nextHour = Math.floor(total / 60);
  const nextMinute = total % 60;
  return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
}

export function getDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 60;
  }

  const start = (startHour * 60) + startMinute;
  const end = (endHour * 60) + endMinute;
  return Math.max(15, end - start || 60);
}

export function getScheduledEventLabel(event: CalendarEvent | null | undefined): string | null {
  if (!event) return null;
  const dateLabel = formatDateOnly(event.date, 'MMM d');
  if (!dateLabel) return null;
  return `${dateLabel} · ${event.startTime}–${event.endTime}`;
}

function normalizePersistedTask(rawTask: PersistedTaskRecord, index: number): Task | null {
  const title = typeof rawTask.title === 'string' ? rawTask.title.trim() : '';
  if (!title) return null;

  const now = new Date().toISOString();
  const createdAt = typeof rawTask.createdAt === 'string' && !Number.isNaN(Date.parse(rawTask.createdAt))
    ? rawTask.createdAt
    : now;
  const updatedAt = typeof rawTask.updatedAt === 'string' && !Number.isNaN(Date.parse(rawTask.updatedAt))
    ? rawTask.updatedAt
    : createdAt;

  return {
    id: typeof rawTask.id === 'string' && rawTask.id.trim()
      ? rawTask.id
      : `task_${createdAt}_${index}`,
    title,
    description: typeof rawTask.description === 'string' && rawTask.description.trim()
      ? rawTask.description.trim()
      : undefined,
    context: typeof rawTask.context === 'string' && rawTask.context.trim()
      ? rawTask.context.trim()
      : null,
    status: isTaskStatus(rawTask.status) ? rawTask.status : 'todo',
    priority: isTaskPriority(rawTask.priority) ? rawTask.priority : 'medium',
    difficulty: (['easy', 'medium', 'hard'] as const).includes(rawTask.difficulty as 'easy' | 'medium' | 'hard')
      ? (rawTask.difficulty as 'easy' | 'medium' | 'hard')
      : 'medium',
    durationMinutes: typeof rawTask.durationMinutes === 'number' && rawTask.durationMinutes > 0
      ? rawTask.durationMinutes
      : 30,
    order: typeof rawTask.order === 'number' && Number.isFinite(rawTask.order) ? rawTask.order : index,
    createdAt,
    updatedAt,
    dueDate: normalizeDueDateString(rawTask.dueDate),
    linkedEventId: typeof rawTask.linkedEventId === 'string' ? rawTask.linkedEventId : null,
    scheduledStart: typeof rawTask.scheduledStart === 'string' && TIME_ONLY_REGEX.test(rawTask.scheduledStart)
      ? rawTask.scheduledStart
      : null,
    scheduledEnd: typeof rawTask.scheduledEnd === 'string' && TIME_ONLY_REGEX.test(rawTask.scheduledEnd)
      ? rawTask.scheduledEnd
      : null,
    remainingFocusTime: typeof rawTask.remainingFocusTime === 'number' && Number.isFinite(rawTask.remainingFocusTime)
      ? Math.max(0, Math.round(rawTask.remainingFocusTime))
      : null,
    parentTaskId: typeof rawTask.parentTaskId === 'string' && rawTask.parentTaskId.trim()
      ? rawTask.parentTaskId
      : null,
    depth: typeof rawTask.depth === 'number' && Number.isFinite(rawTask.depth)
      ? Math.max(0, Math.min(2, rawTask.depth))
      : 0,
  };
}

export function normalizePersistedTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];

  const buckets: Record<TaskStatus, Task[]> = {
    todo: [],
    doing: [],
    done: [],
  };

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;

    const task = normalizePersistedTask(entry as PersistedTaskRecord, index);
    if (!task) return;

    buckets[task.status].push(task);
  });

  return (['todo', 'doing', 'done'] as TaskStatus[]).flatMap((status) =>
    buckets[status]
      .sort((left, right) => {
        if (left.order !== right.order) return left.order - right.order;
        return left.createdAt.localeCompare(right.createdAt);
      })
      .map((task, index) => ({ ...task, order: index }))
  );
}