'use client';

import { create } from 'zustand';

export interface Achievement {
  id: string;
  type: string;
  unlockedAt: string;
  seen: boolean;
}

interface AchievementsState {
  achievements: Achievement[];
  dbHydrated: boolean;

  hydrateFromDb: (data: Achievement[]) => void;
  hydrateFromDbFailed: () => void;
  addNew: (achievement: Achievement) => void;
  markSeen: (ids: string[]) => void;
  unseenCount: () => number;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [],
  dbHydrated: false,

  hydrateFromDb: (data) => {
    if (get().dbHydrated) return;
    set({ achievements: data, dbHydrated: true });
  },

  hydrateFromDbFailed: () => {
    if (get().dbHydrated) return;
    set({ dbHydrated: true });
  },

  addNew: (achievement) => {
    set((s) => ({
      achievements: s.achievements.some((a) => a.id === achievement.id)
        ? s.achievements
        : [achievement, ...s.achievements],
    }));
  },

  markSeen: (ids) => {
    const idSet = new Set(ids);
    set((s) => ({
      achievements: s.achievements.map((a) =>
        idSet.has(a.id) ? { ...a, seen: true } : a
      ),
    }));
    void fetch('/api/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
  },

  unseenCount: () => get().achievements.filter((a) => !a.seen).length,
}));
