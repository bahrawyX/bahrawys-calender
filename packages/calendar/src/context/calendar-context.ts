/**
 * Calendar Context — React context for store injection and configuration.
 */

import { createContext } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { CalendarEventsState, CalendarUIState, DragStoreState } from '../core/store/types';
import type { PersistenceAdapter } from '../core/persistence/types';
import type { NotifyFn, CalendarEvent, CalendarLifecycleCallbacks, ViewType } from '../types';
import type { IntegrationsContextValue } from '../integrations/types';

export interface CalendarConfig {
  /** Persistence backend. Default: LocalStorageAdapter */
  persistence: PersistenceAdapter;

  /** Notification function. Default: no-op (install sonner for toasts) */
  notify: NotifyFn;

  /** Default categories with name + color. Merged with built-in CATEGORIES. */
  categories?: Array<{ name: string; color: string }>;

  /** Feature flags */
  enableRecurrence?: boolean;
  enableDragAndDrop?: boolean;
  enableConflictDetection?: boolean;
  enableKeyboardShortcuts?: boolean;

  /** Locale and start-of-week */
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /** Lifecycle callbacks for cross-feature integrations */
  callbacks?: CalendarLifecycleCallbacks;
}

export interface CalendarContextValue {
  config: CalendarConfig;

  /** Core Zustand stores */
  useCalendarStore: UseBoundStore<StoreApi<CalendarUIState>>;
  useEventsStore: UseBoundStore<StoreApi<CalendarEventsState>>;
  useDragStore: UseBoundStore<StoreApi<DragStoreState>>;

  /** External provider events (read-only overlay) */
  externalEvents: {
    google: CalendarEvent[];
    outlook: CalendarEvent[];
    apple: CalendarEvent[];
  };

  /** Integration methods (connect/disconnect Google, Outlook) */
  integrations: IntegrationsContextValue;
}

export const CalendarContext = createContext<CalendarContextValue | null>(null);
