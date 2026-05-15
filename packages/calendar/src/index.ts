/**
 * bahrawy-calendar — Public API
 *
 * A keyboard-first, beautifully animated calendar component for React.
 * Provider integrations, recurrence engine, drag-and-drop, conflict detection.
 */

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  CalendarEvent,
  EventInstance,
  ViewType,
  RecurrenceRule,
  EditScope,
  EventCategory,
  CustomCategory,
  OverlapGroup,
  DragState,
  EventSource,
  EventProvider,
  MeetingLink,
  NotifyFn,
  CalendarLifecycleCallbacks,
} from './types';
export { ViewType as ViewTypeEnum } from './types';

// ── Constants ───────────────────────────────────────────────────────────────
export { CATEGORIES, DAYS, MONTHS, EVENT_COLORS, PROVIDER_COLORS, PROVIDER_LABELS } from './constants';

// ── Context / Provider ──────────────────────────────────────────────────────
export { BahrawyCalendarProvider, useCalendarContext } from './context/calendar-provider';
export type { BahrawyCalendarProviderProps } from './context/calendar-provider';
export type { CalendarConfig, CalendarContextValue } from './context/calendar-context';

// ── Stores (for advanced usage / custom views) ──────────────────────────────
export { createEventsStore } from './core/store/events-store';
export { createCalendarStore } from './core/store/calendar-store';
export { createDragStore } from './core/store/drag-store';
export type {
  CalendarEventsState,
  CalendarUIState,
  DragStoreState,
  CreateEventsStoreOptions,
  CreateCalendarStoreOptions,
} from './core/store/types';

// ── Hooks ───────────────────────────────────────────────────────────────────
export { useCalendar } from './core/hooks/use-calendar';
export { useTimelineConflict } from './core/hooks/use-timeline-conflict';
export type { TimelineConflictSelection } from './core/hooks/use-timeline-conflict';

// ── Engines ─────────────────────────────────────────────────────────────────
export {
  makeSlotKey,
  parseSlotKey,
  minutesToHHMM,
  hourLabel,
  eventOverlapsSlot,
  slotStartTime,
} from './core/engine/slot-engine';
export type { TimeSlotId, SlotGranularity } from './core/engine/slot-engine';

export {
  calculateOverlaps,
  getEventsForSlot,
  buildHourOccupancyMap,
  getFreeGapsForDay,
} from './core/engine/overlap-engine';

export { calculateDragCollision } from './core/engine/drag-engine';
export type { DragCollisionResult } from './core/engine/drag-engine';

// ── Recurrence ──────────────────────────────────────────────────────────────
export {
  expandRecurrence,
  buildRRule,
  describeRRule,
  validateRRule,
  parseRRule,
  getNextOccurrences,
  isOccurrence,
} from './core/recurrence/rrule-engine';
export type { RecurrenceInput, ExpandedInstance } from './core/recurrence/rrule-engine';

// ── Persistence ─────────────────────────────────────────────────────────────
export type { PersistenceAdapter } from './core/persistence/types';
export { LocalStorageAdapter } from './core/persistence/local-storage-adapter';
export { NoopAdapter } from './core/persistence/noop-adapter';

// ── Utils ───────────────────────────────────────────────────────────────────
export {
  formatDateISO,
  getDaysInMonth,
  getDaysInWeek,
  isSameDay,
  getEventPosition,
  expandRecurrences,
  formatTime,
  HOUR_HEIGHT,
} from './core/utils/date-utils';
export { timeToMinutes, minutesToTime } from './core/utils/time-utils';
export { uid } from './core/utils/uid';

// ── Theme ───────────────────────────────────────────────────────────────────
export { defaultThemeTokens, themeTokensToCSS, cal } from './theme/tokens';
export type { CalendarThemeTokens } from './theme/tokens';

// ── Integrations ───────────────────────────────────────────────────────────
export type {
  GoogleConfig,
  OutlookConfig,
  IntegrationsConfig,
  IntegrationsContextValue,
} from './integrations';
export { useIntegrations } from './integrations';

// ── Root Component ──────────────────────────────────────────────────────────
export { BahrawyCalendar } from './components/BahrawyCalendar';
export type { BahrawyCalendarProps } from './components/BahrawyCalendar';
