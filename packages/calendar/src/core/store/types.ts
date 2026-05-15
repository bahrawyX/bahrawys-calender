/**
 * Store interface types — the contracts that each Zustand store implements.
 * Users can provide their own stores that match these interfaces.
 */

import type {
  CalendarEvent,
  EventInstance,
  EventCategory,
  ViewType,
  EditScope,
  DragState,
  NotifyFn,
  CalendarLifecycleCallbacks,
} from '../../types';
import type { PersistenceAdapter } from '../persistence/types';

// ── Events Store ────────────────────────────────────────────────────────────

export interface CalendarEventsState {
  events: CalendarEvent[];
  recurringInstances: CalendarEvent[];
  history: { events: CalendarEvent[] }[];
  historyIndex: number;
  dbHydrated: boolean;

  hydrateFromDb: (events: CalendarEvent[]) => void;
  hydrateFromDbFailed: () => void;
  addEvent: (event: CalendarEvent) => void;
  addEventOptimistic: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent, editScope?: EditScope) => void;
  toggleEventCompletion: (id: string) => void;
  deleteEvent: (id: string, editScope?: EditScope) => void;
  moveEvent: (id: string, newDate: string, startTime?: string, endTime?: string) => void;

  undo: () => void;
  redo: () => void;
}

/** Options for creating the events store. */
export interface CreateEventsStoreOptions {
  persistence: PersistenceAdapter;
  notify: NotifyFn;
  callbacks?: CalendarLifecycleCallbacks;
}

// ── Calendar (UI) Store ─────────────────────────────────────────────────────

export interface CalendarUIState {
  view: ViewType;
  currentDate: Date;
  activeFilters: EventCategory[];
  searchQuery: string;
  timezone: string;
  customCategories: Array<{ name: string; color: string }>;

  isModalOpen: boolean;
  selectedEventId: string | null;
  initialDateForNewEvent: string | undefined;
  initialTimeForNewEvent: string | undefined;

  setView: (view: ViewType) => void;
  setCurrentDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (category: EventCategory) => void;

  addCustomCategory: (name: string, color: string) => boolean;
  updateContext: (contextId: string, updates: { name: string; color: string }) => boolean;
  deleteContext: (contextId: string) => boolean;
  removeCustomCategory: (name: string) => void;

  openModal: (eventId?: string, initialDate?: string, initialTime?: string) => void;
  closeModal: () => void;
}

/** Options for creating the calendar UI store. */
export interface CreateCalendarStoreOptions {
  defaultView?: ViewType;
  initialDate?: Date;
  callbacks?: CalendarLifecycleCallbacks;
}

// ── Drag Store ──────────────────────────────────────────────────────────────

export interface DragStoreState {
  dragState: DragState;
  startDrag: (
    eventId: string,
    pointerId: number | null,
    offsetYPx: number,
    origin: NonNullable<DragState['origin']>,
  ) => void;
  updateDragPreview: (preview: NonNullable<DragState['preview']>) => void;
  commitDrag: (flipOrigin?: { top: number; left: number; width: number }) => void;
  finalizeCommitAnimation: () => void;
  cancelDrag: () => void;
}
