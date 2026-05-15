/**
 * bahrawy-calendar/compat — Compatibility layer for existing view components.
 *
 * Re-exports everything under the same names the original app used, so
 * view components only need to change their import path, not their code.
 *
 * Example migration:
 *   BEFORE: import { useCalendarStore } from '../store/useCalendarStore';
 *   AFTER:  import { useCalendarStore } from 'bahrawy-calendar/compat';
 *
 *   BEFORE: import { timeToMinutes, HOUR_HEIGHT } from '../utils/dateUtils';
 *   AFTER:  import { timeToMinutes, HOUR_HEIGHT } from 'bahrawy-calendar/compat';
 *
 *   BEFORE: import { makeSlotKey } from '../engine/slotEngine';
 *   AFTER:  import { makeSlotKey } from 'bahrawy-calendar/compat';
 *
 *   BEFORE: import { EVENT_COLORS } from '../constants';
 *   AFTER:  import { EVENT_COLORS } from 'bahrawy-calendar/compat';
 */

// ── Stores ──────────────────────────────────────────────────────────────────
export {
  useCalendarStore,
  useCalendarEventsStore,
  useDragStore,
  useDragStoreRaw,
  __setStores,
} from './stores';

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  CalendarEvent,
  EventInstance,
  EventCategory,
  CustomCategory,
  RecurrenceRule,
  EditScope,
  OverlapGroup,
  DragState,
  EventSource,
  EventProvider,
  MeetingLink,
  NotifyFn,
} from '../types';
export { ViewType } from '../types';

// ── Constants ───────────────────────────────────────────────────────────────
export { CATEGORIES, DAYS, MONTHS, EVENT_COLORS, PROVIDER_COLORS, PROVIDER_LABELS } from '../constants';

// ── Date/Time Utils ─────────────────────────────────────────────────────────
export {
  formatDateISO,
  getDaysInMonth,
  getDaysInWeek,
  isSameDay,
  getEventPosition,
  expandRecurrences,
  calculateOverlaps,
  formatTime,
  HOUR_HEIGHT,
  timeToMinutes,
  minutesToTime,
} from '../core/utils/date-utils';

// ── Engines ─────────────────────────────────────────────────────────────────
export {
  makeSlotKey,
  parseSlotKey,
  minutesToHHMM,
  hourLabel,
  eventOverlapsSlot,
  slotStartTime,
} from '../core/engine/slot-engine';

export {
  getEventsForSlot,
  buildHourOccupancyMap,
  getFreeGapsForDay,
} from '../core/engine/overlap-engine';

export { calculateDragCollision } from '../core/engine/drag-engine';
export type { DragCollisionResult } from '../core/engine/drag-engine';

// ── Slot Engine Types ───────────────────────────────────────────────────────
export type { TimeSlotId, SlotGranularity } from '../core/engine/slot-engine';

// ── Utilities ───────────────────────────────────────────────────────────────
export { uid } from '../core/utils/uid';
export { default as notify } from '../core/utils/notify';

// ── Recurrence ─────────────────────────────────────────────────────────────
export { initRecurrence } from '../core/recurrence/rrule-engine';

// ── Hooks ───────────────────────────────────────────────────────────────────
export { useCalendar } from '../core/hooks/use-calendar';
export { useTimelineConflict } from '../core/hooks/use-timeline-conflict';

// ── Persistence ─────────────────────────────────────────────────────────────
export { LocalStorageAdapter } from '../core/persistence/local-storage-adapter';
export { NoopAdapter } from '../core/persistence/noop-adapter';
export type { PersistenceAdapter } from '../core/persistence/types';

// ── Theme ───────────────────────────────────────────────────────────────────
export { cal } from '../theme/tokens';
