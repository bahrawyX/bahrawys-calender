'use client';

/**
 * MobileDayList
 *
 * Scrollable bottom panel of the mobile calendar. Shows the selected
 * date header (big date number + abbreviated weekday), all-day event
 * cards, then chronological timed events with a left time column and
 * an accent bar in the category colour.
 *
 * Classification:
 *  - startTime === '00:00' && endTime === '23:59' → all-day
 *    (matches how the Google/Outlook mappers emit all-day events —
 *    see GoogleCalendarSync.tsx / microsoft/mapper.ts)
 *  - everything else → timed
 */
import React, { useMemo } from 'react';
import { EventInstance } from '@/types';
import { EVENT_COLORS } from '@/constants';
import { cn } from '@/lib/utils';

interface MobileDayListProps {
  date: Date;
  events: EventInstance[];
  onEventClick: (eventId: string) => void;
}

const DOW_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function isAllDay(ev: EventInstance): boolean {
  return ev.startTime === '00:00' && ev.endTime === '23:59';
}

function formatTimeLabel(hhmm: string): string {
  // 14:00 → 2:00, 09:30 → 9:30 (drop AM/PM — end time carries that context)
  const [h, m] = hhmm.split(':').map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')}`;
}

function formatTimeRangeLabel(start: string, end: string): string {
  const [sh] = start.split(':').map(Number);
  const [eh] = end.split(':').map(Number);
  const startMer = sh < 12 ? 'AM' : 'PM';
  const endMer = eh < 12 ? 'AM' : 'PM';
  const startLabel = `${formatTimeLabel(start)}${startMer === endMer ? '' : ' ' + startMer}`;
  return `${startLabel}–${formatTimeLabel(end)} ${endMer}`;
}

export const MobileDayList: React.FC<MobileDayListProps> = ({ date, events, onEventClick }) => {
  const dayEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.instanceDate + 'T00:00:00');
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  }, [events, date]);

  const { allDay, timed } = useMemo(() => {
    const a: EventInstance[] = [];
    const t: EventInstance[] = [];
    for (const e of dayEvents) (isAllDay(e) ? a : t).push(e);
    t.sort((x, y) => x.startTime.localeCompare(y.startTime));
    return { allDay: a, timed: t };
  }, [dayEvents]);

  const colourFor = (ev: EventInstance) =>
    EVENT_COLORS[ev.category as keyof typeof EVENT_COLORS] ?? ev.color ?? '#6D59E0';

  return (
    <div className="flex flex-col gap-3 pb-2" data-testid="mobile-day-list">
      {/* Day header */}
      <div className="flex items-end gap-3 px-4 pt-2">
        <div className="font-display text-[32px] leading-none text-foreground tracking-[-0.03em]">
          {date.getDate()}
        </div>
        <div className="pb-1 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          {DOW_ABBR[date.getDay()]}
        </div>
      </div>

      {/* All-day cards */}
      {allDay.length > 0 && (
        <div className="px-4 flex flex-col gap-1.5">
          {allDay.map((ev) => {
            const colour = colourFor(ev);
            return (
              <button
                key={ev.instanceId ?? ev.id}
                type="button"
                onClick={() => onEventClick(ev.id)}
                className="w-full text-left rounded-xl px-3 py-2.5 min-h-11"
                style={{ backgroundColor: colour }}
                aria-label={`${ev.title}, all day`}
              >
                <div className="text-white text-sm font-medium leading-tight truncate">
                  {ev.title}
                </div>
                <div className="text-white/80 text-[11px] font-mono uppercase tracking-wide mt-0.5">
                  All day
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Timed events */}
      {timed.length > 0 && (
        <div className="px-4 flex flex-col">
          {timed.map((ev) => {
            const colour = colourFor(ev);
            const rangeLabel = formatTimeRangeLabel(ev.startTime, ev.endTime);
            const subtitle = ev.location ? `${rangeLabel} · ${ev.location}` : rangeLabel;
            return (
              <button
                key={ev.instanceId ?? ev.id}
                type="button"
                onClick={() => onEventClick(ev.id)}
                className="relative flex items-stretch gap-3 py-2.5 min-h-11 text-left border-b border-border/40 last:border-b-0"
                aria-label={`${ev.title}, ${rangeLabel}`}
              >
                <div className="flex-shrink-0 w-11 text-[13px] font-mono text-muted-foreground pt-0.5">
                  {formatTimeLabel(ev.startTime)}
                </div>
                <span
                  className="flex-shrink-0 w-[3px] rounded-full self-stretch"
                  style={{ backgroundColor: colour }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground leading-snug truncate">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {allDay.length === 0 && timed.length === 0 && (
        <div className={cn(
          'flex flex-col items-center justify-center text-center',
          'px-6 py-10 gap-2 text-muted-foreground',
        )}>
          <div className="text-3xl opacity-40" aria-hidden="true">✦</div>
          <div className="text-sm">Nothing scheduled</div>
        </div>
      )}
    </div>
  );
};

MobileDayList.displayName = 'MobileDayList';
