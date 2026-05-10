'use client';

/**
 * PersistenceBootstrap (standalone)
 *
 * The Lumina app version hydrates ~10 stores from REST endpoints. This
 * standalone version has no backend, so we just flip every store's
 * `dbHydrated` flag to true with whatever localStorage gave us. Without
 * this, the loading overlays in AppShell-style components stay up forever.
 */

import { useEffect, useRef } from 'react';
import { useCalendarEventsStore } from '@/store/useCalendarEventsStore';
import { useTaskBoardStore } from '@/store/useTaskBoardStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useDailyPlanStore } from '@/store/useDailyPlanStore';
import { useDocsStore } from '@/store/useDocsStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useCoinsStore } from '@/store/useCoinsStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import * as eventsPersistence from '@/lib/persistence/eventsPersistence';

export { migrateMany as migrateEventsMany } from '@/lib/persistence/eventsPersistence';
export { migrateMany as migrateTasksMany } from '@/lib/persistence/tasksPersistence';
export { migrateMany as migratePlannerMany } from '@/lib/persistence/plannerPersistence';
export { migrateMany as migrateFocusMany } from '@/lib/persistence/focusPersistence';

const STANDALONE_USER_ID = 'standalone-user';

function safeCall(fn: () => void) {
  try { fn(); } catch { /* store not present or signature mismatch */ }
}

export default function PersistenceBootstrap() {
  const hasRun = useRef(false);

  const hydrateEvents = useCalendarEventsStore((s) => s.hydrateFromDb);
  const setEventsUserId = useCalendarEventsStore((s) => s.setUserId);
  const eventsHydrated = useCalendarEventsStore((s) => s.dbHydrated);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    setEventsUserId(STANDALONE_USER_ID);
    safeCall(() => useTaskBoardStore.getState().setUserId?.(STANDALONE_USER_ID));
    safeCall(() => useFocusStore.getState().setUserId?.(STANDALONE_USER_ID));

    if (!eventsHydrated) {
      eventsPersistence
        .fetchAllForCurrentUser()
        .then((events) => hydrateEvents(events))
        .catch(() => hydrateEvents([]));
    }

    safeCall(() => useTaskBoardStore.getState().hydrateFromDb([]));
    safeCall(() => useFocusStore.getState().hydrateFromDb([]));
    safeCall(() => useDailyPlanStore.getState().hydrateFromDb([]));
    safeCall(() => useDocsStore.getState().hydrateFromDb([]));
    safeCall(() => useGoalsStore.getState().hydrateFromDb([]));
    safeCall(() => useAchievementsStore.getState().hydrateFromDb([]));
    safeCall(() =>
      useCoinsStore.getState().hydrateFromDb({
        balance: 0,
        purchases: [],
        activeCosmetic: null,
        activeMascot: null,
        activeBadge: null,
        activeWallpaper: null,
        consumables: { focus_boost: 0, streak_freeze: 0, mascot_treat: 0, gradient_grant: 0 },
        transactions: [],
      } as any)
    );
    safeCall(() => useSettingsStore.getState().hydratePreferencesFromDb({}));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
