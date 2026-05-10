import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

export type FocusPreference = 'morning' | 'midday' | 'evening' | 'none';
export type FocusSessionLength = '25/5' | '50/10' | '90/20' | 'custom';
export type FocusGoal =
  | 'deep-work'
  | 'better-scheduling'
  | 'reduce-switching'
  | 'daily-tracking';

export interface OnboardingState {
  completed: boolean;
  step: number;

  // Step 1 — About You
  userName: string;
  userRole: string;

  // Step 2 — Work Schedule
  workStart: string;       // e.g. "09:00"
  workEnd: string;         // e.g. "17:00"
  timezone: string;

  // Step 3 — Focus Preference
  focusPreference: FocusPreference;

  // Step 4 — Session Length
  focusSessionLength: FocusSessionLength;
  customFocusMinutes: number;
  customBreakMinutes: number;

  // Step 5 — Calendar Sync (independent per-provider booleans)
  googleConnected: boolean;
  microsoftConnected: boolean;

  // Step 6 — Goals
  focusGoals: FocusGoal[];

  // Actions
  setStep: (step: number) => void;
  setWorkSchedule: (start: string, end: string, tz?: string) => void;
  setFocusPreference: (pref: FocusPreference) => void;
  setFocusSessionLength: (len: FocusSessionLength, customMin?: number, customBreak?: number) => void;
  setUserInfo: (name: string, role: string) => void;
  setGoogleConnected: (connected: boolean) => void;
  setMicrosoftConnected: (connected: boolean) => void;
  toggleFocusGoal: (goal: FocusGoal) => void;
  complete: () => void;
  reset: () => void;
}

const DETECTED_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: false,
      step: 0,
      userName: '',
      userRole: '',
      workStart: '09:00',
      workEnd: '17:00',
      timezone: DETECTED_TZ,
      focusPreference: 'none',
      focusSessionLength: '50/10',
      customFocusMinutes: 60,
      customBreakMinutes: 15,
      googleConnected: false,
      microsoftConnected: false,
      focusGoals: [],

      setStep: (step) => set({ step }),
      setUserInfo: (name, role) => set({ userName: name, userRole: role }),
      setWorkSchedule: (start, end, tz) =>
        set({ workStart: start, workEnd: end, ...(tz ? { timezone: tz } : {}) }),
      setFocusPreference: (focusPreference) => set({ focusPreference }),
      setFocusSessionLength: (len, customMin, customBreak) =>
        set({
          focusSessionLength: len,
          ...(customMin !== undefined ? { customFocusMinutes: customMin } : {}),
          ...(customBreak !== undefined ? { customBreakMinutes: customBreak } : {}),
        }),
      setGoogleConnected: (connected) => set({ googleConnected: connected }),
      setMicrosoftConnected: (connected) => set({ microsoftConnected: connected }),
      toggleFocusGoal: (goal) => {
        const current = get().focusGoals;
        set({
          focusGoals: current.includes(goal)
            ? current.filter((g) => g !== goal)
            : [...current, goal],
        });
      },
      complete: () => set({ completed: true }),
      reset: () =>
        set({
          completed: false,
          step: 0,
          userName: '',
          userRole: '',
          workStart: '09:00',
          workEnd: '17:00',
          timezone: DETECTED_TZ,
          focusPreference: 'none',
          focusSessionLength: '50/10',
          customFocusMinutes: 60,
          customBreakMinutes: 15,
          googleConnected: false,
          microsoftConnected: false,
          focusGoals: [],
        }),
    }),
    {
      name: 'lumina-onboarding',
    }
  )
);

/**
 * Returns true once the persist middleware has finished reading localStorage.
 * Use this to gate any redirect logic so it never runs against the un-hydrated
 * default state (which always has `completed: false`).
 */
export function useOnboardingHydrated(): boolean {
  // Always start false on both server AND client to avoid hydration mismatch.
  // The effect fires only on the client after mount, checking if the store
  // has already hydrated from localStorage.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Already hydrated synchronously? Set immediately.
    if (useOnboardingStore.persist?.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Otherwise, wait for hydration to finish.
    const unsub = useOnboardingStore.persist?.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  return hydrated;
}
