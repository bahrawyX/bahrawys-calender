'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ContributionWeights,
  DEFAULT_CONTRIBUTION_WEIGHTS,
} from '@/types/performance';

export type ScoringSource = keyof ContributionWeights;

interface State {
  enabled: Record<ScoringSource, boolean>;
}

interface Actions {
  toggle: (key: ScoringSource) => void;
  reset: () => void;
}

const DEFAULT_ENABLED: Record<ScoringSource, boolean> = {
  completedTasks: true,
  focusSessions: true,
  scheduledEvents: true,
  completedEvents: true,
  completedPlannerItems: true,
};

export const useContributionSettingsStore = create<State & Actions>()(
  persist(
    (set) => ({
      enabled: DEFAULT_ENABLED,
      toggle: (key) =>
        set((s) => ({ enabled: { ...s.enabled, [key]: !s.enabled[key] } })),
      reset: () => set({ enabled: DEFAULT_ENABLED }),
    }),
    {
      name: 'lumina-contrib-settings',
      version: 1,
    },
  ),
);

export function selectEffectiveWeights(state: State): ContributionWeights {
  const { enabled } = state;
  return {
    completedTasks: enabled.completedTasks ? DEFAULT_CONTRIBUTION_WEIGHTS.completedTasks : 0,
    focusSessions: enabled.focusSessions ? DEFAULT_CONTRIBUTION_WEIGHTS.focusSessions : 0,
    scheduledEvents: enabled.scheduledEvents ? DEFAULT_CONTRIBUTION_WEIGHTS.scheduledEvents : 0,
    completedEvents: enabled.completedEvents ? DEFAULT_CONTRIBUTION_WEIGHTS.completedEvents : 0,
    completedPlannerItems: enabled.completedPlannerItems ? DEFAULT_CONTRIBUTION_WEIGHTS.completedPlannerItems : 0,
  };
}
