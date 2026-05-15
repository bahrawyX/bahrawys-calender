/**
 * Calendar UI Store — manages view state, filters, modal, and custom categories.
 *
 * Extracted from Lumina's useCalendarStore with all non-calendar concerns removed:
 * no focus sessions, no goals, no intelligence profile, no task board references.
 */

import { create } from 'zustand';
import { ViewType } from '../../types';
import type { EventCategory, CalendarLifecycleCallbacks } from '../../types';
import { CATEGORIES } from '../../constants';
import type { CalendarUIState, CreateCalendarStoreOptions } from './types';
import { setStorageItem, readStorageJSON } from '../utils/storage';

const CUSTOM_CATEGORIES_KEY = 'bahrawy_custom_categories';

function persistCustomCategories(list: Array<{ name: string; color: string }>): void {
  setStorageItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(list));
}

export function createCalendarStore(options: CreateCalendarStoreOptions = {}) {
  const { defaultView = ViewType.MONTH, initialDate, callbacks } = options;

  return create<CalendarUIState>((set, get) => ({
    view: defaultView,
    currentDate: initialDate ?? new Date(),
    activeFilters: [],
    searchQuery: '',
    timezone: typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
    customCategories: readStorageJSON<Array<{ name: string; color: string }>>(
      CUSTOM_CATEGORIES_KEY,
      [],
    ),

    isModalOpen: false,
    selectedEventId: null,
    initialDateForNewEvent: undefined,
    initialTimeForNewEvent: undefined,

    setView: (view) => set({ view }),
    setCurrentDate: (currentDate) => set({ currentDate }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    toggleFilter: (category: EventCategory) =>
      set((state) => ({
        activeFilters: state.activeFilters.includes(category)
          ? state.activeFilters.filter((f) => f !== category)
          : [...state.activeFilters, category],
      })),

    addCustomCategory: (name, color) => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      const state = get();
      const reservedNames = new Set(CATEGORIES.map((c) => c.name.toLowerCase()));
      const exists =
        state.customCategories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase()) ||
        reservedNames.has(trimmedName.toLowerCase());
      if (exists) return false;

      const newCategories = [...state.customCategories, { name: trimmedName, color }];
      set({ customCategories: newCategories });
      persistCustomCategories(newCategories);
      return true;
    },

    updateContext: (contextId, updates) => {
      const trimmedName = updates.name.trim();
      if (!trimmedName) return false;

      const state = get();
      const reservedNames = new Set(CATEGORIES.map((c) => c.name.toLowerCase()));
      const context = state.customCategories.find((c) => c.name === contextId);
      if (!context) return false;

      const duplicate = state.customCategories.some(
        (c) => c.name !== contextId && c.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (duplicate || reservedNames.has(trimmedName.toLowerCase())) return false;

      const newCategories = state.customCategories.map((c) =>
        c.name === contextId ? { ...c, name: trimmedName, color: updates.color } : c,
      );
      const nextFilters = state.activeFilters.map((f) => (f === contextId ? trimmedName : f));

      // Lifecycle callback for external integrations (e.g. task board)
      callbacks?.onCategoryRenamed?.(contextId, trimmedName);

      set({ customCategories: newCategories, activeFilters: nextFilters });
      persistCustomCategories(newCategories);
      return true;
    },

    deleteContext: (contextId) => {
      const state = get();
      const exists = state.customCategories.some((c) => c.name === contextId);
      if (!exists) return false;

      const newCategories = state.customCategories.filter((c) => c.name !== contextId);
      const nextFilters = state.activeFilters.filter((f) => f !== contextId);

      callbacks?.onCategoryDeleted?.(contextId);

      set({ customCategories: newCategories, activeFilters: nextFilters });
      persistCustomCategories(newCategories);
      return true;
    },

    removeCustomCategory: (name) => {
      get().deleteContext(name);
    },

    openModal: (eventId, initialDate, initialTime) =>
      set({
        isModalOpen: true,
        selectedEventId: eventId || null,
        initialDateForNewEvent: initialDate,
        initialTimeForNewEvent: initialTime,
      }),

    closeModal: () =>
      set({
        isModalOpen: false,
        selectedEventId: null,
        initialDateForNewEvent: undefined,
        initialTimeForNewEvent: undefined,
      }),
  }));
}
