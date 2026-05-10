
export enum ViewType {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day'
}

export type EventCategory = string;

export interface CustomCategory {
  name: string;
  color: string;
}

export interface RecurrenceRule {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  daysOfWeek?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
  endCondition:
    | { type: "NEVER" }
    | { type: "UNTIL"; untilDate: string }
    | { type: "COUNT"; count: number };
  /** Raw RFC 5545 RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" */
  rrule?: string;
}

export type EditScope = 'this' | 'this_and_following' | 'all';

export interface MeetingLink {
  url: string;
  id?: string;
  password?: string;
  provider: 'Lumina' | 'Zoom' | 'Meet' | 'Teams';
}

export type EventSource = 'lumina' | 'google' | 'microsoft' | 'outlook';
export type EventProvider = 'local' | 'google' | 'microsoft' | 'outlook';

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

// ─── Focus Session ────────────────────────────────────────────────────────────
/** Simplified focus session — replaces multi-phase Pomodoro engine. */
export type FocusMode = 'classic' | 'deep';

export interface FocusSession {
  id: string;
  mode: FocusMode;
  /** ISO timestamp of session start */
  startedAt: string;
  /** 25 for classic, 50 for deep */
  durationMinutes: number;
  /** ISO timestamp, set on completion or cancellation */
  endedAt?: string;
  status: 'running' | 'completed' | 'cancelled';
}

// ─── Intelligence Profile ─────────────────────────────────────────────────────
/** Analytical metrics — no gamification, no archetypes. */
export interface IntelligenceProfile {
  /** Consecutive days with at least one completed Focus event */
  focusStreak: number;
  /** % of today's waking hours covered by scheduled events (0–100) */
  schedulingDensity: number;
  /** Most common start-hour window for Focus events, e.g. "9:00 – 11:00" */
  peakFocusHours: string;
  /**
   * Fragmentation Score 0–100.
   * Counts gaps < 30min between events + category switches.
   * High = badly fragmented day.
   */
  fragmentationScore: number;
  /** Number of category changes across today's events */
  contextSwitchesToday: number;
  /** Continuous Focus blocks ≥ 60 min logged today */
  deepWorkBlocksToday: Array<{ start: string; end: string }>;
  /** Best predicted free 90-min window in the next 3 days within 8:00–18:00 */
  suggestedFocusSlot?: { date: string; start: string; end: string };
  lastAnalyzed: string;
}

export interface SmartInsight {
  id: string;
  type: 'optimization' | 'warning';
  message: string;
}

// ─── Drag State ───────────────────────────────────────────────────────────────
export interface DragState {
  isDragging: boolean;
  draggedEventId: string | null;
  origin: {
    dayKey: string; // YYYY-MM-DD
    startMin: number; // minutes from midnight
    endMin: number;
    durationMin: number;
    rect?: { left: number; width: number }; // cached column rect relative to container
  } | null;

  preview: {
    dayKey: string;
    startMin: number;
    endMin: number;
    topPx: number;
    heightPx: number;
    // collision info for rendering ghost layout
    columnIndex: number;
    columnCount: number;
  } | null;

  pointer: {
    pointerId: number | null;
    offsetYWithinEventPx: number; // ensures ghost doesn't jump on grab
  } | null;

  // animation phase
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

// ─── Streak / Gamification ────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  unlockedAt: string; // ISO
  seen: boolean;
}

export interface MoodLog {
  id: string;
  userId: string;
  focusSessionId: string | null;
  mood: 'great' | 'good' | 'okay' | 'tired' | 'bad';
  note?: string;
  loggedAt: string; // ISO
}

export type AmbientTrack = 'brown' | 'rainfall' | 'forest' | 'ocean';

export interface FocusSessionResult {
  id: string;
  coinsEarned: number;
  newCoins: number;
  dailyStreak: number;
  sessionStreak: number;
  newAchievements: Pick<Achievement, 'type' | 'unlockedAt'>[];
  /** True when the session ran for < 75% of its planned duration — no coins, no streak, no achievements. */
  underThreshold?: boolean;
}

export type MoodValue = 'great' | 'good' | 'okay' | 'tired' | 'bad';

export type ContactType = 'suggestion' | 'technical' | 'feedback';
