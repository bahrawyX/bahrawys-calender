import { create } from 'zustand';
import type { Task, TaskStatus, TaskPriority, TaskDifficulty } from '../types/task';
import {
  isTaskPriority,
  isTaskStatus,
  normalizeDueDateString,
  normalizePersistedTasks,
} from '../utils/taskBoard';
import { useDailyPlanStore } from './useDailyPlanStore';
import * as tasksPersistence from '@/lib/persistence/tasksPersistence';
import { unlinkTaskEvent, createLinkedEvent } from '@/lib/persistence/linkPersistence';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { uid } from '@/lib/uid';

const isDev = process.env.NODE_ENV === 'development';

// ── Optimistic-id → DB-UUID resolver ─────────────────────────────────────────
// addTask returns a synchronous Task with a non-UUID `uid()` id, then swaps to
// the server's UUID once tasksPersistence.createOne resolves. Cross-table
// writers (e.g. POST /api/planner-items, where taskId must be a UUID) need to
// wait for that swap before persisting. This module-level registry is shared
// state that lives outside the zustand store because resolution callers don't
// need re-renders.
const TASK_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const optimisticIdResolveMap = new Map<string, string | null>();
const optimisticIdWaiters = new Map<string, Array<(dbId: string | null) => void>>();

function notifyOptimisticIdResolved(optimisticId: string, dbId: string | null) {
  optimisticIdResolveMap.set(optimisticId, dbId);
  const waiters = optimisticIdWaiters.get(optimisticId);
  if (waiters) {
    optimisticIdWaiters.delete(optimisticId);
    for (const w of waiters) w(dbId);
  }
}

/**
 * Resolve a possibly-optimistic task id to a real DB UUID.
 * - If the id is already a UUID, returns it immediately.
 * - If the swap has already completed for this optimistic id, returns the
 *   cached result.
 * - Otherwise waits up to `timeoutMs` for the addTask DB-id swap.
 *
 * Returns `null` if persistence failed or the swap never arrived. Callers
 * must rollback their optimistic state in that case.
 */
export function resolveTaskDbId(taskId: string, timeoutMs = 5000): Promise<string | null> {
  if (TASK_UUID_RE.test(taskId)) return Promise.resolve(taskId);
  const cached = optimisticIdResolveMap.get(taskId);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    let settled = false;
    const settle = (dbId: string | null) => {
      if (settled) return;
      settled = true;
      resolve(dbId);
    };
    const timer = setTimeout(() => settle(null), timeoutMs);
    const waiters = optimisticIdWaiters.get(taskId) ?? [];
    waiters.push((dbId) => { clearTimeout(timer); settle(dbId); });
    optimisticIdWaiters.set(taskId, waiters);
  });
}

// DB is the only source of truth for tasks. The previous `lumina_tasks_*`
// localStorage cache leaked stale data across logouts (same user logging in
// after a DB wipe would still see the cached board), so all reads/writes
// have been removed. saveTasks is intentionally a no-op so call sites stay
// unchanged; loadTasks is gone — hydrateFromDbFailed now leaves the board
// empty rather than reading a stale cache.
function saveTasks(_tasks: Task[], _userId: string | null): void {
  // no-op
}

// ── List view preferences persistence ────────────────────────────────────────

export type ListSortColumn = 'title' | 'priority' | 'difficulty' | 'dueDate' | 'status' | 'focusTime';
export type ListSortDirection = 'asc' | 'desc';
export type ListGroupBy = 'status' | 'priority' | 'difficulty' | 'dueDate' | 'none';
export type TaskViewMode = 'kanban' | 'list';
export type DueDateFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'next_week' | 'no_date' | 'has_date';

const VIEW_PREFS_KEY = 'lumina_task_view_prefs';

interface ViewPrefs {
  viewMode: TaskViewMode;
  listSortColumn: ListSortColumn;
  listSortDirection: ListSortDirection;
  listGroupBy: ListGroupBy;
  listCollapsedGroups: string[];
}

// Filters are deliberately NOT persisted to localStorage — stale filters
// on reload caused empty-board confusion (Bug #5).

function loadViewPrefs(): ViewPrefs {
  try {
    const raw = getStorageItem(VIEW_PREFS_KEY);
    if (!raw) return defaultViewPrefs();
    const parsed = JSON.parse(raw);
    return {
      viewMode: parsed.viewMode === 'list' ? 'list' : 'kanban',
      listSortColumn: ['title','priority','difficulty','dueDate','status','focusTime'].includes(parsed.listSortColumn) ? parsed.listSortColumn : 'status',
      listSortDirection: parsed.listSortDirection === 'desc' ? 'desc' : 'asc',
      listGroupBy: ['status','priority','difficulty','dueDate','none'].includes(parsed.listGroupBy) ? parsed.listGroupBy : 'status',
      listCollapsedGroups: Array.isArray(parsed.listCollapsedGroups) ? parsed.listCollapsedGroups : [],
    };
  } catch { return defaultViewPrefs(); }
}

function defaultViewPrefs(): ViewPrefs {
  return {
    viewMode: 'kanban',
    listSortColumn: 'status',
    listSortDirection: 'asc',
    listGroupBy: 'status',
    listCollapsedGroups: [],
  };
}

function saveViewPrefs(prefs: ViewPrefs): void {
  setStorageItem(VIEW_PREFS_KEY, JSON.stringify(prefs));
}

// ── Store interface ──────────────────────────────────────────────────────────

interface TaskBoardState {
  tasks: Task[];
  dbHydrated: boolean;
  userId: string | null;

  // List view state
  viewMode: TaskViewMode;
  listSortColumn: ListSortColumn;
  listSortDirection: ListSortDirection;
  listGroupBy: ListGroupBy;
  listCollapsedGroups: string[];
  setViewMode: (mode: TaskViewMode) => void;
  setListSort: (column: ListSortColumn, direction?: ListSortDirection) => void;
  setListGroupBy: (groupBy: ListGroupBy) => void;
  toggleListGroupCollapse: (groupKey: string) => void;

  // Filter state
  searchQuery: string;
  priorityFilter: TaskPriority[];
  difficultyFilter: TaskDifficulty[];
  dueDateFilter: DueDateFilter;
  setSearchQuery: (q: string) => void;
  setPriorityFilter: (p: TaskPriority[]) => void;
  setDifficultyFilter: (d: TaskDifficulty[]) => void;
  setDueDateFilter: (f: DueDateFilter) => void;
  clearAllFilters: () => void;

  hydrateFromDb: (tasks: Task[]) => void;
  hydrateFromDbFailed: () => void;
  setUserId: (userId: string) => void;
  addTask: (input: { title: string; description?: string; status: TaskStatus; priority?: TaskPriority; difficulty?: TaskDifficulty; dueDate?: string | null; durationMinutes?: number; parentTaskId?: string | null; depth?: number; goalId?: string | null }) => Task | null;
  addSubtask: (parentId: string, input: { title: string; status?: TaskStatus; priority?: TaskPriority; difficulty?: TaskDifficulty }) => Task | null;
  duplicateTask: (taskId: string) => Promise<void>;
  /** ID of the task most recently created via duplicate — used for highlight flash animation */
  recentlyDuplicatedId: string | null;
  clearRecentlyDuplicated: () => void;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  rollOverTasks: (taskIds: string[], nextDate: string) => void;
  deleteTask: (id: string) => void;
  unlinkEvent: (eventId: string) => void;
  renameContextReference: (fromContext: string, toContext: string) => void;
  clearContextReference: (context: string) => void;
  moveTask: (id: string, toStatus: TaskStatus, toIndex?: number) => void;
  reorderColumn: (status: TaskStatus, orderedIds: string[]) => void;
  scheduleAsEvent: (taskId: string, payload: {
    date: string;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
    recurrence?: { rrule: string; exdates?: string[]; until?: string };
  }) => Promise<{ eventId: string; recurrenceId?: string | null } | null>;
}

export const useTaskBoardStore = create<TaskBoardState>((set, get) => ({
  // DB is the source of truth — start empty, never read localStorage on init.
  tasks: [],
  dbHydrated: false,
  userId: null,
  recentlyDuplicatedId: null,

  // List view preferences (hydrated from localStorage immediately).
  // Filters are explicitly initialised fresh — NOT from storage (Bug #5).
  ...loadViewPrefs(),
  searchQuery: '',
  priorityFilter: [],
  difficultyFilter: [],
  dueDateFilter: 'all',

  setViewMode: (mode) => {
    set({ viewMode: mode });
    saveViewPrefs({ ...loadViewPrefs(), viewMode: mode });
  },
  setListSort: (column, direction) => {
    const current = get();
    // Toggle direction if same column, otherwise default asc
    const dir = direction ?? (current.listSortColumn === column && current.listSortDirection === 'asc' ? 'desc' : 'asc');
    set({ listSortColumn: column, listSortDirection: dir });
    saveViewPrefs({ ...loadViewPrefs(), listSortColumn: column, listSortDirection: dir });
  },
  setListGroupBy: (groupBy) => {
    set({ listGroupBy: groupBy, listCollapsedGroups: [] });
    saveViewPrefs({ ...loadViewPrefs(), listGroupBy: groupBy, listCollapsedGroups: [] });
  },
  toggleListGroupCollapse: (groupKey) => {
    const current = get().listCollapsedGroups;
    const next = current.includes(groupKey) ? current.filter(k => k !== groupKey) : [...current, groupKey];
    set({ listCollapsedGroups: next });
    saveViewPrefs({ ...loadViewPrefs(), listCollapsedGroups: next });
  },

  // Filters live in-memory only — never persisted.
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPriorityFilter: (p) => set({ priorityFilter: p }),
  setDifficultyFilter: (d) => set({ difficultyFilter: d }),
  setDueDateFilter: (f) => set({ dueDateFilter: f }),
  clearAllFilters: () => set({ searchQuery: '', priorityFilter: [], difficultyFilter: [], dueDateFilter: 'all' }),

  setUserId: (userId) => {
    set({ userId });
  },

  hydrateFromDb: (dbTasks) => {
    if (get().dbHydrated) return;
    set({ dbHydrated: true, tasks: dbTasks });
  },

  hydrateFromDbFailed: () => {
    if (get().dbHydrated) return;
    // No localStorage fallback — DB is source of truth. Leave the board
    // empty and let the user retry.
    set({ dbHydrated: true, tasks: [] });
  },


  addTask: ({ title, description, status, priority = 'medium', difficulty = 'medium', dueDate, durationMinutes, parentTaskId = null, depth = 0, goalId = null }) => {
    const trimmed = title.trim();
    if (!trimmed) return null;

    const nextStatus = isTaskStatus(status) ? status : 'todo';
    const nextPriority = isTaskPriority(priority) ? priority : 'medium';

    const now = new Date().toISOString();
    const columnTasks = get().tasks.filter(t => t.status === nextStatus);
    const maxOrder = columnTasks.length > 0
      ? Math.max(...columnTasks.map(t => t.order))
      : -1;

    const task: Task = {
      id: uid(),
      title: trimmed,
      description: description?.trim() || undefined,
      context: null,
      status: nextStatus,
      priority: nextPriority,
      difficulty: (['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium') as TaskDifficulty,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      dueDate: normalizeDueDateString(dueDate),
      durationMinutes: durationMinutes ?? 30,
      linkedEventId: null,
      scheduledStart: null,
      scheduledEnd: null,
      remainingFocusTime: null,
      parentTaskId: parentTaskId ?? null,
      depth: depth ?? 0,
      goalId: goalId ?? null,
    };

    set((state) => {
      const next = [...state.tasks, task];
      saveTasks(next, state.userId);
      return { tasks: next };
    });

    // Swap optimistic uid for the real DB UUID once the server responds.
    // Notify the resolver registry on every outcome so any cross-table
    // writer waiting on this swap (e.g. planner-items persistence) can
    // unblock — either with the new UUID or with `null` to signal failure.
    void tasksPersistence.createOne(task).then((dbId) => {
      if (!dbId) {
        notifyOptimisticIdResolved(task.id, null);
        return;
      }
      if (dbId === task.id) {
        notifyOptimisticIdResolved(task.id, dbId);
        return;
      }
      set((state) => {
        const next = state.tasks.map(t => t.id === task.id ? { ...t, id: dbId } : t);
        saveTasks(next, state.userId);
        return { tasks: next };
      });
      notifyOptimisticIdResolved(task.id, dbId);
    });

    return task;
  },

  addSubtask: (parentId, { title, status = 'todo', priority = 'medium', difficulty = 'medium' }) => {
    const parent = get().tasks.find(t => t.id === parentId);
    if (!parent) return null;
    const parentDepth = parent.depth ?? 0;
    if (parentDepth >= 2) return null; // max 3 levels

    return get().addTask({
      title,
      status,
      priority,
      difficulty,
      parentTaskId: parentId,
      depth: parentDepth + 1,
    });
  },

  updateTask: (id, patch) => {
    set((state) => {
      const existing = state.tasks.find(t => t.id === id);
      if (!existing) return state;

      const nextTitle = patch.title !== undefined ? patch.title.trim() : existing.title;
      if (!nextTitle) return state;

      const nextStatus = patch.status !== undefined && isTaskStatus(patch.status)
        ? patch.status
        : existing.status;
      const nextPriority = patch.priority !== undefined && isTaskPriority(patch.priority)
        ? patch.priority
        : existing.priority;
      const nextDescription = patch.description !== undefined
        ? patch.description?.trim() || undefined
        : existing.description;
      const nextContext = patch.context !== undefined
        ? patch.context?.trim() || null
        : existing.context ?? null;
      const nextDueDate = patch.dueDate !== undefined
        ? normalizeDueDateString(patch.dueDate)
        : existing.dueDate ?? null;
      const nextLinkedEventId = patch.linkedEventId !== undefined
        ? patch.linkedEventId ?? null
        : existing.linkedEventId ?? null;
      const nextScheduledStart = patch.scheduledStart !== undefined
        ? patch.scheduledStart ?? null
        : existing.scheduledStart ?? null;
      const nextScheduledEnd = patch.scheduledEnd !== undefined
        ? patch.scheduledEnd ?? null
        : existing.scheduledEnd ?? null;
      const nextRemainingFocusTime = patch.remainingFocusTime !== undefined
        ? (patch.remainingFocusTime === null ? null : Math.max(0, Math.round(patch.remainingFocusTime)))
        : existing.remainingFocusTime ?? null;
      const nextDurationMinutes = patch.durationMinutes !== undefined
        ? (typeof patch.durationMinutes === 'number' && patch.durationMinutes > 0 ? patch.durationMinutes : existing.durationMinutes)
        : existing.durationMinutes;
      const validDifficulties = ['easy', 'medium', 'hard'] as const;
      const nextDifficulty = patch.difficulty !== undefined && validDifficulties.includes(patch.difficulty as typeof validDifficulties[number])
        ? patch.difficulty
        : existing.difficulty ?? 'medium';
      const now = new Date().toISOString();

      if (nextStatus === existing.status) {
        const next = state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                title: nextTitle,
                description: nextDescription,
                context: nextContext,
                priority: nextPriority,
                difficulty: nextDifficulty,
                durationMinutes: nextDurationMinutes,
                dueDate: nextDueDate,
                linkedEventId: nextLinkedEventId,
                scheduledStart: nextScheduledStart,
                scheduledEnd: nextScheduledEnd,
                remainingFocusTime: nextRemainingFocusTime,
                updatedAt: now,
              }
            : task
        );

        saveTasks(next, state.userId);
        return { tasks: next };
      }

      const remainingTasks = state.tasks.filter(task => task.id !== id);
      const reindexedSourceTasks = remainingTasks
        .filter(task => task.status === existing.status)
        .sort((left, right) => left.order - right.order)
        .map((task, index) => ({ ...task, order: index }));

      const nextOrder = remainingTasks
        .filter(task => task.status === nextStatus)
        .reduce((highest, task) => Math.max(highest, task.order), -1) + 1;

      const updatedTask: Task = {
        ...existing,
        title: nextTitle,
        description: nextDescription,
        context: nextContext,
        status: nextStatus,
        priority: nextPriority,
        difficulty: nextDifficulty,
        durationMinutes: nextDurationMinutes,
        dueDate: nextDueDate,
        linkedEventId: nextLinkedEventId,
        scheduledStart: nextScheduledStart,
        scheduledEnd: nextScheduledEnd,
        remainingFocusTime: nextRemainingFocusTime,
        order: nextOrder,
        updatedAt: now,
      };

      const otherTasks = remainingTasks.filter(task => task.status !== existing.status);
      const next = [...otherTasks, ...reindexedSourceTasks, updatedTask];

      saveTasks(next, state.userId);
      return { tasks: next };
    });
    // Fire-and-forget DB persistence after updateTask resolves
    tasksPersistence.updateOne(id, { ...patch });

    // Two-way sync: notify any open doc editors about task status/title changes
    if (patch.status !== undefined || patch.title !== undefined) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lumina:task-updated', {
            detail: { taskId: id, status: patch.status, title: patch.title },
          }),
        );
      }
    }
  },

  rollOverTasks: (taskIds, nextDate) => {
    if (taskIds.length === 0) return;
    const taskIdSet = new Set(taskIds);
    const normalizedDueDate = normalizeDueDateString(nextDate);
    const now = new Date().toISOString();

    set((state) => {
      const next = state.tasks.map((task) => {
        if (!taskIdSet.has(task.id)) return task;
        return {
          ...task,
          dueDate: normalizedDueDate,
          updatedAt: now,
        };
      });

      saveTasks(next, state.userId);
      return { tasks: next };
    });
  },

  deleteTask: (id) => {
    const allTasks = get().tasks;
    const task = allTasks.find(t => t.id === id);

    // Collect all descendant IDs recursively
    const collectDescendants = (pid: string): string[] => {
      const children = allTasks.filter(t => t.parentTaskId === pid);
      return children.flatMap(c => [c.id, ...collectDescendants(c.id)]);
    };
    const descendantIds = collectDescendants(id);
    const idsToRemove = new Set([id, ...descendantIds]);

    set((state) => {
      const next = state.tasks.filter(t => !idsToRemove.has(t.id));
      saveTasks(next, state.userId);
      return { tasks: next };
    });

    // Clean up planner items for the task and all descendants
    const planStore = useDailyPlanStore.getState();
    idsToRemove.forEach(tid => planStore.removeAllByTaskId(tid));

    // Fire-and-forget DB persistence — CASCADE handles children
    tasksPersistence.deleteOne(id);

    // Clean up linked calendar events for task + descendants
    const tasksWithEvents = allTasks.filter(t => idsToRemove.has(t.id) && t.linkedEventId);
    if (tasksWithEvents.length > 0) {
      import('./useCalendarEventsStore').then(({ useCalendarEventsStore }) => {
        tasksWithEvents.forEach(t =>
          useCalendarEventsStore.getState().deleteEvent(t.linkedEventId!)
        );
      });
    }
  },

  duplicateTask: async (taskId) => {
    const original = get().tasks.find(t => t.id === taskId);
    if (!original) return;

    const now = new Date().toISOString();
    const optimisticId = uid();

    // Bump existing todo column orders by 1, insert the duplicate at order 0
    const optimistic: Task = {
      ...original,
      id: optimisticId,
      title: `${original.title} (copy)`,
      status: 'todo',
      order: 0,
      createdAt: now,
      updatedAt: now,
      linkedEventId: null,
      scheduledStart: null,
      scheduledEnd: null,
      remainingFocusTime: null,
      parentTaskId: null,
      depth: 0,
    };

    set((state) => {
      const bumped = state.tasks.map(t =>
        t.status === 'todo' && !t.parentTaskId ? { ...t, order: t.order + 1 } : t
      );
      const next = [...bumped, optimistic];
      saveTasks(next, state.userId);
      return { tasks: next, recentlyDuplicatedId: optimisticId };
    });

    // Persist: hit the duplicate endpoint
    try {
      const res = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Duplicate failed (${res.status})`);
      const real = await res.json();

      // Replace optimistic with real
      set((state) => {
        const next = state.tasks.map(t =>
          t.id === optimisticId
            ? { ...optimistic, id: real.id, createdAt: real.createdAt, updatedAt: real.updatedAt }
            : t
        );
        saveTasks(next, state.userId);
        return { tasks: next, recentlyDuplicatedId: real.id };
      });
    } catch (err) {
      console.error('[duplicateTask]', err);
      // Rollback: remove optimistic
      set((state) => {
        const next = state.tasks.filter(t => t.id !== optimisticId);
        saveTasks(next, state.userId);
        return { tasks: next, recentlyDuplicatedId: null };
      });
      // Lazy-import sonner to avoid circular deps
      import('sonner').then(({ toast }) => {
        toast.error("Couldn't duplicate task");
      });
    }
  },

  clearRecentlyDuplicated: () => {
    set({ recentlyDuplicatedId: null });
  },

  unlinkEvent: (eventId) => {
    const affectedIds: string[] = [];
    set((state) => {
      const next = state.tasks.map((task) => {
        if (task.linkedEventId === eventId) {
          affectedIds.push(task.id);
          return { ...task, linkedEventId: null, updatedAt: new Date().toISOString() };
        }
        return task;
      });
      saveTasks(next, state.userId);
      return { tasks: next };
    });
    // Atomic DB unlink for each affected task
    affectedIds.forEach((taskId) => {
      unlinkTaskEvent(taskId, eventId);
    });
  },

  renameContextReference: (fromContext, toContext) => {
    set((state) => {
      const now = new Date().toISOString();
      const next = state.tasks.map((task) =>
        task.context === fromContext
          ? { ...task, context: toContext, updatedAt: now }
          : task
      );
      saveTasks(next, state.userId);
      return { tasks: next };
    });
  },

  clearContextReference: (context) => {
    set((state) => {
      const now = new Date().toISOString();
      const next = state.tasks.map((task) =>
        task.context === context
          ? { ...task, context: null, updatedAt: now }
          : task
      );
      saveTasks(next, state.userId);
      return { tasks: next };
    });
  },

  moveTask: (id, toStatus, toIndex) => {
    set((state) => {
      const task = state.tasks.find(t => t.id === id);
      if (!task) return state;

      // Tasks in destination column (excluding the moved task), sorted by order
      const destTasks = state.tasks
        .filter(t => t.status === toStatus && t.id !== id)
        .sort((a, b) => a.order - b.order);

      // Insert at position
      const insertAt = toIndex !== undefined
        ? Math.max(0, Math.min(toIndex, destTasks.length))
        : destTasks.length;

      destTasks.splice(insertAt, 0, { ...task, status: toStatus });

      // Reassign contiguous order values for destination column
      const updatedDest = destTasks.map((t, i) => ({ ...t, order: i, updatedAt: new Date().toISOString() }));

      // Rebuild all tasks: keep non-destination tasks, replace destination tasks
      const otherTasks = state.tasks.filter(t => t.status !== toStatus && t.id !== id);
      // Also re-normalise the source column if status changed
      const sourceStatus = task.status;
      let finalTasks: Task[];

      if (sourceStatus === toStatus) {
        // Same-column move is handled by reorderColumn — should not land here,
        // but be safe anyway
        finalTasks = [
          ...state.tasks.filter(t => t.status !== toStatus),
          ...updatedDest,
        ];
      } else {
        // Cross-column: renormalise source column too
        const srcTasks = state.tasks
          .filter(t => t.status === sourceStatus && t.id !== id)
          .sort((a, b) => a.order - b.order)
          .map((t, i) => ({ ...t, order: i }));

        finalTasks = [
          ...otherTasks.filter(t => t.status !== sourceStatus),
          ...srcTasks,
          ...updatedDest,
        ];
      }

      saveTasks(finalTasks, state.userId);
      return { tasks: finalTasks };
    });
    // Fire-and-forget DB persistence for the moved task — commit-time only
    const movedTask = get().tasks.find(t => t.id === id);
    if (movedTask) tasksPersistence.updateOne(id, { status: toStatus, order: movedTask.order });
  },

  reorderColumn: (status, orderedIds) => {
    set((state) => {
      const idSet = new Set(orderedIds);
      const otherTasks = state.tasks.filter(t => t.status !== status || !idSet.has(t.id));
      const taskMap = new Map(state.tasks.map(t => [t.id, t]));
      const now = new Date().toISOString();

      const reordered = orderedIds
        .map(id => taskMap.get(id))
        .filter(Boolean)
        .map((t, i) => ({ ...t!, status, order: i, updatedAt: now }));

      const next = [...otherTasks, ...reordered];
      saveTasks(next, state.userId);
      return { tasks: next };
    });
    // Fire-and-forget DB persistence for reordered tasks — commit-time only
    const updated = get().tasks.filter(t => t.status === status);
    updated.forEach(t => tasksPersistence.updateOne(t.id, { order: t.order }));
  },

  // ── Schedule task as calendar event (atomic endpoint) ─────────────────────
  scheduleAsEvent: async (taskId, payload) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return null;

    const result = await createLinkedEvent({
      title: task.title,
      description: task.description,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isAllDay: payload.isAllDay,
      recurrence: payload.recurrence,
      taskId,
    });

    if (!result) return null;

    // Optimistic update — mark task as linked
    set((state) => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? { ...t, linkedEventId: result.eventId, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    saveTasks(get().tasks, get().userId);

    return { eventId: result.eventId, recurrenceId: result.recurrenceId ?? null };
  },
}));

// ── Selectors (stable references, no inline derivation in components) ────────

export const selectTasksByStatus = (status: TaskStatus) => (state: TaskBoardState) =>
  state.tasks
    .filter(t => t.status === status)
    .sort((a, b) => a.order - b.order);

export const selectAllTasks = (state: TaskBoardState) => state.tasks;

/** Root tasks only (no parent) for a given status column. */
export const selectRootTasksByStatus = (status: TaskStatus) => (state: TaskBoardState) =>
  state.tasks
    .filter(t => !t.parentTaskId && t.status === status)
    .sort((a, b) => a.order - b.order);

/** Direct children of a given parent, sorted by createdAt. */
export const selectSubtasks = (parentId: string) => (state: TaskBoardState) =>
  state.tasks
    .filter(t => t.parentTaskId === parentId)
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

/** Progress count for direct children of a parent. */
export const selectSubtaskProgress = (parentId: string) => (state: TaskBoardState) => {
  const children = state.tasks.filter(t => t.parentTaskId === parentId);
  return {
    total: children.length,
    done: children.filter(t => t.status === 'done').length,
  };
};

/** Count all descendants (recursive) of a task. */
export const selectDescendantCount = (taskId: string) => (state: TaskBoardState) => {
  const count = (pid: string): number => {
    const children = state.tasks.filter(t => t.parentTaskId === pid);
    return children.reduce((sum, c) => sum + 1 + count(c.id), 0);
  };
  return count(taskId);
};
