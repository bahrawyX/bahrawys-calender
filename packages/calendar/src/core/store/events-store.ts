/**
 * Calendar Events Store — manages event CRUD, undo/redo, and persistence.
 *
 * Extracted from Lumina's useCalendarEventsStore with all non-calendar
 * dependencies removed (no task board, no link store). Cross-feature
 * integrations are replaced with lifecycle callbacks.
 */

import { create } from 'zustand';
import type { CalendarEvent, EditScope, NotifyFn } from '../../types';
import type { PersistenceAdapter } from '../persistence/types';
import type { CalendarEventsState, CreateEventsStoreOptions } from './types';

interface HistoryState {
  events: CalendarEvent[];
}

/** Validate time fields: HH:mm format, valid ranges, endTime > startTime, min 1 min duration. */
function isValidEventTimes(startTime: string, endTime: string): boolean {
  const HH_MM = /^\d{2}:\d{2}$/;
  if (!HH_MM.test(startTime) || !HH_MM.test(endTime)) return false;
  const toMin = (t: string) => {
    const h = parseInt(t.slice(0, 2), 10);
    const m = parseInt(t.slice(3), 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
    return h * 60 + m;
  };
  const s = toMin(startTime);
  const e = toMin(endTime);
  if (s < 0 || e < 0) return false;
  return e > s && e - s >= 1;
}

export function createEventsStore(options: CreateEventsStoreOptions) {
  const { persistence, notify, callbacks } = options;

  return create<CalendarEventsState>((set, get) => ({
    events: [],
    recurringInstances: [],
    history: [{ events: [] }] as HistoryState[],
    historyIndex: 0,
    dbHydrated: false,

    hydrateFromDb: (dbEvents) => {
      if (get().dbHydrated) return;
      set({
        dbHydrated: true,
        events: dbEvents,
        history: [{ events: dbEvents }],
        historyIndex: 0,
      });
    },

    hydrateFromDbFailed: () => {
      if (get().dbHydrated) return;
      set({
        dbHydrated: true,
        events: [],
        history: [{ events: [] }],
        historyIndex: 0,
      });
    },

    addEvent: (event) => {
      if (event.startTime && event.endTime && !isValidEventTimes(event.startTime, event.endTime)) {
        notify('Invalid event times — start must be before end');
        return;
      }
      const { events, history, historyIndex } = get();
      const prevHistory = history;
      const prevHistoryIndex = historyIndex;
      const newEvents = [...events, event];
      const newHistory = [...history.slice(0, historyIndex + 1), { events: newEvents }].slice(-50);
      set({ events: newEvents, history: newHistory, historyIndex: newHistory.length - 1 });

      const timeRange = event.startTime && event.endTime ? ` (${event.startTime}–${event.endTime})` : '';
      notify(`Event created: ${event.title}${timeRange}`);

      persistence.create(event)
        .then((ok) => {
          if (ok) return;
          const current = get();
          if (!current.events.some((e) => e.id === event.id)) return;
          const restoredEvents = current.events.filter((e) => e.id !== event.id);
          set({
            events: restoredEvents,
            history: prevHistory,
            historyIndex: prevHistoryIndex,
          });
          notify(`Couldn't save "${event.title}" — please try again.`);
        })
        .catch(() => {
          const current = get();
          if (!current.events.some((e) => e.id === event.id)) return;
          const restoredEvents = current.events.filter((e) => e.id !== event.id);
          set({
            events: restoredEvents,
            history: prevHistory,
            historyIndex: prevHistoryIndex,
          });
          notify(`Couldn't save "${event.title}" — check your connection and try again.`);
        });
    },

    addEventOptimistic: (event) => {
      if (event.startTime && event.endTime && !isValidEventTimes(event.startTime, event.endTime)) {
        notify('Invalid event times — start must be before end');
        return;
      }
      const { events, history, historyIndex } = get();
      const newEvents = [...events, event];
      const newHistory = [...history.slice(0, historyIndex + 1), { events: newEvents }].slice(-50);
      set({ events: newEvents, history: newHistory, historyIndex: newHistory.length - 1 });
    },

    updateEvent: (event, editScope) => {
      if (event.startTime && event.endTime && !isValidEventTimes(event.startTime, event.endTime)) {
        notify('Invalid event times — start must be before end');
        return;
      }
      const { events, history, historyIndex } = get();

      // Drop virtual instance locally for single-occurrence edits
      if (editScope === 'this' && event.id.includes(':')) {
        set({ recurringInstances: get().recurringInstances.filter((e) => e.id !== event.id) });
        notify(`Instance updated: ${event.title}`);
        return;
      }

      const oldEvent = events.find((e) => e.id === event.id);
      const newEvents = events.map((e) => (e.id === event.id ? event : e));
      const newHistory = [...history.slice(0, historyIndex + 1), { events: newEvents }].slice(-50);
      set({ events: newEvents, history: newHistory, historyIndex: newHistory.length - 1 });

      const body = editScope ? { ...event, editScope } : event;
      persistence.update(event.id, body as Partial<CalendarEvent>);
      notify(`Event updated: ${event.title}`);

      // Lifecycle callback for completion toggle
      if (event.completed && !oldEvent?.completed) {
        callbacks?.onEventCompleted?.(event);
      }
    },

    toggleEventCompletion: (id) => {
      const { events, history, historyIndex } = get();
      const oldEvent = events.find((e) => e.id === id);
      const newEvents = events.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e));
      const newHistory = [...history.slice(0, historyIndex + 1), { events: newEvents }].slice(-50);
      set({ events: newEvents, history: newHistory, historyIndex: newHistory.length - 1 });

      if (!oldEvent?.completed && oldEvent) {
        callbacks?.onEventCompleted?.(oldEvent);
      }
    },

    deleteEvent: (id, editScope) => {
      // Drop virtual instance for single-occurrence deletes
      if (editScope === 'this' && id.includes(':')) {
        set({ recurringInstances: get().recurringInstances.filter((e) => e.id !== id) });
        notify('Instance removed');
        return;
      }

      const { events, history, historyIndex } = get();
      const deleted = events.find((e) => e.id === id);
      const newEvents = events.filter((e) => e.id !== id);
      const newHistory = [...history.slice(0, historyIndex + 1), { events: newEvents }].slice(-50);
      set({ events: newEvents, history: newHistory, historyIndex: newHistory.length - 1 });

      const scopeParam = editScope ? `?editScope=${editScope}` : '';
      persistence.delete(id, scopeParam);

      // Lifecycle callback
      if (deleted) {
        callbacks?.onEventDeleted?.(deleted);
      }

      const label = deleted ? `Event deleted: ${deleted.title}` : 'Event deleted.';
      notify(label, () => get().undo());
    },

    moveEvent: (id, newDate, startTime, endTime) => {
      if (startTime && endTime && !isValidEventTimes(startTime, endTime)) return;
      const { events, history, historyIndex } = get();
      const moved = events.find((e) => e.id === id);
      const newEvents = events.map((e) =>
        e.id === id
          ? { ...e, date: newDate, startTime: startTime || e.startTime, endTime: endTime || e.endTime }
          : e,
      );
      const newHistory = [...history.slice(0, historyIndex + 1), { events: newEvents }].slice(-50);
      set({ events: newEvents, history: newHistory, historyIndex: newHistory.length - 1 });

      if (moved) {
        persistence.update(id, { date: newDate, startTime, endTime });
        notify(`Event moved: ${moved.title}`, () => get().undo());
      }
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const state = history[newIndex];
        set({ events: state.events, historyIndex: newIndex });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const state = history[newIndex];
        set({ events: state.events, historyIndex: newIndex });
      }
    },
  }));
}
