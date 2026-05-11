'use client';

import React, { useMemo, memo, useCallback, useState } from 'react';
import { CalendarEvent, EventInstance } from '../types';
import { getDaysInMonth, isSameDay, formatDateISO } from '../utils/dateUtils';
import { DAYS } from '../constants';
import { useCalendarStore } from '../store/useCalendarStore';
import { useCalendarEventsStore } from '../store/useCalendarEventsStore';
import EventItem from './EventItem';
import { EventProviderBadge } from './EventProviderBadge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { useIsLaptopWidth } from '../hooks/useIsLaptopWidth';
import {
  CalendarSurface,
  CELL_CLS,
  CELL_HOVER_CLS,
  HEADER_CLS,
  WEEKDAY_LABEL_CLS,
  TODAY_BADGE_CLS,
  DATE_NUMBER_CLS,
  TODAY_RING_CLS,
  GRID_CANVAS_CLS,
} from './ui/CalendarShared';

// Both bands cap at one event per cell with a "+N more" overflow chip;
// the only difference is the pill style — compact single-line for laptop,
// full title+time pill for wide screens.
const MAX_EVENTS_PER_CELL = 1;

/* ... types ... */
interface MonthGridDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  eventsCount: number;
}

interface MonthDayCellProps {
  day: MonthGridDay;
  dayEvents: CalendarEvent[];
  onDayClick: (dateStr: string, hasEvents: boolean) => void;
  onEventClick: (id: string) => void;
  onDrop: (eventId: string, dateStr: string) => void;
  isLaptop: boolean;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatPopoverHeader(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d} — All Events`;
}

function fmtTime(t: string): string {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${mStr ?? '00'} ${period}`;
}

const OverflowPopover = memo<{
  dayEvents: CalendarEvent[];
  dateStr: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventClick: (id: string) => void;
  overflowCount: number;
}>(({ dayEvents, dateStr, open, onOpenChange, onEventClick, overflowCount }) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}
        className="inline-flex items-center gap-1 self-start px-1.5 py-[2px] rounded-md text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors duration-100 leading-none tabular-nums"
      >
        +{overflowCount} more
      </button>
    </PopoverTrigger>
    <PopoverContent
      className="w-64 p-0 overflow-hidden"
      align="start"
      sideOffset={6}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2.5 border-b border-border/60">
        <p className="text-[11px] font-semibold text-foreground">
          {formatPopoverHeader(dateStr)}
        </p>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-0.5">
          {dayEvents.map((ev) => {
            // Resolve to one of four canonical providers so the badge can pick
            // the right icon without knowing anything about the app's internals.
            const evProvider: 'google' | 'microsoft' | 'apple' | 'local' =
              ev.provider === 'google' || ev.provider === 'microsoft' || ev.provider === 'apple'
                ? ev.provider
                : ev.source === 'outlook' || ev.source === 'microsoft'
                  ? 'microsoft'
                  : ev.source === 'google'
                    ? 'google'
                    : ev.source === 'apple'
                      ? 'apple'
                      : 'local';
            return (
              <button
                key={ev.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenChange(false); onEventClick(ev.id); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/60 transition-colors duration-100 text-left cursor-pointer group"
              >
                <EventProviderBadge
                  provider={evProvider}
                  category={ev.category}
                  color={ev.color}
                  size={22}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {ev.title}
                  </p>
                  {ev.startTime && (
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 tabular-nums">
                      {fmtTime(ev.startTime)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </PopoverContent>
  </Popover>
));
OverflowPopover.displayName = 'OverflowPopover';

const MonthDayCell = memo<MonthDayCellProps>(({ day, dayEvents, onDayClick, onEventClick, onDrop, isLaptop }) => {
  const { date, dateStr, isCurrentMonth, isToday, eventsCount } = day;
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (!isCurrentMonth) {
    return (
      <div
        className="h-full flex flex-col p-1 sm:p-1.5 rounded-xl bg-muted/30 border border-border/30"
        style={{ opacity: 0.45, pointerEvents: 'none' }}
        role="gridcell"
        aria-disabled="true"
      >
        <div className="px-1 mb-1 flex-shrink-0">
          <span className={`text-[10px] font-semibold w-6 h-6 flex items-center justify-center ${DATE_NUMBER_CLS}`}>
            {date.getDate()}
          </span>
        </div>
      </div>
    );
  }

  const visibleEvents = dayEvents.slice(0, MAX_EVENTS_PER_CELL);
  const overflowCount = eventsCount - MAX_EVENTS_PER_CELL;

  return (
    <div
      className={`h-full flex flex-col p-1 sm:p-1.5 ${CELL_CLS} ${CELL_HOVER_CLS} ${isToday ? TODAY_RING_CLS : ''}`}
      onClick={() => onDayClick(dateStr, eventsCount > 0)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const eventId = e.dataTransfer.getData('eventId');
        if (eventId) onDrop(eventId, dateStr);
      }}
      role="gridcell"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDayClick(dateStr, eventsCount > 0);
        }
      }}
      aria-label={`${dateStr}${eventsCount > 0 ? `, ${eventsCount} event${eventsCount !== 1 ? 's' : ''}` : ''}`}
    >
      <div className="flex items-start justify-between mb-1 px-0.5 flex-shrink-0">
        <span
          className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-100 ${
            isToday ? TODAY_BADGE_CLS : `${DATE_NUMBER_CLS} hover:text-primary dark:hover:text-primary`
          }`}
        >
          {date.getDate()}
        </span>
        {eventsCount > 0 && !isToday && (
          <span className="w-1 h-1 rounded-full bg-primary/50 mt-2 mr-0.5 shrink-0" />
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-[3px] overflow-y-auto no-scrollbar">
        {visibleEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onClick={(id) => onEventClick(id)}
            compact={isLaptop}
          />
        ))}
        {overflowCount > 0 && (
          <OverflowPopover
            dayEvents={dayEvents}
            dateStr={dateStr}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            onEventClick={onEventClick}
            overflowCount={overflowCount}
          />
        )}
      </div>
    </div>
  );
});
MonthDayCell.displayName = 'MonthDayCell';

interface MonthViewProps {
  events: CalendarEvent[];
}

const MonthView: React.FC<MonthViewProps> = ({ events }) => {
  const currentDate = useCalendarStore(s => s.currentDate);
  const openModal   = useCalendarStore(s => s.openModal);
  const moveEvent   = useCalendarEventsStore(s => s.moveEvent);
  const isLaptop    = useIsLaptopWidth();
  const today = new Date();

  // Virtual instances from recurrence expansion keep the master's `.date`
  // (the series DTSTART) and expose their real per-occurrence date on
  // `.instanceDate`. Bucket by `instanceDate` so each occurrence lands in its
  // own cell; otherwise every expanded instance stacks on the master date
  // and produces phantom "+N more" duplicates.
  const bucketKey = (e: CalendarEvent): string =>
    (e as Partial<EventInstance>).instanceDate ?? e.date;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = bucketKey(e);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    // Sort each day's events by start time so earlier ones appear first
    // (and overflow into "+N more" predictably).
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const aTime = a.startTime || '99:99';
        const bTime = b.startTime || '99:99';
        return aTime.localeCompare(bTime);
      });
    }
    return map;
  }, [events]);

  const gridDays = useMemo<MonthGridDay[]>(() => {
    const raw = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    return raw.map((date) => {
      const dateStr = formatDateISO(date);
      return {
        date,
        dateStr,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(date, today),
        eventsCount: eventsByDate.get(dateStr)?.length ?? 0,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear(), currentDate.getMonth(), eventsByDate]);

  const handleDayClick = useCallback(
    (dateStr: string, _hasEvents: boolean) => {
      openModal(undefined, dateStr);
    },
    [openModal]
  );

  const handleEventClick = useCallback(
    (id: string) => {
      openModal(id);
    },
    [openModal]
  );

  const handleDrop = useCallback(
    (eventId: string, dateStr: string) => {
      moveEvent(eventId, dateStr);
    },
    [moveEvent]
  );

  return (
    // Always fill the available height so the calendar grid can expand
    // to fit — prevents the bottom row from being clipped on shorter viewports.
    <div className="h-full">
    <CalendarSurface role="grid">
      {/* Wrap in a horizontally-scrollable container with a min-width so
          all 7 columns stay readable below ~1100px (laptop with sidebar +
          mobile). The header row sits inside the same scroller so the
          weekday labels stay aligned with their columns when scrolled. */}
      <div className="calendar-scroll-container flex-1 min-h-0 flex flex-col overflow-x-auto">
        <div className="min-w-[700px] flex-1 flex flex-col min-h-0">
          <div className={`grid grid-cols-7 ${HEADER_CLS}`}>
            {DAYS.map((day) => (
              <div
                key={day}
                className={`py-1.5 text-center ${WEEKDAY_LABEL_CLS}`}
              >
                {day}
              </div>
            ))}
          </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-t-xl">
        <div
          className={`h-full w-full grid grid-cols-7 p-1 gap-0.5 ${GRID_CANVAS_CLS}`}
          // 6 equal-height rows that share the available vertical space.
          // minmax(0, 1fr) lets rows shrink even when their content has
          // an intrinsic minimum height, so the bottom row never spills
          // past the surface's bottom edge.
          style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
        >
          {gridDays.map((day, idx) => (
            <MonthDayCell
              key={idx}
              day={day}
              dayEvents={eventsByDate.get(day.dateStr) ?? []}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              onDrop={handleDrop}
              isLaptop={isLaptop}
            />
          ))}
        </div>
      </div>
        </div>
      </div>
    </CalendarSurface>
    </div>
  );
};

export default MonthView;
