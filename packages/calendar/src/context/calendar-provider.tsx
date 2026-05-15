/**
 * BahrawyCalendarProvider — wraps the calendar in context with stores + config.
 *
 * Usage:
 *   <BahrawyCalendarProvider>
 *     <YourCalendarUI />
 *   </BahrawyCalendarProvider>
 *
 * Or with custom config:
 *   <BahrawyCalendarProvider
 *     persistence={{ adapter: mySupabaseAdapter }}
 *     notify={(msg) => toast(msg)}
 *   >
 *     <YourCalendarUI />
 *   </BahrawyCalendarProvider>
 */

'use client';

import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { CalendarContext } from './calendar-context';
import type { CalendarContextValue, CalendarConfig } from './calendar-context';
import { ViewType } from '../types';
import type { CalendarEvent, NotifyFn, CalendarLifecycleCallbacks } from '../types';
import type { PersistenceAdapter } from '../core/persistence/types';
import type { IntegrationsConfig } from '../integrations/types';
import { useIntegrations } from '../integrations/use-integrations';
import { LocalStorageAdapter } from '../core/persistence/local-storage-adapter';
import { initRecurrence } from '../core/recurrence/rrule-engine';
import { createEventsStore } from '../core/store/events-store';
import { createCalendarStore } from '../core/store/calendar-store';
import { createDragStore } from '../core/store/drag-store';
import { setNotifyFn } from '../core/utils/notify';
import { __setStores } from '../compat/stores';

// ── Default no-op notify ────────────────────────────────────────────────────
const noopNotify: NotifyFn = () => {};

// ── Props ───────────────────────────────────────────────────────────────────
export interface BahrawyCalendarProviderProps {
  children: React.ReactNode;

  /** Custom persistence adapter. Default: LocalStorageAdapter */
  persistence?: PersistenceAdapter;

  /** Notification function (e.g. Sonner's toast). Default: no-op */
  notify?: NotifyFn;

  /** Default view on mount (enum or string: 'month' | 'week' | 'day') */
  defaultView?: ViewType | 'month' | 'week' | 'day';

  /** Initial date on mount */
  initialDate?: Date;

  /** External provider events (read-only overlay) */
  externalEvents?: {
    google?: CalendarEvent[];
    outlook?: CalendarEvent[];
    apple?: CalendarEvent[];
  };

  /** Feature flags */
  enableRecurrence?: boolean;
  enableDragAndDrop?: boolean;
  enableConflictDetection?: boolean;
  enableKeyboardShortcuts?: boolean;

  /** Lifecycle callbacks */
  callbacks?: CalendarLifecycleCallbacks;

  /** Provider integrations — Google Calendar, Outlook (handles OAuth + event fetching) */
  integrations?: IntegrationsConfig;
}

export function BahrawyCalendarProvider({
  children,
  persistence,
  notify: notifyProp,
  defaultView,
  initialDate,
  externalEvents: externalEventsProp,
  enableRecurrence = true,
  enableDragAndDrop = true,
  enableConflictDetection = true,
  enableKeyboardShortcuts = true,
  callbacks,
  integrations: integrationsConfig,
}: BahrawyCalendarProviderProps) {
  const notifyFn = notifyProp ?? noopNotify;
  const persistenceAdapter = useMemo(
    () => persistence ?? new LocalStorageAdapter(),
    [persistence],
  );

  // Create stores once (stable references across re-renders)
  const storesRef = useRef<CalendarContextValue['useCalendarStore'] | null>(null);
  const eventsRef = useRef<CalendarContextValue['useEventsStore'] | null>(null);
  const dragRef = useRef<CalendarContextValue['useDragStore'] | null>(null);

  if (!storesRef.current) {
    storesRef.current = createCalendarStore({
      defaultView,
      initialDate,
      callbacks,
    });
  }

  if (!eventsRef.current) {
    eventsRef.current = createEventsStore({
      persistence: persistenceAdapter,
      notify: notifyFn,
      callbacks,
    });
  }

  if (!dragRef.current) {
    dragRef.current = createDragStore(() => eventsRef.current!.getState());
  }

  // Set the global notify function + register compat singletons
  useEffect(() => {
    setNotifyFn(notifyFn);
    __setStores(storesRef.current!, eventsRef.current!, dragRef.current!);
  }, [notifyFn]);

  // Auto-load rrule when recurrence is enabled
  useEffect(() => {
    if (enableRecurrence) {
      initRecurrence().catch(() => {
        // Silently ignore — rrule is an optional peer dep.
        // Users will get a clear error if they call a recurrence function without it.
      });
    }
  }, [enableRecurrence]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      const store = storesRef.current!;
      const events = eventsRef.current!;
      const state = store.getState();

      // Ctrl/Cmd + Z = Undo, Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          events.getState().redo();
        } else {
          events.getState().undo();
        }
        return;
      }

      // Skip remaining shortcuts if any modifier key is held
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          state.openModal();
          break;
        case 't':
          e.preventDefault();
          state.setCurrentDate(new Date());
          break;
        case 'm':
          e.preventDefault();
          state.setView(ViewType.MONTH);
          break;
        case 'w':
          e.preventDefault();
          state.setView(ViewType.WEEK);
          break;
        case 'd':
          e.preventDefault();
          state.setView(ViewType.DAY);
          break;
        case 'arrowleft': {
          e.preventDefault();
          const cur = state.currentDate;
          const next = new Date(cur);
          if (state.view === ViewType.MONTH) next.setMonth(next.getMonth() - 1);
          else if (state.view === ViewType.WEEK) next.setDate(next.getDate() - 7);
          else next.setDate(next.getDate() - 1);
          state.setCurrentDate(next);
          break;
        }
        case 'arrowright': {
          e.preventDefault();
          const cur = state.currentDate;
          const next = new Date(cur);
          if (state.view === ViewType.MONTH) next.setMonth(next.getMonth() + 1);
          else if (state.view === ViewType.WEEK) next.setDate(next.getDate() + 7);
          else next.setDate(next.getDate() + 1);
          state.setCurrentDate(next);
          break;
        }
        case 'escape':
          if (state.isModalOpen) {
            state.closeModal();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts]);

  // Hydrate events from persistence on mount
  useEffect(() => {
    const store = eventsRef.current!;
    if (store.getState().dbHydrated) return;

    persistenceAdapter
      .fetchAll()
      .then((events) => store.getState().hydrateFromDb(events))
      .catch(() => store.getState().hydrateFromDbFailed());
  }, [persistenceAdapter]);

  // Run integrations hook (handles OAuth + event fetching for Google/Outlook/Apple)
  const {
    googleEvents: integratedGoogleEvents,
    outlookEvents: integratedOutlookEvents,
    appleEvents: integratedAppleEvents,
    integrations: integrationsValue,
  } = useIntegrations(integrationsConfig);

  // Build external events — merge manual externalEvents prop with integration-fetched events
  const externalEvents = useMemo(
    () => ({
      google: [...(externalEventsProp?.google ?? []), ...integratedGoogleEvents],
      outlook: [...(externalEventsProp?.outlook ?? []), ...integratedOutlookEvents],
      apple: [...(externalEventsProp?.apple ?? []), ...integratedAppleEvents],
    }),
    [externalEventsProp?.google, externalEventsProp?.outlook, externalEventsProp?.apple, integratedGoogleEvents, integratedOutlookEvents, integratedAppleEvents],
  );

  const config: CalendarConfig = useMemo(
    () => ({
      persistence: persistenceAdapter,
      notify: notifyFn,
      enableRecurrence,
      enableDragAndDrop,
      enableConflictDetection,
      enableKeyboardShortcuts,
      callbacks,
    }),
    [persistenceAdapter, notifyFn, enableRecurrence, enableDragAndDrop, enableConflictDetection, enableKeyboardShortcuts, callbacks],
  );

  const contextValue: CalendarContextValue = useMemo(
    () => ({
      config,
      useCalendarStore: storesRef.current!,
      useEventsStore: eventsRef.current!,
      useDragStore: dragRef.current!,
      externalEvents,
      integrations: integrationsValue,
    }),
    [config, externalEvents, integrationsValue],
  );

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}

/**
 * Hook to access the calendar context. Must be used within <BahrawyCalendarProvider>.
 */
export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error(
      'useCalendarContext must be used within a <BahrawyCalendarProvider>. ' +
      'Wrap your calendar component tree with <BahrawyCalendarProvider>.',
    );
  }
  return ctx;
}
