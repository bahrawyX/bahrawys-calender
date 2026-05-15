/**
 * <BahrawyCalendar /> — the root component.
 *
 * Renders a fully functional calendar out of the box with built-in
 * Month / Week / Day views. No CLI scaffolding required.
 *
 * For full customization, use the provider directly and build your own views.
 */

'use client';

import React, { useMemo } from 'react';
import { BahrawyCalendarProvider, useCalendarContext } from '../context/calendar-provider';
import { ViewType } from '../types';
import type {
  CalendarEvent,
  EventInstance,
  NotifyFn,
  CalendarLifecycleCallbacks,
} from '../types';
import type { IntegrationsConfig } from '../integrations/types';
import type { PersistenceAdapter } from '../core/persistence/types';
import type { CalendarThemeTokens } from '../theme/tokens';
import { themeTokensToCSS } from '../theme/tokens';
import {
  formatDateISO,
  getDaysInMonth,
  getDaysInWeek,
  isSameDay,
  getEventPosition,
  expandRecurrences,
  formatTime,
  HOUR_HEIGHT,
} from '../core/utils/date-utils';
import { timeToMinutes } from '../core/utils/time-utils';
import { hourLabel } from '../core/engine/slot-engine';
import { EVENT_COLORS, DAYS } from '../constants';

// ── Props ───────────────────────────────────────────────────────────────────
export interface BahrawyCalendarProps {
  /** Default view on mount */
  defaultView?: ViewType | 'month' | 'week' | 'day';
  /** Initial date on mount */
  initialDate?: Date;

  /** Controlled events (external state). When provided, overrides internal store. */
  events?: CalendarEvent[];
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (id: string) => void;
  onEventMove?: (
    id: string,
    newDate: string,
    startTime?: string,
    endTime?: string,
  ) => void;

  /** External provider events (read-only overlay) */
  externalEvents?: {
    google?: CalendarEvent[];
    outlook?: CalendarEvent[];
    apple?: CalendarEvent[];
  };

  /** Custom persistence adapter. Default: localStorage */
  persistence?: PersistenceAdapter;

  /** Notification function (e.g. Sonner's toast). Default: no-op */
  notify?: NotifyFn;

  /** Theme overrides via CSS variables */
  theme?: Partial<CalendarThemeTokens>;

  /** Root container className */
  className?: string;

  /** Feature flags */
  enableRecurrence?: boolean;
  enableDragAndDrop?: boolean;
  enableConflictDetection?: boolean;
  enableKeyboardShortcuts?: boolean;

  /** Lifecycle callbacks */
  callbacks?: CalendarLifecycleCallbacks;

  /** Provider integrations — Google/Outlook/Apple */
  integrations?: IntegrationsConfig;
}

// ── Normalize view helpers ─────────────────────────────────────────────────
const normalizeView = (
  v: ViewType | 'month' | 'week' | 'day' | undefined,
): ViewType | undefined => {
  if (v === undefined) return undefined;
  if (v === 'month') return ViewType.MONTH;
  if (v === 'week') return ViewType.WEEK;
  if (v === 'day') return ViewType.DAY;
  return v; // already a ViewType enum value
};

const VIEW_MAP: Record<string, ViewType> = {
  month: ViewType.MONTH,
  week: ViewType.WEEK,
  day: ViewType.DAY,
};

// ── Root Component ──────────────────────────────────────────────────────────
export function BahrawyCalendar({
  defaultView = 'month',
  initialDate,
  events,
  externalEvents,
  persistence,
  notify,
  theme,
  className,
  enableRecurrence = true,
  enableDragAndDrop = true,
  enableConflictDetection = true,
  enableKeyboardShortcuts = true,
  callbacks,
  integrations,
}: BahrawyCalendarProps) {
  const themeStyles = theme ? themeTokensToCSS(theme) : undefined;

  return (
    <BahrawyCalendarProvider
      defaultView={normalizeView(defaultView)}
      initialDate={initialDate}
      externalEvents={externalEvents}
      persistence={persistence}
      notify={notify}
      enableRecurrence={enableRecurrence}
      enableDragAndDrop={enableDragAndDrop}
      enableConflictDetection={enableConflictDetection}
      enableKeyboardShortcuts={enableKeyboardShortcuts}
      callbacks={callbacks}
      integrations={integrations}
    >
      <div
        className={`bahrawy-calendar relative flex flex-col h-full ${className ?? ''}`}
        style={themeStyles}
      >
        <CalendarInner controlledEvents={events} />
      </div>
    </BahrawyCalendarProvider>
  );
}

// ── Inner Component (has access to context) ─────────────────────────────────
function CalendarInner({
  controlledEvents,
}: {
  controlledEvents?: CalendarEvent[];
}) {
  const { useCalendarStore, useEventsStore, externalEvents } =
    useCalendarContext();
  const view = useCalendarStore((s) => s.view);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const storeEvents = useEventsStore((s) => s.events);

  // Use controlled events if provided, otherwise store events
  const localEvents = controlledEvents ?? storeEvents;

  // Merge local + external events
  const allEvents = useMemo(() => {
    const externals = [
      ...(externalEvents?.google ?? []),
      ...(externalEvents?.outlook ?? []),
      ...(externalEvents?.apple ?? []),
    ];
    return [...localEvents, ...externals];
  }, [localEvents, externalEvents]);

  // Expand recurring events for the visible range
  const visibleInstances = useMemo(() => {
    const rangeStart = new Date(currentDate);
    const rangeEnd = new Date(currentDate);

    if (view === ViewType.MONTH) {
      rangeStart.setDate(1);
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeEnd.setMonth(rangeEnd.getMonth() + 1, 7);
    } else if (view === ViewType.WEEK) {
      const dayOfWeek = rangeStart.getDay();
      rangeStart.setDate(rangeStart.getDate() - dayOfWeek);
      rangeEnd.setDate(rangeStart.getDate() + 7);
    } else {
      rangeEnd.setDate(rangeEnd.getDate() + 1);
    }

    return expandRecurrences(allEvents, rangeStart, rangeEnd);
  }, [allEvents, currentDate, view]);

  return (
    <>
      <CalendarHeader />
      <div className="flex-1 overflow-hidden">
        {view === ViewType.MONTH && (
          <BuiltInMonthView
            currentDate={currentDate}
            events={visibleInstances}
          />
        )}
        {view === ViewType.WEEK && (
          <BuiltInWeekView
            currentDate={currentDate}
            events={visibleInstances}
          />
        )}
        {view === ViewType.DAY && (
          <BuiltInDayView
            currentDate={currentDate}
            events={visibleInstances}
          />
        )}
      </div>
    </>
  );
}

// ── Header with view switcher + navigation ──────────────────────────────────
function CalendarHeader() {
  const { useCalendarStore } = useCalendarContext();
  const view = useCalendarStore((s) => s.view);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setView = useCalendarStore((s) => s.setView);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);

  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const navigateDate = (offset: number) => {
    const next = new Date(currentDate);
    if (view === ViewType.MONTH) {
      next.setMonth(next.getMonth() + offset);
    } else if (view === ViewType.WEEK) {
      next.setDate(next.getDate() + offset * 7);
    } else {
      next.setDate(next.getDate() + offset);
    }
    setCurrentDate(next);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--bc-border, #e5e7eb)',
        background: 'var(--bc-surface, #fff)',
      }}
    >
      {/* Date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigateDate(-1)}
          aria-label="Previous"
          style={navBtnStyle}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 600,
            minWidth: '160px',
            textAlign: 'center',
            margin: 0,
            color: 'var(--bc-text, #111)',
          }}
        >
          {monthLabel}
        </h2>
        <button
          onClick={() => navigateDate(1)}
          aria-label="Next"
          style={navBtnStyle}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          style={{
            ...navBtnStyle,
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 500,
            background: 'var(--bc-primary, #6D59E0)',
            color: '#fff',
            borderRadius: '6px',
          }}
        >
          Today
        </button>
      </div>

      {/* View switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'var(--bc-muted, #f5f5f5)',
          borderRadius: '8px',
          padding: '2px',
        }}
      >
        {(['month', 'week', 'day'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(VIEW_MAP[v])}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background:
                view === VIEW_MAP[v]
                  ? 'var(--bc-surface, #fff)'
                  : 'transparent',
              color:
                view === VIEW_MAP[v]
                  ? 'var(--bc-text, #111)'
                  : 'var(--bc-text-muted, #888)',
              boxShadow:
                view === VIEW_MAP[v]
                  ? '0 1px 2px rgba(0,0,0,0.08)'
                  : 'none',
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--bc-text, #333)',
};

// ── Event pill styles ───────────────────────────────────────────────────────
const eventColor = (e: EventInstance) =>
  e.color || EVENT_COLORS[e.category] || '#6D59E0';

// ══════════════════════════════════════════════════════════════════════════════
//  MONTH VIEW — 6-row grid with event pills
// ══════════════════════════════════════════════════════════════════════════════
function BuiltInMonthView({
  currentDate,
  events,
}: {
  currentDate: Date;
  events: EventInstance[];
}) {
  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  const thisMonth = currentDate.getMonth();

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventInstance[]>();
    for (const e of events) {
      const key = e.instanceDate ?? e.date;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Weekday header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--bc-border, #e5e7eb)',
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: 600,
              textAlign: 'center',
              color: 'var(--bc-text-muted, #888)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {days.map((day, i) => {
          const iso = formatDateISO(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === thisMonth;
          const dayEvents = eventsByDate.get(iso) ?? [];
          const maxShow = 3;

          return (
            <div
              key={i}
              style={{
                borderRight:
                  (i + 1) % 7 !== 0
                    ? '1px solid var(--bc-border, #e5e7eb)'
                    : undefined,
                borderBottom: '1px solid var(--bc-border, #e5e7eb)',
                padding: '4px',
                overflow: 'hidden',
                opacity: isCurrentMonth ? 1 : 0.4,
                background: isToday
                  ? 'var(--bc-today-bg, rgba(109,89,224,0.04))'
                  : undefined,
              }}
            >
              {/* Day number */}
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: isToday ? 700 : 400,
                  color: isToday
                    ? '#fff'
                    : 'var(--bc-text, #333)',
                  width: isToday ? '24px' : undefined,
                  height: isToday ? '24px' : undefined,
                  borderRadius: '50%',
                  background: isToday
                    ? 'var(--bc-primary, #6D59E0)'
                    : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '2px',
                }}
              >
                {day.getDate()}
              </div>

              {/* Event pills */}
              {dayEvents.slice(0, maxShow).map((ev) => (
                <div
                  key={ev.id + (ev.instanceDate ?? '')}
                  title={`${ev.title} (${formatTime(ev.startTime)} - ${formatTime(ev.endTime)})`}
                  style={{
                    fontSize: '10px',
                    lineHeight: '16px',
                    padding: '0 4px',
                    marginBottom: '1px',
                    borderRadius: '3px',
                    background: eventColor(ev) + '18',
                    color: eventColor(ev),
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    borderLeft: `2px solid ${eventColor(ev)}`,
                  }}
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > maxShow && (
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--bc-text-muted, #888)',
                    paddingLeft: '4px',
                  }}
                >
                  +{dayEvents.length - maxShow} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  WEEK VIEW — 7-column time grid with positioned events
// ══════════════════════════════════════════════════════════════════════════════
const WEEK_START_HOUR = 0;
const WEEK_END_HOUR = 24;
const HOURS = Array.from(
  { length: WEEK_END_HOUR - WEEK_START_HOUR },
  (_, i) => i + WEEK_START_HOUR,
);

function BuiltInWeekView({
  currentDate,
  events,
}: {
  currentDate: Date;
  events: EventInstance[];
}) {
  const weekDays = getDaysInWeek(currentDate);
  const today = new Date();

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventInstance[]>();
    for (const e of events) {
      const key = e.instanceDate ?? e.date;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Day header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px repeat(7, 1fr)',
          borderBottom: '1px solid var(--bc-border, #e5e7eb)',
          flexShrink: 0,
        }}
      >
        <div /> {/* Time gutter spacer */}
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              style={{
                padding: '8px 4px',
                textAlign: 'center',
                borderLeft: '1px solid var(--bc-border, #e5e7eb)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--bc-text-muted, #888)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {DAYS[day.getDay()]}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : 'var(--bc-text, #333)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isToday
                    ? 'var(--bc-primary, #6D59E0)'
                    : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                }}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '56px repeat(7, 1fr)',
            position: 'relative',
          }}
        >
          {/* Time labels + horizontal lines */}
          <div style={{ position: 'relative' }}>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                  paddingTop: '0px',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--bc-text-muted, #999)',
                    transform: 'translateY(-6px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h === 0 ? '' : hourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const iso = formatDateISO(day);
            const dayEvents = eventsByDay.get(iso) ?? [];

            return (
              <div
                key={dayIdx}
                style={{
                  position: 'relative',
                  borderLeft: '1px solid var(--bc-border, #e5e7eb)',
                }}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                      borderBottom:
                        '1px solid var(--bc-border, #e5e7eb)',
                    }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((ev) => {
                  const pos = getEventPosition(
                    ev.startTime,
                    ev.endTime,
                  );
                  return (
                    <div
                      key={ev.id + (ev.instanceDate ?? '')}
                      title={`${ev.title}\n${formatTime(ev.startTime)} - ${formatTime(ev.endTime)}`}
                      style={{
                        position: 'absolute',
                        top: `${pos.top}px`,
                        height: `${pos.height}px`,
                        left: '2px',
                        right: '2px',
                        borderRadius: '4px',
                        background: eventColor(ev) + '20',
                        borderLeft: `3px solid ${eventColor(ev)}`,
                        padding: '2px 4px',
                        overflow: 'hidden',
                        fontSize: '11px',
                        lineHeight: '14px',
                        cursor: 'default',
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: eventColor(ev),
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.title}
                      </div>
                      {pos.height > 36 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--bc-text-muted, #888)',
                          }}
                        >
                          {formatTime(ev.startTime)} -{' '}
                          {formatTime(ev.endTime)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DAY VIEW — single-column time grid
// ══════════════════════════════════════════════════════════════════════════════
function BuiltInDayView({
  currentDate,
  events,
}: {
  currentDate: Date;
  events: EventInstance[];
}) {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);
  const iso = formatDateISO(currentDate);

  const dayEvents = useMemo(
    () =>
      events.filter(
        (e) => (e.instanceDate ?? e.date) === iso,
      ),
    [events, iso],
  );

  // Simple column overlap calculation
  const positioned = useMemo(() => {
    const sorted = [...dayEvents].sort(
      (a, b) =>
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );

    const columns: number[] = [];
    const positions: {
      event: EventInstance;
      column: number;
      totalColumns: number;
    }[] = [];

    for (const ev of sorted) {
      const start = timeToMinutes(ev.startTime);
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        if (start >= columns[col]) {
          columns[col] = timeToMinutes(ev.endTime);
          positions.push({ event: ev, column: col, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push(timeToMinutes(ev.endTime));
        positions.push({
          event: ev,
          column: columns.length - 1,
          totalColumns: 0,
        });
      }
    }

    const totalCols = columns.length || 1;
    return positions.map((p) => ({
      ...p,
      totalColumns: totalCols,
    }));
  }, [dayEvents]);

  const dayLabel = currentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Day header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--bc-border, #e5e7eb)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isToday
              ? 'var(--bc-primary, #6D59E0)'
              : 'var(--bc-text, #333)',
          }}
        >
          {dayLabel}
          {isToday && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--bc-primary, #6D59E0)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              Today
            </span>
          )}
        </span>
      </div>

      {/* Time grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr',
            position: 'relative',
          }}
        >
          {/* Time gutter */}
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--bc-text-muted, #999)',
                    transform: 'translateY(-6px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h === 0 ? '' : hourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Event column */}
          <div
            style={{
              position: 'relative',
              borderLeft: '1px solid var(--bc-border, #e5e7eb)',
            }}
          >
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  borderBottom:
                    '1px solid var(--bc-border, #e5e7eb)',
                }}
              />
            ))}

            {/* Now indicator */}
            {isToday && <NowIndicator />}

            {/* Events with overlap columns */}
            {positioned.map(({ event: ev, column, totalColumns }) => {
              const pos = getEventPosition(ev.startTime, ev.endTime);
              const widthPercent = 100 / totalColumns;
              const leftPercent = column * widthPercent;

              return (
                <div
                  key={ev.id + (ev.instanceDate ?? '')}
                  title={`${ev.title}\n${formatTime(ev.startTime)} - ${formatTime(ev.endTime)}`}
                  style={{
                    position: 'absolute',
                    top: `${pos.top}px`,
                    height: `${pos.height}px`,
                    left: `calc(${leftPercent}% + 2px)`,
                    width: `calc(${widthPercent}% - 4px)`,
                    borderRadius: '6px',
                    background: eventColor(ev) + '20',
                    borderLeft: `3px solid ${eventColor(ev)}`,
                    padding: '4px 6px',
                    overflow: 'hidden',
                    fontSize: '12px',
                    lineHeight: '16px',
                    cursor: 'default',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: eventColor(ev),
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ev.title}
                  </div>
                  {pos.height > 36 && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--bc-text-muted, #888)',
                      }}
                    >
                      {formatTime(ev.startTime)} -{' '}
                      {formatTime(ev.endTime)}
                    </div>
                  )}
                  {pos.height > 56 && ev.location && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--bc-text-muted, #aaa)',
                        marginTop: '2px',
                      }}
                    >
                      {ev.location}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Now indicator line ──────────────────────────────────────────────────────
function NowIndicator() {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const topPx = (minutesSinceMidnight / 60) * HOUR_HEIGHT;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--bc-primary, #6D59E0)',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '-4px',
          top: '-3px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--bc-primary, #6D59E0)',
        }}
      />
    </div>
  );
}
