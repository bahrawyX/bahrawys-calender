import { create } from 'zustand';
import type { Achievement, FocusSessionResult } from '@/types';
import * as streakPersistence from '@/lib/persistence/streakPersistence';

interface StreakState {
  // NOTE: `coins` is NOT tracked here. Coin balance lives in useCoinsStore as
  // the single source of truth, rehydrated from GET /api/coins. Two stores
  // holding the same value produced divergent reads after a session.
  dailyStreak: number;
  bestDailyStreak: number;
  sessionStreak: number;
  bestSessionStreak: number;
  achievements: Achievement[];
  unseenAchievements: Achievement[];
  hydrated: boolean;
}

interface StreakActions {
  hydrateFromAPI: () => Promise<void>;
  applySessionResult: (result: FocusSessionResult) => void;
  markAchievementsSeen: () => void;
  setAchievements: (achievements: Achievement[]) => void;
}

// Streaks live exclusively in the DB. The previous `lumina-streaks` persist
// payload bled stale streak counts into a freshly-wiped account on the next
// login (the API returned null, the store kept the cached numbers). The
// persist middleware has been removed; `hydrateFromAPI` always overwrites
// — including resetting to zero when the user has no streak data yet.
export const useStreakStore = create<StreakState & StreakActions>((set) => ({
  dailyStreak: 0,
  bestDailyStreak: 0,
  sessionStreak: 0,
  bestSessionStreak: 0,
  achievements: [],
  unseenAchievements: [],
  hydrated: false,

  hydrateFromAPI: async () => {
    const data = await streakPersistence.fetchStreakData();
    if (data) {
      set({
        dailyStreak: data.dailyStreak,
        bestDailyStreak: data.bestDailyStreak,
        sessionStreak: data.sessionStreak,
        bestSessionStreak: data.bestSessionStreak,
        hydrated: true,
      });
    } else {
      // No DB data — reset to zero rather than keeping stale in-memory values.
      set({
        dailyStreak: 0,
        bestDailyStreak: 0,
        sessionStreak: 0,
        bestSessionStreak: 0,
        hydrated: true,
      });
    }
  },

  applySessionResult: (result: FocusSessionResult) => {
    const newAchievements: Achievement[] = result.newAchievements.map((a) => ({
      id: crypto.randomUUID?.() ?? Math.random().toString(36),
      userId: '',
      type: a.type,
      unlockedAt: a.unlockedAt,
      seen: false,
    }));

    set((s) => ({
      dailyStreak: result.dailyStreak,
      sessionStreak: result.sessionStreak,
      bestDailyStreak: Math.max(s.bestDailyStreak, result.dailyStreak),
      bestSessionStreak: Math.max(s.bestSessionStreak, result.sessionStreak),
      achievements: [...s.achievements, ...newAchievements],
      unseenAchievements: [...s.unseenAchievements, ...newAchievements],
    }));
  },

  markAchievementsSeen: () => {
    set((s) => ({
      achievements: s.achievements.map((a) => ({ ...a, seen: true })),
      unseenAchievements: [],
    }));
  },

  setAchievements: (achievements: Achievement[]) => {
    set({
      achievements,
      unseenAchievements: achievements.filter((a) => !a.seen),
    });
  },
}));
