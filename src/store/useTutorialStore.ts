import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  hasCompletedTutorial: boolean;
  hasSeenPrompt: boolean;
  startTutorial: () => void;
  nextStep: (totalSteps: number) => void;
  skipTutorial: () => void;
  dismissPrompt: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      isActive: false,
      currentStep: 0,
      hasCompletedTutorial: false,
      hasSeenPrompt: false,

      startTutorial: () =>
        set({ isActive: true, currentStep: 0, hasSeenPrompt: true }),

      nextStep: (totalSteps) =>
        set((s) => {
          if (s.currentStep >= totalSteps - 1) {
            return { isActive: false, hasCompletedTutorial: true, currentStep: 0 };
          }
          return { currentStep: s.currentStep + 1 };
        }),

      skipTutorial: () =>
        set({ isActive: false, hasCompletedTutorial: true, currentStep: 0 }),

      dismissPrompt: () =>
        set({ hasSeenPrompt: true }),
    }),
    {
      name: 'lumina-tutorial',
      partialize: (s) => ({
        hasCompletedTutorial: s.hasCompletedTutorial,
        hasSeenPrompt: s.hasSeenPrompt,
      }),
    },
  ),
);
