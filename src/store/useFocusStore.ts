import { create } from 'zustand';
import * as focusPersistence from '@/lib/persistence/focusPersistence';
import { uid } from '@/lib/uid';
import type { FocusSessionResult } from '@/types';
// Sibling stores — imported for .getState() calls only; no circular dep risk
// since neither streakStore nor coinsStore imports useFocusStore.
import { useStreakStore } from '@/store/useStreakStore';
import { useCoinsStore } from '@/store/useCoinsStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string | null;
  startTime: string;   // ISO
  endTime: string;     // ISO — set on finish/cancel
  duration: number;    // seconds actually elapsed
  completed: boolean;
}

export type TimerState = 'idle' | 'running' | 'paused';

interface ActiveSession {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;   // ISO — wall-clock start of first run
  totalDurationSecs: number;   // target (default 1500)
  /** Seconds elapsed before the current run segment started */
  elapsedBeforePause: number;
  /** Performance.now() timestamp when the current run segment began; null when paused */
  runStartedAt: number | null;
}

interface FocusState {
  activeSession: ActiveSession | null;
  timerState: TimerState;
  sessionHistory: FocusSession[];
  dbHydrated: boolean;
  userId: string | null;
}

interface FocusActions {
  hydrateFromDb: (sessions: FocusSession[]) => void;
  hydrateFromDbFailed: () => void;
  setUserId: (userId: string) => void;
  startSession: (taskId: string, taskTitle: string, durationSecs?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: () => void;
  cancelSession: () => void;
  /**
   * Drop an orphaned activeSession without logging. Used when a persisted
   * `lumina_focus_active_session` is restored but the pomodoro timer that
   * should be driving it isn't running — e.g. after a reload on a different
   * tab, or after the pomodoro was stopped in a sibling store. Does NOT write
   * a sessionHistory record; the session is treated as never-happened.
   */
  clearActiveSession: () => void;
  /** Read-only — called by the timer component to get current elapsed seconds without setState */
  getElapsedSecs: () => number;
}

// ── Persistence helpers ───────────────────────────────────────────────────────

const ACTIVE_SESSION_KEY = 'lumina_focus_active_session';

type PersistedActiveSession = Omit<ActiveSession, 'runStartedAt'> & { wallClockStart: number; timerState: TimerState };

function saveActiveSession(session: ActiveSession | null, timerState: TimerState): void {
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    const { runStartedAt: _, ...rest } = session;
    const payload: PersistedActiveSession = {
      ...rest,
      wallClockStart: Date.now(),
      timerState,
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(payload));
  } catch { /* quota — swallow */ }
}

function loadActiveSession(): { session: ActiveSession; timerState: TimerState } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedActiveSession;
    if (!p.id || !p.taskId) return null;
    // Compute elapsed from wall clock so timer resumes at the correct position
    const wallElapsed = p.timerState === 'running' ? (Date.now() - p.wallClockStart) / 1000 : 0;
    const session: ActiveSession = {
      id: p.id,
      taskId: p.taskId,
      taskTitle: p.taskTitle,
      startTime: p.startTime,
      totalDurationSecs: p.totalDurationSecs,
      elapsedBeforePause: p.elapsedBeforePause + wallElapsed,
      runStartedAt: null, // always restore as paused so performance.now() is re-anchored on resume
    };
    return { session, timerState: 'paused' };
  } catch {
    return null;
  }
}

// Session history is persisted exclusively in the DB now. The previous
// `lumina_focus_sessions_*` cache leaked focus history across logouts and
// resurrected sessions after a DB wipe, so it has been removed.

// ── Post-session sync ─────────────────────────────────────────────────────────

/**
 * After a focus session is saved to the DB, apply the server-returned result
 * to the streak and coin stores. Called from finishSession and cancelSession.
 * The server response includes the authoritative streak values and the new
 * coin balance (from the DB transaction). Bonus coin awards are fire-and-forget
 * on the server; invalidateBalance debounces a refetch to catch them.
 */
function applyFocusResult(result: FocusSessionResult | null): void {
  if (!result || result.underThreshold) {
    // Session was under-threshold or request failed — still invalidate so
    // the UI doesn't show a stale balance.
    useCoinsStore.getState().invalidateBalance();
    return;
  }
  // Apply authoritative streak values from DB
  useStreakStore.getState().applySessionResult(result);
  // Immediately reflect the DB-transaction balance, then re-fetch to pick
  // up any async bonus awards that committed after the main transaction.
  useCoinsStore.getState().setBalance(result.newCoins);
  useCoinsStore.getState().invalidateBalance();
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFocusStore = create<FocusState & FocusActions>((set, get) => ({
  // Active session is ephemeral timer state — safe to restore from localStorage for page-reload resume.
  ...(() => {
    const restored = typeof window !== 'undefined' ? loadActiveSession() : null;
    return {
      activeSession: restored?.session ?? null,
      timerState: (restored?.timerState ?? 'idle') as TimerState,
    };
  })(),
  // DB is the source of truth for session history — start empty, never read localStorage on init.
  sessionHistory: [],
  dbHydrated: false,
  userId: null,

  setUserId: (userId) => {
    set({ userId });
  },

  hydrateFromDb(sessions) {
    if (get().dbHydrated) return;
    set({ dbHydrated: true, sessionHistory: sessions });
  },

  hydrateFromDbFailed() {
    if (get().dbHydrated) return;
    // No localStorage fallback — DB is source of truth.
    set({ dbHydrated: true, sessionHistory: [] });
  },


  startSession(taskId, taskTitle, durationSecs = 25 * 60) {
    // Guard: if a session is already running, do nothing to prevent accidental loss
    if (get().activeSession) return;
    const session: ActiveSession = {
      id: uid(),
      taskId,
      taskTitle,
      startTime: new Date().toISOString(),
      totalDurationSecs: durationSecs,
      elapsedBeforePause: 0,
      runStartedAt: performance.now(),
    };
    set({ activeSession: session, timerState: 'running' });
    saveActiveSession(session, 'running');
  },

  pauseSession() {
    const { activeSession, timerState } = get();
    if (!activeSession || timerState !== 'running') return;
    const nowPerf = performance.now();
    const segmentSecs = activeSession.runStartedAt !== null
      ? (nowPerf - activeSession.runStartedAt) / 1000
      : 0;
    set({
      timerState: 'paused',
      activeSession: {
        ...activeSession,
        elapsedBeforePause: activeSession.elapsedBeforePause + segmentSecs,
        runStartedAt: null,
      },
    });
    saveActiveSession({ ...activeSession, elapsedBeforePause: activeSession.elapsedBeforePause + segmentSecs, runStartedAt: null }, 'paused');
  },

  resumeSession() {
    const { activeSession, timerState } = get();
    if (!activeSession || timerState !== 'paused') return;
    set({
      timerState: 'running',
      activeSession: { ...activeSession, runStartedAt: performance.now() },
    });
    saveActiveSession({ ...activeSession, runStartedAt: null }, 'running');
  },

  finishSession() {
    const { activeSession } = get();
    if (!activeSession) return;
    const elapsed = get().getElapsedSecs();
    const record: FocusSession = {
      id: activeSession.id,
      taskId: activeSession.taskId,
      taskTitle: activeSession.taskTitle,
      startTime: activeSession.startTime,
      endTime: new Date().toISOString(),
      duration: Math.round(elapsed),
      completed: true,
    };
    const history = [record, ...get().sessionHistory];
    set({ activeSession: null, timerState: 'idle', sessionHistory: history });
    saveActiveSession(null, 'idle');
    // Persist to DB then apply the server's authoritative streak + coin values.
    focusPersistence.createOne(record)
      .then(applyFocusResult)
      .catch(() => useCoinsStore.getState().invalidateBalance());
  },

  cancelSession() {
    const { activeSession } = get();
    if (!activeSession) return;
    const elapsed = get().getElapsedSecs();
    if (elapsed >= 60) {
      // Only log if at least 1 minute was spent
      const record: FocusSession = {
        id: activeSession.id,
        taskId: activeSession.taskId,
        taskTitle: activeSession.taskTitle,
        startTime: activeSession.startTime,
        endTime: new Date().toISOString(),
        duration: Math.round(elapsed),
        completed: false,
      };
      const history = [record, ...get().sessionHistory];
      set({ activeSession: null, timerState: 'idle', sessionHistory: history });
      saveActiveSession(null, 'idle');
      // Persist to DB then apply the server's authoritative streak + coin values.
      focusPersistence.createOne(record)
        .then(applyFocusResult)
        .catch(() => useCoinsStore.getState().invalidateBalance());
    } else {
      set({ activeSession: null, timerState: 'idle' });
      saveActiveSession(null, 'idle');
    }
  },

  clearActiveSession() {
    if (!get().activeSession) return;
    set({ activeSession: null, timerState: 'idle' });
    saveActiveSession(null, 'idle');
  },

  getElapsedSecs() {
    const { activeSession, timerState } = get();
    if (!activeSession) return 0;
    const base = activeSession.elapsedBeforePause;
    if (timerState === 'running' && activeSession.runStartedAt !== null) {
      return base + (performance.now() - activeSession.runStartedAt) / 1000;
    }
    return base;
  },
}));
