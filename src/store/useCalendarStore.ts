import { create } from 'zustand';
import {
  CalendarEvent, ViewType, EventCategory,
  IntelligenceProfile, SmartInsight,
  FocusSession, FocusMode,
} from '../types';
import { CATEGORIES } from '../constants';
import { timeToMinutes, formatDateISO } from '../utils/dateUtils';
import notify from '../utils/notify';
import { useTaskBoardStore } from './useTaskBoardStore';
import { useCalendarEventsStore } from './useCalendarEventsStore';
import { useDailyPlanStore, todayKey } from './useDailyPlanStore';
import { uid } from '@/lib/uid';
import { setStorageItem, removeStorageItem, readStorageJSON } from '@/lib/storage';

interface UserGoal {
  id: string;
  text: string;
  completed: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  goals: UserGoal[];
  intelligence: IntelligenceProfile;
}

const FOCUS_DURATIONS: Record<FocusMode, number> = {
  classic: 25,
  deep: 50,
};

interface CalendarState {
  activeFilters: EventCategory[];
  searchQuery: string;
  timezone: string;
  customCategories: Array<{ name: string; color: string }>;
  customCategoriesHydrated: boolean;

  profile: UserProfile;
  insights: SmartInsight[];

  // ── Ignite Flow (Focus Sessions) ───────────────────────
  activeFocusSession: FocusSession | null;
  focusSessions: FocusSession[];
  isTimerExpanded: boolean;
  timerPosition: { x: number; y: number } | null;

  currentTab: 'calendar' | 'profile';
  isFocusMode: boolean;
  isSidebarCollapsed: boolean;
  view: ViewType;
  currentDate: Date;

  isModalOpen: boolean;
  selectedEventId: string | null;
  initialDateForNewEvent: string | undefined;
  /** Pre-fill start time when opening AddEvent from a slot click */
  initialTimeForNewEvent: string | undefined;

  /** Custom categories */
  addCustomCategory: (name: string, color: string) => boolean;
  updateContext: (contextId: string, updates: { name: string; color: string }) => boolean;
  deleteContext: (contextId: string) => boolean;
  removeCustomCategory: (name: string) => void;
  hydrateCustomCategoriesFromDb: (cats: Array<{ name: string; color: string }>) => void;


  setView: (view: ViewType) => void;
  setCurrentDate: (date: Date) => void;
  setSearchQuery: (searchQuery: string) => void;
  toggleFilter: (category: EventCategory) => void;
  setTab: (tab: 'calendar' | 'profile') => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // ── Ignite Flow Actions ────────────────────────────────
  startFocusSession: (mode: FocusMode, durationMinutesOverride?: number) => void;
  completeFocusSession: () => void;
  cancelFocusSession: () => void;
  setTimerExpanded: (expanded: boolean) => void;
  setTimerPosition: (pos: { x: number; y: number } | null) => void;

  addGoal: (text: string) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  setFocusMode: (enabled: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  openModal: (eventId?: string, initialDate?: string, initialTime?: string) => void;
  closeModal: () => void;

  calculateIntelligence: () => void;
}

const initialIntelligence: IntelligenceProfile = {
  focusStreak: 0,
  schedulingDensity: 0,
  peakFocusHours: 'Determining...',
  fragmentationScore: 0,
  contextSwitchesToday: 0,
  deepWorkBlocksToday: [],
  lastAnalyzed: new Date().toISOString(),
};

const defaultProfile: UserProfile = {
  name: 'Alexander Sterling',
  email: 'alex@lumina.io',
  role: 'Creative Director',
  bio: 'Minimalist designer focusing on efficiency.',
  goals: [],
  intelligence: initialIntelligence
};

/** Zero-padded string for time formatting (local to this store). */
const pad = (n: number): string => String(n).padStart(2, '0');

/** Returns a safe array of goals regardless of persisted schema. */
function getGoals(profile: UserProfile): UserGoal[] {
  return Array.isArray(profile.goals) ? profile.goals : [];
}

/**
 * Persist the current custom-categories list to localStorage.
 *
 * Standalone calendar — no DB backend, so the previous Lumina implementation
 * (which PATCHed `/api/users/preferences`) was rolling back on every save
 * because that endpoint doesn't exist here. Now we write the list to
 * `lumina_custom_categories` synchronously; the rollback is unused but kept
 * in the signature to preserve the existing call sites.
 */
const CUSTOM_CATEGORIES_KEY = 'lumina_custom_categories';

function persistCustomCategories(
  list: Array<{ name: string; color: string }>,
  _rollback: () => void,
): void {
  setStorageItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(list));
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  activeFilters: [],
  searchQuery: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  // Standalone calendar: rehydrate user-defined contexts straight from
  // localStorage on store creation. Synchronous because Zustand needs an
  // initial state object before any async hydration could complete.
  customCategories: readStorageJSON<Array<{ name: string; color: string }>>(
    CUSTOM_CATEGORIES_KEY,
    [],
  ),
  customCategoriesHydrated: true,
  // Profile is in-memory only. The previous `lumina_profile` cache leaked
  // identity (name/email/bio) and stale intelligence numbers across logouts.
  // Intelligence is recomputed from events; user identity comes from auth.
  profile: { ...defaultProfile, intelligence: { ...initialIntelligence } },
  insights: [],
  activeFocusSession: readStorageJSON<FocusSession | null>('lumina_active_focus_session', null),
  focusSessions: [],
  isTimerExpanded: readStorageJSON<boolean>('lumina_timer_expanded', true),
  timerPosition: readStorageJSON<{ x: number; y: number } | null>('lumina_timer_position', null),
  currentTab: 'calendar',
  isFocusMode: false,
  isSidebarCollapsed: false,
  view: ViewType.MONTH,
  currentDate: new Date(),

  isModalOpen: false,
  selectedEventId: null,
  initialDateForNewEvent: undefined,
  initialTimeForNewEvent: undefined,

  addCustomCategory: (name, color) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    const state = get();
    const reservedNames = new Set(CATEGORIES.map((category) => category.name.toLowerCase()));
    const exists = state.customCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())
      || reservedNames.has(trimmedName.toLowerCase());
    if (exists) return false;

    const previous = state.customCategories;
    const newCategories = [...previous, { name: trimmedName, color }];
    set({ customCategories: newCategories });
    persistCustomCategories(newCategories, () => set({ customCategories: previous }));
    return true;
  },

  updateContext: (contextId, updates) => {
    const trimmedName = updates.name.trim();
    if (!trimmedName) return false;

    const state = get();
    const reservedNames = new Set(CATEGORIES.map((category) => category.name.toLowerCase()));
    const context = state.customCategories.find((category) => category.name === contextId);
    if (!context) return false;

    const duplicate = state.customCategories.some((category) =>
      category.name !== contextId && category.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate || reservedNames.has(trimmedName.toLowerCase())) return false;

    const previous = state.customCategories;
    const previousFilters = state.activeFilters;
    const newCategories = previous.map((category) =>
      category.name === contextId
        ? { ...category, name: trimmedName, color: updates.color }
        : category
    );

    const nextFilters = previousFilters.map((filter) => filter === contextId ? trimmedName : filter);
    useTaskBoardStore.getState().renameContextReference(contextId, trimmedName);

    set({ customCategories: newCategories, activeFilters: nextFilters });
    persistCustomCategories(newCategories, () => set({ customCategories: previous, activeFilters: previousFilters }));
    return true;
  },

  deleteContext: (contextId) => {
    const state = get();
    const exists = state.customCategories.some((category) => category.name === contextId);
    if (!exists) return false;

    const previous = state.customCategories;
    const previousFilters = state.activeFilters;
    const newCategories = previous.filter((category) => category.name !== contextId);
    const nextFilters = previousFilters.filter((filter) => filter !== contextId);
    useTaskBoardStore.getState().clearContextReference(contextId);
    set({ customCategories: newCategories, activeFilters: nextFilters });
    persistCustomCategories(newCategories, () => set({ customCategories: previous, activeFilters: previousFilters }));
    return true;
  },

  removeCustomCategory: (name) => {
    get().deleteContext(name);
  },

  hydrateCustomCategoriesFromDb: (cats) => {
    const sanitized = (cats ?? [])
      .filter((c) => c && typeof c.name === 'string' && typeof c.color === 'string')
      .map((c) => ({ name: c.name, color: c.color }));
    set({ customCategories: sanitized, customCategoriesHydrated: true });
  },


  setView: (view) => set({ view }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleFilter: (category) => set((state) => ({
    activeFilters: state.activeFilters.includes(category)
      ? state.activeFilters.filter(f => f !== category)
      : [...state.activeFilters, category]
  })),
  setTab: (currentTab) => set({ currentTab }),
  setFocusMode: (isFocusMode) => set({ isFocusMode }),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),

  updateProfile: (profile) => set((state) => {
    const next = { ...state.profile, ...profile };
    return { profile: next };
  }),

  // ────────────────────────────────────────────────────────────────────────────
  // Ignite Flow — Simple focus session launcher
  // No phases, no gamification, no auto-chaining.
  // ────────────────────────────────────────────────────────────────────────────

  startFocusSession: (mode: FocusMode, durationMinutesOverride) => {
    const durationMinutes =
      durationMinutesOverride !== undefined
        ? Math.max(5, Math.min(240, Math.round(durationMinutesOverride)))
        : FOCUS_DURATIONS[mode];
    const session: FocusSession = {
      id: uid(),
      mode,
      startedAt: new Date().toISOString(),
      durationMinutes,
      status: 'running',
    };
    set({ activeFocusSession: session, isTimerExpanded: true });
    setStorageItem('lumina_active_focus_session', JSON.stringify(session));
    setStorageItem('lumina_timer_expanded', 'true');
  },

  completeFocusSession: () => {
    const session = get().activeFocusSession;
    if (!session) return;
    const endedAt = new Date().toISOString();
    const start = new Date(session.startedAt);
    const end = new Date(endedAt);
    const completed: FocusSession = { ...session, status: 'completed', endedAt };
    // Log as a calendar event
    useCalendarEventsStore.getState().addEvent({
      id: uid(),
      title: session.mode === 'classic' ? 'Focus: Quick Session' : 'Focus: Deep Work',
      description: `${session.durationMinutes}m focus session`,
      date: formatDateISO(start),
      startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
      category: 'Focus',
      color: '#6D59E0',
      timezone: get().timezone,
      completed: true,
    });
    set((state) => ({
      activeFocusSession: null,
      focusSessions: [...state.focusSessions, completed],
    }));
    removeStorageItem('lumina_active_focus_session');
    notify('Focus session complete.');
    get().calculateIntelligence();
  },

  cancelFocusSession: () => {
    set({ activeFocusSession: null });
    removeStorageItem('lumina_active_focus_session');
  },

  setTimerExpanded: (isTimerExpanded) => {
    set({ isTimerExpanded });
    setStorageItem('lumina_timer_expanded', JSON.stringify(isTimerExpanded));
  },

  setTimerPosition: (timerPosition) => {
    set({ timerPosition });
    setStorageItem('lumina_timer_position', JSON.stringify(timerPosition));
  },

  calculateIntelligence: () => {
    const events = useCalendarEventsStore.getState().events;
    const { profile } = get();
    const todayStr = formatDateISO(new Date());
    const todayEvents = events
      .filter(e => e.date === todayStr)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // ── 1. Focus Streak ───────────────────────────────────────────────────────
    let focusStreak = 0;
    const streakDate = new Date();
    while (true) {
      const ds = formatDateISO(streakDate);
      if (!events.some(e => e.date === ds && e.category === 'Focus')) break;
      focusStreak++;
      streakDate.setDate(streakDate.getDate() - 1);
    }

    // ── 2. Scheduling Density ─────────────────────────────────────────────────
    const todayPlanItems = useDailyPlanStore.getState().plansByDate[todayStr] ?? [];
    let dayTotalMinutes = 0;
    todayEvents.forEach(e => {
      dayTotalMinutes += Math.max(0, timeToMinutes(e.endTime) - timeToMinutes(e.startTime));
    });
    todayPlanItems.forEach(p => {
      dayTotalMinutes += Math.max(0, timeToMinutes(p.endTime) - timeToMinutes(p.startTime));
    });
    const schedulingDensity = Math.min(100, Math.round((dayTotalMinutes / 1440) * 100));

    // ── 3. Peak Focus Hours ───────────────────────────────────────────────────
    const focusHourMap: Record<number, number> = {};
    events.filter(e => e.category === 'Focus').forEach(e => {
      const h = parseInt(e.startTime.split(':')[0], 10);
      focusHourMap[h] = (focusHourMap[h] || 0) + 1;
    });
    const sortedHours = Object.entries(focusHourMap).sort((a, b) => Number(b[1]) - Number(a[1]));
    let peakFocusHours = 'Determining...';
    if (sortedHours.length > 0) {
      const h = parseInt(sortedHours[0][0], 10);
      peakFocusHours = `${h}:00 – ${h + 2}:00`;
    }

    // ── 4. Fragmentation Score ────────────────────────────────────────────────
    // Counts gaps < 30min between consecutive events + category switches (0–100)
    let smallGaps = 0;
    let catSwitches = 0;
    for (let i = 1; i < todayEvents.length; i++) {
      const gap = timeToMinutes(todayEvents[i].startTime) - timeToMinutes(todayEvents[i - 1].endTime);
      if (gap >= 0 && gap < 30) smallGaps++;
      if (todayEvents[i].category !== todayEvents[i - 1].category) catSwitches++;
    }
    const fragmentationScore = Math.min(100, smallGaps * 20 + catSwitches * 10);

    // ── 5. Context Switches Today ─────────────────────────────────────────────
    const contextSwitchesToday = catSwitches;

    // ── 6. Deep Work Blocks (≥60 min Focus, no overlap) ──────────────────────
    const deepWorkBlocksToday: Array<{ start: string; end: string }> = [];
    todayEvents.filter(e => e.category === 'Focus').forEach(e => {
      if (timeToMinutes(e.endTime) - timeToMinutes(e.startTime) >= 60) {
        deepWorkBlocksToday.push({ start: e.startTime, end: e.endTime });
      }
    });

    // ── 7. Best Focus Slot (next 3 days, 8–18, prefer peak hour) ─────────────
    // Include planned items as busy time alongside calendar events
    const planStore = useDailyPlanStore.getState();
    const peakHour = sortedHours.length > 0 ? parseInt(sortedHours[0][0], 10) : 9;
    let suggestedFocusSlot: IntelligenceProfile['suggestedFocusSlot'];
    outer: for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const dStr = formatDateISO(d);
      const dayEvs = events.filter(e => e.date === dStr);
      const dayPlanItems = planStore.plansByDate[dStr] ?? [];
      const startHours = [...Array.from({ length: 10 }, (_, i) => Math.max(8, peakHour - 1) + i)]
        .filter(h => h <= 16); // latest start for 90min block = 16:00
      for (const startH of startHours) {
        const slotStart = startH * 60;
        const slotEnd = slotStart + 90;
        const eventConflict = dayEvs.some(e => {
          const eStart = timeToMinutes(e.startTime);
          const eEnd = timeToMinutes(e.endTime);
          return eStart < slotEnd && eEnd > slotStart;
        });
        const planConflict = dayPlanItems.some(p => {
          const pStart = timeToMinutes(p.startTime);
          const pEnd = timeToMinutes(p.endTime);
          return pStart < slotEnd && pEnd > slotStart;
        });
        if (!eventConflict && !planConflict) {
          suggestedFocusSlot = {
            date: dStr,
            start: `${pad(startH)}:00`,
            end: `${pad(startH + 1)}:30`,
          };
          break outer;
        }
      }
    }

    const nextIntel: IntelligenceProfile = {
      focusStreak,
      schedulingDensity,
      peakFocusHours,
      fragmentationScore,
      contextSwitchesToday,
      deepWorkBlocksToday,
      suggestedFocusSlot,
      lastAnalyzed: new Date().toISOString(),
    };

    const nextProfile = { ...profile, intelligence: nextIntel };
    set({ profile: nextProfile });
  },

  addGoal: (text) => set((state) => {
    const newGoal: UserGoal = { id: uid(), text, completed: false };
    const next = { ...state.profile, goals: [...getGoals(state.profile), newGoal] };
    return { profile: next };
  }),

  toggleGoal: (id) => set((state) => {
    const next = {
      ...state.profile,
      goals: getGoals(state.profile).map(g => g.id === id ? { ...g, completed: !g.completed } : g),
    };
    return { profile: next };
  }),

  deleteGoal: (id) => set((state) => {
    const next = { ...state.profile, goals: getGoals(state.profile).filter(g => g.id !== id) };
    return { profile: next };
  }),

  openModal: (eventId, initialDate, initialTime) => set({
    isModalOpen: true,
    selectedEventId: eventId || null,
    initialDateForNewEvent: initialDate,
    initialTimeForNewEvent: initialTime,
  }),
  closeModal: () => set({
    isModalOpen: false,
    selectedEventId: null,
    initialDateForNewEvent: undefined,
    initialTimeForNewEvent: undefined,
  }),

}));