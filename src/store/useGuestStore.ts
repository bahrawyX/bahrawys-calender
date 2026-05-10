import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestState {
  /** True while the user is operating in guest (unauthenticated) mode. */
  isGuest: boolean;
  /** Whether the in-app warning banner has been manually dismissed. */
  bannerDismissed: boolean;

  setGuest: (value: boolean) => void;
  dismissBanner: () => void;
  /**
   * Clears guest mode entirely — call on sign-in, sign-up, or sign-out so
   * a returning authenticated user never inherits a stale guest flag.
   */
  clearGuestSession: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      bannerDismissed: false,

      setGuest: (value) => set({ isGuest: value, bannerDismissed: false }),
      dismissBanner: () => set({ bannerDismissed: true }),
      clearGuestSession: () => set({ isGuest: false, bannerDismissed: false }),
    }),
    {
      name: 'lumina-guest',
      partialize: (s) => ({
        isGuest: s.isGuest,
        bannerDismissed: s.bannerDismissed,
      }),
    },
  ),
);
