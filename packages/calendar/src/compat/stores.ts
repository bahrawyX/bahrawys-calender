/**
 * Store compatibility layer — singleton stores for use outside of React context.
 *
 * The package's stores are created via factory functions (createEventsStore, etc.)
 * and accessed via <BahrawyCalendarProvider> + useCalendarContext(). But the
 * existing view components import stores directly as singletons:
 *
 *   import { useCalendarStore } from '../store/useCalendarStore';
 *
 * This module provides those singletons so view components work with
 * minimal import path changes. The singletons are initialized by
 * <BahrawyCalendarProvider> on first mount.
 *
 * USAGE IN VIEW COMPONENTS:
 *   Replace:  import { useCalendarStore } from '../store/useCalendarStore';
 *   With:     import { useCalendarStore } from 'bahrawy-calendar/compat';
 */

import type { StoreApi, UseBoundStore } from 'zustand';
import type { CalendarUIState, CalendarEventsState, DragStoreState } from '../core/store/types';

// ── Singleton references ────────────────────────────────────────────────────
// These are set by BahrawyCalendarProvider on mount. Before that, calling
// them throws a helpful error.

let _calendarStore: UseBoundStore<StoreApi<CalendarUIState>> | null = null;
let _eventsStore: UseBoundStore<StoreApi<CalendarEventsState>> | null = null;
let _dragStore: UseBoundStore<StoreApi<DragStoreState>> | null = null;

export function __setStores(
  calendar: UseBoundStore<StoreApi<CalendarUIState>>,
  events: UseBoundStore<StoreApi<CalendarEventsState>>,
  drag: UseBoundStore<StoreApi<DragStoreState>>,
) {
  _calendarStore = calendar;
  _eventsStore = events;
  _dragStore = drag;
}

function assertStore<T>(store: T | null, name: string): T {
  if (!store) {
    throw new Error(
      `bahrawy-calendar: ${name} is not initialized. ` +
      'Make sure <BahrawyCalendarProvider> is rendered above your calendar components.',
    );
  }
  return store;
}

/**
 * Drop-in replacement for `useCalendarStore` from the original app.
 * Use exactly like the original: `useCalendarStore(s => s.view)`
 */
export function useCalendarStore<T>(selector: (state: CalendarUIState) => T): T {
  const store = assertStore(_calendarStore, 'useCalendarStore');
  return store(selector);
}

// Also expose the store itself for .getState() usage
useCalendarStore.getState = () => assertStore(_calendarStore, 'useCalendarStore').getState();
useCalendarStore.setState = (partial: Partial<CalendarUIState>) =>
  assertStore(_calendarStore, 'useCalendarStore').setState(partial);
useCalendarStore.subscribe = (listener: (state: CalendarUIState) => void) =>
  assertStore(_calendarStore, 'useCalendarStore').subscribe(listener);

/**
 * Drop-in replacement for `useCalendarEventsStore`.
 */
export function useCalendarEventsStore<T>(selector: (state: CalendarEventsState) => T): T {
  const store = assertStore(_eventsStore, 'useCalendarEventsStore');
  return store(selector);
}

useCalendarEventsStore.getState = () => assertStore(_eventsStore, 'useCalendarEventsStore').getState();
useCalendarEventsStore.setState = (partial: Partial<CalendarEventsState>) =>
  assertStore(_eventsStore, 'useCalendarEventsStore').setState(partial);
useCalendarEventsStore.subscribe = (listener: (state: CalendarEventsState) => void) =>
  assertStore(_eventsStore, 'useCalendarEventsStore').subscribe(listener);

/**
 * Drop-in replacement for `useDragStore`.
 */
export function useDragStore<T>(selector: (state: DragStoreState) => T): T {
  const store = assertStore(_dragStore, 'useDragStore');
  return store(selector);
}

// For the destructured pattern: const { dragState, startDrag, ... } = useDragStore();
// We need to support calling without a selector too.
export function useDragStoreRaw(): DragStoreState {
  const store = assertStore(_dragStore, 'useDragStore');
  return store((s) => s);
}

useDragStore.getState = () => assertStore(_dragStore, 'useDragStore').getState();
useDragStore.setState = (partial: Partial<DragStoreState>) =>
  assertStore(_dragStore, 'useDragStore').setState(partial);
useDragStore.subscribe = (listener: (state: DragStoreState) => void) =>
  assertStore(_dragStore, 'useDragStore').subscribe(listener);
