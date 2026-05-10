import { create } from 'zustand';
import type { Recommendation, IntelligenceOutput } from '@/lib/intelligence/types';
import { useTaskBoardStore } from '@/store/useTaskBoardStore';
import { useCalendarEventsStore } from '@/store/useCalendarEventsStore';
import { useDailyPlanStore, todayKey } from '@/store/useDailyPlanStore';
import type { CalendarEvent } from '@/types';

const CACHE_MS = 60_000;

type ApplyResult = {
  applied: boolean;
  message: string;
};

type ParsedTaskPlan = {
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
  dueDate: string;
};

type ParsedFocusWindow = {
  startIso: string;
  endIso: string;
};

interface IntelligenceStoreState {
  data: IntelligenceOutput | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  appliedRecommendationIds: string[];
  fetchIntelligence: (force?: boolean) => Promise<void>;
  clearError: () => void;
  applyRecommendation: (recommendation: Recommendation) => Promise<ApplyResult>;
}

function toHm(iso: string): string {
  const dt = new Date(iso);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function toDateKey(iso: string): string {
  const dt = new Date(iso);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function tryParseFromEvidence(recommendation: Recommendation): ParsedTaskPlan | null {
  const evidence = recommendation.evidence as Record<string, unknown>;
  const taskId = typeof evidence.taskId === 'string'
    ? evidence.taskId
    : (Array.isArray(recommendation.relatedIds) ? recommendation.relatedIds.find((id) => typeof id === 'string') : undefined);

  const suggestedStart = typeof evidence.suggestedStart === 'string' ? evidence.suggestedStart : null;
  const suggestedEnd = typeof evidence.suggestedEnd === 'string' ? evidence.suggestedEnd : null;

  if (!taskId || !suggestedStart || !suggestedEnd) return null;
  return {
    taskId,
    scheduledStart: toHm(suggestedStart),
    scheduledEnd: toHm(suggestedEnd),
    dueDate: toDateKey(suggestedStart),
  };
}

function tryParseFromExplanation(recommendation: Recommendation): ParsedTaskPlan | null {
  const pattern = /Plan task\s+([^\s]+)\s+between\s+([^\s]+)\s+and\s+([^\s.]+)\.?/i;
  const match = recommendation.explanation.match(pattern);
  if (!match) return null;

  const taskId = match[1];
  const suggestedStart = match[2];
  const suggestedEnd = match[3];

  if (!taskId || !suggestedStart || !suggestedEnd) return null;
  return {
    taskId,
    scheduledStart: toHm(suggestedStart),
    scheduledEnd: toHm(suggestedEnd),
    dueDate: toDateKey(suggestedStart),
  };
}

function parseTaskPlanRecommendation(recommendation: Recommendation): ParsedTaskPlan | null {
  if (recommendation.type !== 'task_plan') return null;
  return tryParseFromEvidence(recommendation) ?? tryParseFromExplanation(recommendation);
}

function addAppliedRecommendationId(current: string[], recommendationId: string): string[] {
  return current.includes(recommendationId) ? current : [...current, recommendationId];
}

function localEventFromApi(apiEvent: Record<string, unknown>): CalendarEvent {
  return {
    id: String(apiEvent.id),
    title: String(apiEvent.title ?? 'Deep Work / Focus'),
    description: typeof apiEvent.description === 'string' ? apiEvent.description : '',
    date: String(apiEvent.date),
    startTime: String(apiEvent.startTime ?? '00:00'),
    endTime: String(apiEvent.endTime ?? '00:00'),
    timezone: typeof apiEvent.timezone === 'string' ? apiEvent.timezone : 'UTC',
    location: typeof apiEvent.location === 'string' ? apiEvent.location : undefined,
    category: typeof apiEvent.category === 'string' ? apiEvent.category : 'focus',
    color: typeof apiEvent.color === 'string' ? apiEvent.color : '#4f46e5',
    completed: Boolean(apiEvent.completed),
    source: 'lumina',
    provider: 'local',
    linkedTaskId: typeof apiEvent.linkedTaskId === 'string' ? apiEvent.linkedTaskId : null,
  };
}

function pushEventIntoCalendarStore(event: CalendarEvent): void {
  useCalendarEventsStore.setState((state) => {
    const alreadyExists = state.events.some((existing) => existing.id === event.id);
    if (alreadyExists) return state;

    const nextEvents = [...state.events, event];
    const nextHistory = [...state.history.slice(0, state.historyIndex + 1), { events: nextEvents }].slice(-50);

    return {
      events: nextEvents,
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    };
  });
}

function parseFocusWindowRecommendation(recommendation: Recommendation, data: IntelligenceOutput | null): ParsedFocusWindow | null {
  const evidence = recommendation.evidence as Record<string, unknown>;
  const evidenceStart = typeof evidence.start === 'string' ? evidence.start : null;
  const evidenceEnd = typeof evidence.end === 'string' ? evidence.end : null;
  if (evidenceStart && evidenceEnd) {
    return { startIso: evidenceStart, endIso: evidenceEnd };
  }

  const startFromId = recommendation.id.startsWith('focus:') ? recommendation.id.slice('focus:'.length) : null;
  if (startFromId && data) {
    const matched = data.focusWindows.find((window) => window.start === startFromId);
    if (matched) {
      return { startIso: matched.start, endIso: matched.end };
    }
  }

  const top = data?.summary.topFocusWindow;
  if (top) {
    return { startIso: top.start, endIso: top.end };
  }

  return null;
}

async function patchTask(taskId: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.ok;
}

/** Returns the set of task IDs that are already planned for today. */
export function getPlannedTaskIds(): Set<string> {
  const today = todayKey();
  const planItems = useDailyPlanStore.getState().plansByDate[today] ?? [];
  return new Set(planItems.map((item) => item.taskId));
}

export const useIntelligenceStore = create<IntelligenceStoreState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  appliedRecommendationIds: [],

  fetchIntelligence: async (force = false) => {
    const { lastFetchedAt, isLoading } = get();
    const isFresh = lastFetchedAt !== null && Date.now() - lastFetchedAt < CACHE_MS;
    if (!force && (isFresh || isLoading)) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/intelligence', { method: 'GET' });
      if (!res.ok) {
        throw new Error(`Failed to fetch intelligence: ${res.status}`);
      }

      const payload = (await res.json()) as { ok?: boolean } & IntelligenceOutput;
      set({
        data: payload,
        isLoading: false,
        error: null,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load intelligence',
      });
    }
  },

  clearError: () => set({ error: null }),

  applyRecommendation: async (recommendation) => {
    if (recommendation.type === 'task_plan') {
      const parsed = parseTaskPlanRecommendation(recommendation);
      if (!parsed) {
        return { applied: false, message: 'This recommendation cannot be auto-applied yet.' };
      }

      const body = {
        scheduledStart: parsed.scheduledStart,
        scheduledEnd: parsed.scheduledEnd,
        dueDate: parsed.dueDate,
        status: 'doing' as const,
      };

      const ok = await patchTask(parsed.taskId, body);
      if (!ok) {
        return { applied: false, message: 'Failed to apply recommendation.' };
      }

      useTaskBoardStore.getState().updateTask(parsed.taskId, body);
      set((state) => ({
        appliedRecommendationIds: addAppliedRecommendationId(state.appliedRecommendationIds, recommendation.id),
      }));

      return { applied: true, message: 'Task scheduled!' };
    }

    if (recommendation.type === 'conflict') {
      const taskStore = useTaskBoardStore.getState();
      const tasks = taskStore.tasks;
      const taskId = recommendation.relatedIds?.find((id) => tasks.some((task) => task.id === id));
      if (!taskId) {
        return { applied: false, message: 'No schedulable task found for this conflict.' };
      }

      const task = tasks.find((item) => item.id === taskId);
      if (!task) {
        return { applied: false, message: 'Task not found.' };
      }

      const estimatedMinutes = Math.max(1, task.durationMinutes ?? 30);
      const now = Date.now();
      const windows = (get().data?.focusWindows ?? [])
        .slice()
        .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());

      const nextWindow = windows.find((window) => {
        const startMs = new Date(window.start).getTime();
        if (!Number.isFinite(startMs) || startMs < now) return false;
        return window.durationMinutes >= estimatedMinutes;
      });

      if (!nextWindow) {
        return { applied: false, message: 'No valid focus window is available for this task.' };
      }

      const startDate = new Date(nextWindow.start);
      const endDate = new Date(startDate.getTime() + estimatedMinutes * 60_000);
      const nextDate = toDateKey(nextWindow.start);
      const body = {
        scheduledStart: toHm(nextWindow.start),
        scheduledEnd: toHm(endDate.toISOString()),
        dueDate: nextDate,
        status: 'doing' as const,
      };

      const ok = await patchTask(taskId, body);
      if (!ok) {
        return { applied: false, message: 'Failed to resolve conflict.' };
      }

      taskStore.updateTask(taskId, body);
      set((state) => ({
        appliedRecommendationIds: addAppliedRecommendationId(state.appliedRecommendationIds, recommendation.id),
      }));

      return { applied: true, message: `Conflict resolved! Task moved to ${body.scheduledStart}.` };
    }

    if (recommendation.type === 'overload') {
      const taskStore = useTaskBoardStore.getState();
      const openTasks = taskStore.tasks.filter((task) => task.status !== 'done');
      const lowPriority = openTasks.filter((task) => task.priority === 'low');
      const targets = lowPriority.length > 0
        ? lowPriority
        : openTasks.filter((task) => task.priority === 'medium');

      if (targets.length === 0) {
        return { applied: false, message: 'No low or medium priority tasks are available to defer.' };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const patchBody = {
        dueDate: tomorrowKey,
        scheduledStart: null,
        scheduledEnd: null,
      };

      const results = await Promise.all(targets.map((task) => patchTask(task.id, patchBody)));
      const succeededIds = targets.filter((_, idx) => results[idx]).map((task) => task.id);

      if (succeededIds.length === 0) {
        return { applied: false, message: 'Failed to defer tasks.' };
      }

      for (const taskId of succeededIds) {
        taskStore.updateTask(taskId, patchBody);
      }

      set((state) => ({
        appliedRecommendationIds: addAppliedRecommendationId(state.appliedRecommendationIds, recommendation.id),
      }));

      return { applied: true, message: 'Overload prevented. Low priority tasks deferred to tomorrow.' };
    }

    if (recommendation.type === 'focus_window') {
      const parsed = parseFocusWindowRecommendation(recommendation, get().data);
      if (!parsed) {
        return { applied: false, message: 'No focus window could be inferred for this recommendation.' };
      }

      const startDate = new Date(parsed.startIso);
      const endDate = new Date(parsed.endIso);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
        return { applied: false, message: 'Invalid focus window times.' };
      }

      const eventBody = {
        title: 'Deep Work / Focus',
        date: toDateKey(parsed.startIso),
        startTime: toHm(parsed.startIso),
        endTime: toHm(parsed.endIso),
        source: 'lumina',
        provider: 'local',
        category: 'focus',
        color: '#4f46e5',
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody),
      });

      if (!res.ok) {
        return { applied: false, message: 'Failed to protect focus window.' };
      }

      const payload = (await res.json()) as { event?: Record<string, unknown> };
      if (payload.event) {
        pushEventIntoCalendarStore(localEventFromApi(payload.event));
      }

      set((state) => ({
        appliedRecommendationIds: addAppliedRecommendationId(state.appliedRecommendationIds, recommendation.id),
      }));

      return { applied: true, message: 'Focus window protected!' };
    }

    return { applied: false, message: 'This recommendation type cannot be auto-applied yet.' };
  },
}));
