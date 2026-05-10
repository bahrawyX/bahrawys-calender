'use client';

import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

export interface PomodoroState {
  // Timer state
  phase: PomodoroPhase;
  isRunning: boolean;
  isPaused: boolean;
  sessionCount: number; // completed work sessions in current cycle

  // Wall-clock anchors (persist across unmount)
  /** ISO string when the current phase started ticking */
  phaseStartedAt: string | null;
  /** Seconds already elapsed before pausing (accumulated across pauses) */
  elapsedBeforePause: number;
  /** ISO string when the work session started (for onSessionComplete callback) */
  workSessionStartedAt: string | null;

  // Settings (local to pomodoro, synced from settings store on init)
  workMins: number;
  shortBreakMins: number;
  longBreakMins: number;
  sessionsPerCycle: number;

  // Completion celebration
  showCelebration: boolean;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  /** Stop the current timer but keep cycle progress (phase + sessionCount). */
  softReset: () => void;
  tick: () => { completed: boolean; phase: PomodoroPhase };
  setWorkMins: (mins: number) => void;
  setShortBreakMins: (mins: number) => void;
  setLongBreakMins: (mins: number) => void;
  setSessionsPerCycle: (n: number) => void;
  dismissCelebration: () => void;
  hydrateFromDb: (shortBreakMins: number, longBreakMins: number, sessionsPerCycle: number, workMins?: number) => void;

  // Derived helpers
  getElapsedSecs: () => number;
  getPhaseDurationSecs: () => number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lumina_pomodoro_state';

function phaseDuration(phase: PomodoroPhase, workMins: number, shortBreakMins: number, longBreakMins: number): number {
  if (phase === 'work') return workMins * 60;
  if (phase === 'short_break') return shortBreakMins * 60;
  return longBreakMins * 60;
}

/** Persist essential state to localStorage so it survives page reloads. */
function persist(state: Partial<PomodoroState>) {
  try {
    const data = {
      phase: state.phase,
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      sessionCount: state.sessionCount,
      phaseStartedAt: state.phaseStartedAt,
      elapsedBeforePause: state.elapsedBeforePause,
      workSessionStartedAt: state.workSessionStartedAt,
      workMins: state.workMins,
      shortBreakMins: state.shortBreakMins,
      longBreakMins: state.longBreakMins,
      sessionsPerCycle: state.sessionsPerCycle,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* noop */ }
}

function loadPersisted(): Partial<PomodoroState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * PATCH /api/users/preferences with the given partial body. On HTTP failure
 * or network error, run the supplied rollback so the store + localStorage
 * cache revert to the prior value. Used by all four pomodoro setters so the
 * UI never silently diverges from the DB.
 */
function patchPreferenceWithRollback(body: Record<string, unknown>, rollback: () => void): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/users/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then((res) => { if (!res.ok) rollback(); })
    .catch(() => rollback());
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePomodoroStore = create<PomodoroState>((set, get) => {
  // Try to restore from localStorage
  const saved = typeof window !== 'undefined' ? loadPersisted() : null;

  return {
    // Restored or default values
    phase: (saved?.phase as PomodoroPhase) ?? 'work',
    isRunning: saved?.isRunning ?? false,
    isPaused: saved?.isPaused ?? false,
    sessionCount: saved?.sessionCount ?? 0,
    phaseStartedAt: saved?.phaseStartedAt ?? null,
    elapsedBeforePause: saved?.elapsedBeforePause ?? 0,
    workSessionStartedAt: saved?.workSessionStartedAt ?? null,
    workMins: saved?.workMins ?? 25,
    shortBreakMins: saved?.shortBreakMins ?? 5,
    longBreakMins: saved?.longBreakMins ?? 20,
    sessionsPerCycle: saved?.sessionsPerCycle ?? 4,
    showCelebration: false,

    getElapsedSecs: () => {
      const s = get();
      if (!s.isRunning || s.isPaused || !s.phaseStartedAt) {
        return s.elapsedBeforePause;
      }
      const wallElapsed = (Date.now() - new Date(s.phaseStartedAt).getTime()) / 1000;
      return s.elapsedBeforePause + wallElapsed;
    },

    getPhaseDurationSecs: () => {
      const s = get();
      return phaseDuration(s.phase, s.workMins, s.shortBreakMins, s.longBreakMins);
    },

    start: () => {
      const s = get();
      const now = new Date().toISOString();
      set({
        isRunning: true,
        isPaused: false,
        phaseStartedAt: now,
        elapsedBeforePause: 0,
        workSessionStartedAt: s.phase === 'work' ? now : s.workSessionStartedAt,
      });
      persist(get());
    },

    pause: () => {
      const s = get();
      if (!s.isRunning || s.isPaused) return;
      // Capture elapsed time before pausing
      const elapsed = s.getElapsedSecs();
      set({
        isPaused: true,
        phaseStartedAt: null,
        elapsedBeforePause: elapsed,
      });
      persist(get());
    },

    resume: () => {
      const s = get();
      if (!s.isRunning || !s.isPaused) return;
      set({
        isPaused: false,
        phaseStartedAt: new Date().toISOString(),
      });
      persist(get());
    },

    skip: () => {
      const s = get();
      // Advance phase without completing work session
      let nextPhase: PomodoroPhase = 'work';
      let nextSessionCount = s.sessionCount;

      if (s.phase === 'work') {
        nextSessionCount = s.sessionCount + 1;
        if (nextSessionCount >= s.sessionsPerCycle) {
          nextPhase = 'long_break';
          nextSessionCount = 0;
        } else {
          nextPhase = 'short_break';
        }
      } else {
        nextPhase = 'work';
      }

      set({
        phase: nextPhase,
        isRunning: false,
        isPaused: false,
        sessionCount: nextSessionCount,
        phaseStartedAt: null,
        elapsedBeforePause: 0,
        workSessionStartedAt: null,
      });
      persist(get());
    },

    reset: () => {
      set({
        phase: 'work',
        isRunning: false,
        isPaused: false,
        sessionCount: 0,
        phaseStartedAt: null,
        elapsedBeforePause: 0,
        workSessionStartedAt: null,
        showCelebration: false,
      });
      persist(get());
    },

    /**
     * Stop the current timer but keep phase + sessionCount intact.
     * Used by the "Stop session" button so a user on session 3 of 4 doesn't
     * lose cycle progress when they stop a single work phase. A full cycle
     * reset is still available via reset().
     */
    softReset: () => {
      set({
        isRunning: false,
        isPaused: false,
        phaseStartedAt: null,
        elapsedBeforePause: 0,
        workSessionStartedAt: null,
        showCelebration: false,
      });
      persist(get());
    },

    /**
     * Called every second by the active ticker (PomodoroView or FloatingWidget).
     * Returns whether the phase just completed.
     */
    tick: () => {
      const s = get();
      if (!s.isRunning || s.isPaused) return { completed: false, phase: s.phase };

      const elapsed = s.getElapsedSecs();
      const duration = s.getPhaseDurationSecs();

      if (elapsed >= duration) {
        // Phase completed — advance
        const completedPhase = s.phase;
        let nextPhase: PomodoroPhase = 'work';
        let nextSessionCount = s.sessionCount;

        if (s.phase === 'work') {
          nextSessionCount = s.sessionCount + 1;
          if (nextSessionCount >= s.sessionsPerCycle) {
            nextPhase = 'long_break';
            nextSessionCount = 0;
          } else {
            nextPhase = 'short_break';
          }
        } else {
          nextPhase = 'work';
        }

        set({
          phase: nextPhase,
          isRunning: false,
          isPaused: false,
          sessionCount: nextSessionCount,
          phaseStartedAt: null,
          elapsedBeforePause: 0,
          // Preserve workSessionStartedAt when a work phase completes so the
          // celebration useEffect in PomodoroView can still read it and POST
          // the session to /api/focus-sessions. Cleared in dismissCelebration.
          workSessionStartedAt: completedPhase === 'work' ? s.workSessionStartedAt : null,
          showCelebration: completedPhase === 'work',
        });
        persist(get());

        return { completed: true, phase: completedPhase };
      }

      return { completed: false, phase: s.phase };
    },

    setWorkMins: (mins: number) => {
      const clamped = Math.max(1, Math.min(240, mins));
      const previous = get().workMins;
      set({ workMins: clamped });
      persist(get());
      patchPreferenceWithRollback({ focusSessionLength: clamped }, () => {
        set({ workMins: previous });
        persist(get());
      });
    },

    setShortBreakMins: (mins: number) => {
      const clamped = Math.max(1, Math.min(30, mins));
      const previous = get().shortBreakMins;
      set({ shortBreakMins: clamped });
      persist(get());
      patchPreferenceWithRollback({ shortBreakMins: clamped }, () => {
        set({ shortBreakMins: previous });
        persist(get());
      });
    },

    setLongBreakMins: (mins: number) => {
      const clamped = Math.max(5, Math.min(60, mins));
      const previous = get().longBreakMins;
      set({ longBreakMins: clamped });
      persist(get());
      patchPreferenceWithRollback({ longBreakMins: clamped }, () => {
        set({ longBreakMins: previous });
        persist(get());
      });
    },

    setSessionsPerCycle: (n: number) => {
      const clamped = Math.max(1, Math.min(10, n));
      const previous = get().sessionsPerCycle;
      set({ sessionsPerCycle: clamped });
      persist(get());
      patchPreferenceWithRollback({ sessionsPerCycle: clamped }, () => {
        set({ sessionsPerCycle: previous });
        persist(get());
      });
    },

    hydrateFromDb: (shortBreakMins, longBreakMins, sessionsPerCycle, workMins) => {
      const s = get();
      if (s.isRunning) return;
      set({
        shortBreakMins: Math.max(1, Math.min(30, shortBreakMins)),
        longBreakMins: Math.max(5, Math.min(60, longBreakMins)),
        sessionsPerCycle: Math.max(1, Math.min(10, sessionsPerCycle)),
        // When the preferences API provides a canonical focusSessionLength, prefer
        // it over whatever localStorage restored so the user sees one number
        // across devices. Only applied when timer is idle (guard above).
        ...(typeof workMins === 'number'
          ? { workMins: Math.max(1, Math.min(240, workMins)) }
          : {}),
      });
      persist(get());
    },

    dismissCelebration: () => {
      set({ showCelebration: false, workSessionStartedAt: null });
      persist(get());
    },
  };
});
