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
import type { CalendarEvent, NotifyFn, ViewType, CalendarLifecycleCallbacks } from '../types';
import type { PersistenceAdapter } from '../core/persistence/types';
import type { IntegrationsConfig } from '../integrations/types';
import { useIntegrations } from '../integrations/use-integrations';
import { LocalStorageAdapter } from '../core/persistence/local-storage-adapter';
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

  /** Default view on mount */
  defaultView?: ViewType;

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
