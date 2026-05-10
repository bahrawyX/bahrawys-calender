import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent } from '../types';

interface PlannerState {
  /** Microsoft/Outlook events — fetched from provider API, browser-cached only. NOT in DB. */
  outlookEvents: CalendarEvent[];
  /** Google Calendar events — fetched from provider API, browser-cached only. NOT in DB. */
  googleEvents: CalendarEvent[];
  /** Apple Calendar events — fetched via CalDAV, browser-cached only. NOT in DB. */
  appleEvents: CalendarEvent[];
  /** Session-only demo events for built-in contexts (Critical/Focus/Work/Social/Personal/Health). */
  demoLocalEvents: CalendarEvent[];
  outlookConnected: boolean;
  googleConnected: boolean;
  appleConnected: boolean;
  outlookSyncing: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;

  setOutlookEvents: (events: CalendarEvent[]) => void;
  setGoogleEvents:  (events: CalendarEvent[]) => void;
  setAppleEvents:   (events: CalendarEvent[]) => void;
  setDemoLocalEvents: (events: CalendarEvent[]) => void;
  setOutlookConnected: (connected: boolean) => void;
  setGoogleConnected:  (connected: boolean) => void;
  setAppleConnected:   (connected: boolean) => void;
  setOutlookSyncing:   (syncing: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (iso: string | null) => void;
  setSyncError: (message: string | null) => void;
  /** Clear all in-memory external event arrays (call on signout or provider disconnect). */
  clearExternalEvents: () => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      outlookEvents: [],
      googleEvents:  [],
      appleEvents:   [],
      demoLocalEvents: [],
      outlookConnected: false,
      googleConnected:  false,
      appleConnected:   false,
      outlookSyncing:   false,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      setOutlookEvents:    (outlookEvents)    => set({ outlookEvents }),
      setGoogleEvents:     (googleEvents)     => set({ googleEvents }),
      setAppleEvents:      (appleEvents)      => set({ appleEvents }),
      setDemoLocalEvents:  (demoLocalEvents)  => set({ demoLocalEvents }),
      setOutlookConnected: (outlookConnected) => set({ outlookConnected }),
      setGoogleConnected:  (googleConnected)  => set({ googleConnected }),
      setAppleConnected:   (appleConnected)   => set({ appleConnected }),
      setOutlookSyncing:   (outlookSyncing)   => set({ outlookSyncing }),
      setIsSyncing:        (isSyncing)        => set({ isSyncing }),
      setLastSyncedAt:     (lastSyncedAt)     => set({ lastSyncedAt }),
      setSyncError:        (syncError)        => set({ syncError }),
      clearExternalEvents: () => set({ outlookEvents: [], googleEvents: [], appleEvents: [] }),
    }),
    {
      name: 'lumina-planner',
      // Explicit return type guarantees event arrays can NEVER accidentally
      // be added to localStorage persistence in a future edit.
      partialize: (state): { outlookConnected: boolean; googleConnected: boolean; appleConnected: boolean } => ({
        outlookConnected: state.outlookConnected,
        googleConnected: state.googleConnected,
        appleConnected: state.appleConnected,
      }),
    }
  )
);
