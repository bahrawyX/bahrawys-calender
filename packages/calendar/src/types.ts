/**
 * bahrawy-calendar — Core type definitions.
 *
 * Calendar-only types extracted from the Lumina app. No focus sessions,
 * gamification, achievements, or mood logs — those are app-level concerns.
 */

export enum ViewType {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

export type EventCategory = string;

export interface CustomCategory {
  name: string;
  color: string;
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  daysOfWeek?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
  endCondition:
    | { type: 'NEVER' }
    | { type: 'UNTIL'; untilDate: string }
    | { type: 'COUNT'; count: number };
  /** Raw RFC 5545 RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" */
  rrule?: string;
}

export type EditScope = 'this' | 'this_and_following' | 'all';

export interface MeetingLink {
  url: string;
  id?: string;
  password?: string;
  provider: 'Zoom' | 'Meet' | 'Teams' | string;
}

export type EventSource = 'local' | 'google' | 'microsoft' | 'outlook' | 'apple';
export type EventProvider = 'local' | 'google' | 'microsoft' | 'outlook' | 'apple';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  category: EventCategory;
  color: string;
  recurrence?: RecurrenceRule | null;
  exceptions?: string[];
  parentRecurringEventId?: string | null;
  recurringEventId?: string | null;
  originalStartTime?: string | null;
  isRecurrenceException?: boolean;
  meetingLink?: MeetingLink | null;
  completed?: boolean;
  source?: EventSource;
  provider?: EventProvider;
  editable?: boolean;
  readOnly?: boolean;
  draggable?: boolean;
  outlookId?: string;
  organizer?: string;
  linkedTaskId?: string | null;
  createdViaNL?: boolean;
}

export interface EventInstance extends CalendarEvent {
  instanceDate: string;
  /** Composite ID for virtual instances: `{masterEventId}:{isoDate}` */
  instanceId?: string;
}

export interface OverlapGroup {
  column: number;
  totalColumns: number;
  hasConflict?: boolean;
  overlapCount?: number;
}

// ── Drag State ──────────────────────────────────────────────────────────────
export interface DragState {
  isDragging: boolean;
  draggedEventId: string | null;
  origin: {
    dayKey: string; // YYYY-MM-DD
    startMin: number; // minutes from midnight
    endMin: number;
    durationMin: number;
    rect?: { left: number; width: number };
  } | null;

  preview: {
    dayKey: string;
    startMin: number;
    endMin: number;
    topPx: number;
    heightPx: number;
    columnIndex: number;
    columnCount: number;
  } | null;

  pointer: {
    pointerId: number | null;
    offsetYWithinEventPx: number;
  } | null;

  commit: {
    isCommitting: boolean;
    fromTopPx?: number;
    toTopPx?: number;
    fromLeftPx?: number;
    toLeftPx?: number;
    fromWidthPx?: number;
    toWidthPx?: number;
  } | null;
}

// ── Notify function type ────────────────────────────────────────────────────
export type NotifyFn = (message: string, undoFn?: () => void, duration?: number) => void;

// ── Lifecycle callbacks ─────────────────────────────────────────────────────
export interface CalendarLifecycleCallbacks {
  onEventDeleted?: (event: CalendarEvent) => void;
  onEventCompleted?: (event: CalendarEvent) => void;
  onCategoryRenamed?: (oldName: string, newName: string) => void;
  onCategoryDeleted?: (name: string) => void;
}
