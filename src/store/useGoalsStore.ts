import { create } from 'zustand';
import type { Goal, GoalTarget, GoalStatus, GoalTimeframe, GoalColor, TargetType } from '../types/goal';
import { computeGoalProgress, computeTargetProgress } from '../types/goal';
import * as goalsPersistence from '@/lib/persistence/goalsPersistence';
import { uid } from '@/lib/uid';
import { toast } from 'sonner';

// ── Optimistic-ID resolver ───────────────────────────────────────────────────
// Goals/targets are inserted optimistically with non-UUID prefixed IDs
// (`goal_xxx`, `target_xxx`). The DB uses UUIDs. After POST returns the real
// IDs we record them here so subsequent PATCH/DELETE calls hit the right row.
//   `resolveGoalDbId` waits up to 5 s for an optimistic ID to be resolved;
//   already-UUID IDs (hydrated from DB) resolve immediately.
const optimisticGoalIds   = new Map<string, string>();
const optimisticTargetIds = new Map<string, string>();
const goalIdWaiters       = new Map<string, Array<(id: string | null) => void>>();
const targetIdWaiters     = new Map<string, Array<(id: string | null) => void>>();

const RESOLVE_TIMEOUT_MS = 5000;

function isOptimisticGoalId(id: string)   { return id.startsWith('goal_'); }
function isOptimisticTargetId(id: string) { return id.startsWith('target_'); }

export function resolveGoalDbId(id: string): Promise<string | null> {
  if (!isOptimisticGoalId(id)) return Promise.resolve(id);
  const cached = optimisticGoalIds.get(id);
  if (cached) return Promise.resolve(cached);
  return new Promise(resolve => {
    const arr = goalIdWaiters.get(id) ?? [];
    arr.push(resolve);
    goalIdWaiters.set(id, arr);
    setTimeout(() => resolve(optimisticGoalIds.get(id) ?? null), RESOLVE_TIMEOUT_MS);
  });
}

export function resolveTargetDbId(id: string): Promise<string | null> {
  if (!isOptimisticTargetId(id)) return Promise.resolve(id);
  const cached = optimisticTargetIds.get(id);
  if (cached) return Promise.resolve(cached);
  return new Promise(resolve => {
    const arr = targetIdWaiters.get(id) ?? [];
    arr.push(resolve);
    targetIdWaiters.set(id, arr);
    setTimeout(() => resolve(optimisticTargetIds.get(id) ?? null), RESOLVE_TIMEOUT_MS);
  });
}

function notifyGoalIdResolved(optId: string, dbId: string | null) {
  if (dbId) optimisticGoalIds.set(optId, dbId);
  const waiters = goalIdWaiters.get(optId);
  if (waiters) {
    waiters.forEach(w => w(dbId));
    goalIdWaiters.delete(optId);
  }
}

function notifyTargetIdResolved(optId: string, dbId: string | null) {
  if (dbId) optimisticTargetIds.set(optId, dbId);
  const waiters = targetIdWaiters.get(optId);
  if (waiters) {
    waiters.forEach(w => w(dbId));
    targetIdWaiters.delete(optId);
  }
}

/** Sync helper — returns the real ID if known, otherwise the optimistic ID itself.
 *  Used so the local store update always finds the row, even if the real ID
 *  has already been swapped in. */
function syncResolveGoal(id: string)   { return optimisticGoalIds.get(id) ?? id; }
function syncResolveTarget(id: string) { return optimisticTargetIds.get(id) ?? id; }

// ── Debounced target-save queue ─────────────────────────────────────────────
// Coalesces rapid +/− clicks on a single target into one PATCH carrying the
// final patch. Keyed by `${localGoalId}::${localTargetId}` so different
// targets don't clobber each other. Errors are reported only after the
// debounce fires — preventing the toast spam the user complained about.
const TARGET_SAVE_DEBOUNCE_MS = 350;
interface PendingTargetSave {
  timer: ReturnType<typeof setTimeout>;
  goalIdInput: string;
  targetIdInput: string;
  patch: Record<string, unknown>;
}
const pendingTargetSaves = new Map<string, PendingTargetSave>();
let lastTargetSaveErrorAt = 0;

function scheduleTargetSave(
  localGoalId: string,
  localTargetId: string,
  goalIdInput: string,
  targetIdInput: string,
  patch: Record<string, unknown>,
) {
  const key = `${localGoalId}::${localTargetId}`;
  const existing = pendingTargetSaves.get(key);
  const merged = { ...(existing?.patch ?? {}), ...patch };
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    pendingTargetSaves.delete(key);
    void Promise.all([resolveGoalDbId(goalIdInput), resolveTargetDbId(targetIdInput)]).then(([realGoalId, realTargetId]) => {
      if (!realGoalId || !realTargetId) {
        // Optimistic ID never resolved — the create POST probably failed.
        // Fire one rate-limited error so the user knows; don't roll back.
        emitTargetSaveError();
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useGoalsStore] target save failed: ID never resolved', { goalIdInput, targetIdInput });
        }
        return;
      }
      goalsPersistence.updateTarget(realGoalId, realTargetId, merged as Partial<GoalTarget>).catch((err) => {
        emitTargetSaveError();
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useGoalsStore] target save HTTP error', err);
        }
      });
    });
  }, TARGET_SAVE_DEBOUNCE_MS);

  pendingTargetSaves.set(key, { timer, goalIdInput, targetIdInput, patch: merged });
}

/** Toast-error rate limiter — at most one "Failed to save" toast per 4 s
 *  regardless of how many target updates fail. */
function emitTargetSaveError() {
  const now = Date.now();
  if (now - lastTargetSaveErrorAt < 4000) return;
  lastTargetSaveErrorAt = now;
  toast.error('Couldn\'t sync goal progress. Your changes are saved locally.');
}

// ── Store interface ──────────────────────────────────────────────────────────

interface GoalsState {
  goals: Goal[];
  dbHydrated: boolean;
  isLoading: boolean;
  selectedGoalId: string | null;

  // Hydration
  hydrateFromDb: (goals: Goal[]) => void;
  hydrateFromDbFailed: () => void;

  // Goal CRUD
  addGoal: (input: {
    title: string;
    description?: string;
    emoji?: string;
    color?: GoalColor;
    timeframe: GoalTimeframe;
    startDate: string;
    endDate: string;
    targets?: Array<{
      title: string;
      type: TargetType;
      targetValue: number;
      unit?: string;
      linkedTaskIds?: string[];
    }>;
  }) => Goal;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'targets' | 'createdAt'>>) => void;
  archiveGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  setSelectedGoalId: (id: string | null) => void;

  // Target CRUD
  addTarget: (goalId: string, input: {
    title: string;
    type: TargetType;
    targetValue: number;
    unit?: string;
    linkedTaskIds?: string[];
  }) => GoalTarget | null;
  updateTarget: (goalId: string, targetId: string, patch: Partial<GoalTarget>) => void;
  deleteTarget: (goalId: string, targetId: string) => void;
  updateTargetProgress: (goalId: string, targetId: string, value: number) => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  dbHydrated: false,
  isLoading: false,
  selectedGoalId: null,

  hydrateFromDb: (goals) => {
    if (get().dbHydrated) return;
    set({ dbHydrated: true, goals });
  },

  hydrateFromDbFailed: () => {
    if (get().dbHydrated) return;
    set({ dbHydrated: true });
  },

  setSelectedGoalId: (id) => set({ selectedGoalId: id }),

  addGoal: (input) => {
    const now = new Date().toISOString();
    const goalId = uid('goal_');

    const targets: GoalTarget[] = (input.targets ?? []).map((t, i) => ({
      id: uid('target_'),
      goalId,
      title: t.title,
      type: t.type,
      currentValue: 0,
      targetValue: t.targetValue,
      unit: t.unit,
      linkedTaskIds: t.linkedTaskIds ?? [],
      order: i,
      createdAt: now,
      updatedAt: now,
    }));

    const goal: Goal = {
      id: goalId,
      title: input.title,
      description: input.description,
      emoji: input.emoji,
      color: input.color,
      status: 'active',
      timeframe: input.timeframe,
      startDate: input.startDate,
      endDate: input.endDate,
      targets,
      createdAt: now,
      updatedAt: now,
    };

    set(s => ({ goals: [...s.goals, goal] }));

    // Persist + reconcile optimistic IDs with the server-issued UUIDs.
    // Without this swap, every later PATCH/DELETE would target `goal_xxx`
    // and fail with a Postgres UUID validation error (HTTP 500).
    goalsPersistence.createOne({
      title: input.title,
      description: input.description,
      emoji: input.emoji,
      color: input.color,
      timeframe: input.timeframe,
      startDate: input.startDate,
      endDate: input.endDate,
      targets: input.targets,
    }).then(data => {
      if (!data?.goalId) {
        notifyGoalIdResolved(goalId, null);
        targets.forEach(t => notifyTargetIdResolved(t.id, null));
        return;
      }
      const realGoalId  = data.goalId;
      const realTargetIds = Array.isArray(data.targetIds) ? data.targetIds : [];
      notifyGoalIdResolved(goalId, realGoalId);
      targets.forEach((t, i) => {
        const real = realTargetIds[i];
        notifyTargetIdResolved(t.id, real ?? null);
      });
      // Swap the in-store IDs so future selectors / drag-drop / detail-sheet
      // navigation use the real UUIDs.
      set(s => ({
        goals: s.goals.map(g => g.id === goalId
          ? {
              ...g,
              id: realGoalId,
              targets: g.targets.map((t, i) => ({
                ...t,
                id: realTargetIds[i] ?? t.id,
                goalId: realGoalId,
              })),
            }
          : g),
      }));
    });

    return goal;
  },

  updateGoal: (id, patch) => {
    const localId = syncResolveGoal(id);
    set(s => ({
      goals: s.goals.map(g =>
        g.id === localId ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g
      ),
    }));
    void resolveGoalDbId(id).then(realId => {
      if (!realId) {
        toast.error('Could not save goal — please retry');
        return;
      }
      goalsPersistence.updateOne(realId, patch);
    });
  },

  archiveGoal: (id) => {
    get().updateGoal(id, { status: 'archived' });
  },

  deleteGoal: (id) => {
    const localId = syncResolveGoal(id);
    set(s => ({ goals: s.goals.filter(g => g.id !== localId) }));
    void resolveGoalDbId(id).then(realId => {
      if (realId) goalsPersistence.deleteOne(realId, true);
    });
  },

  addTarget: (goalId, input) => {
    const localGoalId = syncResolveGoal(goalId);
    const goal = get().goals.find(g => g.id === localGoalId);
    if (!goal) return null;

    const now = new Date().toISOString();
    const optimisticTargetId = uid('target_');
    const target: GoalTarget = {
      id: optimisticTargetId,
      goalId: localGoalId,
      title: input.title,
      type: input.type,
      currentValue: 0,
      targetValue: input.targetValue,
      unit: input.unit,
      linkedTaskIds: input.linkedTaskIds ?? [],
      order: goal.targets.length,
      createdAt: now,
      updatedAt: now,
    };

    set(s => ({
      goals: s.goals.map(g =>
        g.id === localGoalId ? { ...g, targets: [...g.targets, target], updatedAt: now } : g
      ),
    }));

    void resolveGoalDbId(goalId).then(async realGoalId => {
      if (!realGoalId) { notifyTargetIdResolved(optimisticTargetId, null); return; }
      const data = await goalsPersistence.addTarget(realGoalId, input);
      const realTargetId = data?.id ?? null;
      notifyTargetIdResolved(optimisticTargetId, realTargetId);
      if (realTargetId) {
        set(s => ({
          goals: s.goals.map(g => g.id === realGoalId
            ? { ...g, targets: g.targets.map(t => t.id === optimisticTargetId ? { ...t, id: realTargetId } : t) }
            : g),
        }));
      }
    });
    return target;
  },

  updateTarget: (goalId, targetId, patch) => {
    const now = new Date().toISOString();
    const localGoalId = syncResolveGoal(goalId);
    const localTargetId = syncResolveTarget(targetId);

    set(s => ({
      goals: s.goals.map(g =>
        g.id === localGoalId
          ? {
              ...g,
              targets: g.targets.map(t =>
                t.id === localTargetId ? { ...t, ...patch, updatedAt: now } : t
              ),
              updatedAt: now,
            }
          : g
      ),
    }));

    // Coalesce rapid clicks on +/− into a single PATCH per (goal, target).
    // Without this, ten quick clicks fire ten parallel requests; one slow or
    // racing request returns an error and we used to emit a noisy stream of
    // "Failed to save goal progress" toasts even though the local state was
    // fine. The debouncer also lets us hold the latest patch only.
    scheduleTargetSave(localGoalId, localTargetId, goalId, targetId, patch);
  },

  deleteTarget: (goalId, targetId) => {
    const now = new Date().toISOString();
    const localGoalId = syncResolveGoal(goalId);
    const localTargetId = syncResolveTarget(targetId);
    set(s => ({
      goals: s.goals.map(g =>
        g.id === localGoalId
          ? { ...g, targets: g.targets.filter(t => t.id !== localTargetId), updatedAt: now }
          : g
      ),
    }));
    void Promise.all([resolveGoalDbId(goalId), resolveTargetDbId(targetId)]).then(([realGoalId, realTargetId]) => {
      if (realGoalId && realTargetId) goalsPersistence.deleteTarget(realGoalId, realTargetId);
    });
  },

  updateTargetProgress: (goalId, targetId, value) => {
    get().updateTarget(goalId, targetId, { currentValue: value });
  },
}));

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectActiveGoals = (state: GoalsState) =>
  state.goals
    .filter(g => g.status === 'active')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

export const selectGoalsByStatus = (status: GoalStatus) => (state: GoalsState) =>
  state.goals.filter(g => g.status === status);

export const selectGoalProgress = (goalId: string) => (state: GoalsState) => {
  const goal = state.goals.find(g => g.id === goalId);
  return goal ? computeGoalProgress(goal) : 0;
};

export const selectActiveGoalCount = (state: GoalsState) =>
  state.goals.filter(g => g.status === 'active').length;
