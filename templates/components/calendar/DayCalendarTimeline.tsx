'use client';

/**
 * DayCalendarTimeline — adapted for bahrawy-calendar package.
 *
 * All imports now come from 'bahrawy-calendar/compat' instead of relative paths.
 * Removed: PlannedTaskCard, PlannedTaskItem, Task type imports (app-level planner).
 * The planner integration is stripped — this is a pure calendar timeline.
 * If you need planner blocks, extend this component with your own task types.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventInstance } from 'bahrawy-calendar';
import {
  HOUR_HEIGHT,
  calculateOverlaps,
  isSameDay,
  timeToMinutes,
} from 'bahrawy-calendar/compat';

// These are local component imports — keep them relative to your project
import { TIME_LABEL_CLS, TIME_SIDEBAR_CLS } from '../ui/CalendarShared';
import TimeGridEvent from '../TimeGridEvent';
import { getVisibleEvents } from './getVisibleEvents';
import {
  useVisibleTimeRange,
  calculateOverlapsWithGuard,
  DensityOverflowIndicator,
  MAX_VISIBLE_PER_HOUR,
  DENSE_HOUR_THRESHOLD,
} from './virtualization';
import type { HourDensityData } from './virtualization';

// -- Constants --

const PX_PER_MIN = HOUR_HEIGHT / 60;
const MAX_DOM_NODES_PER_DAY = 150;

// -- Pure helpers --

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

// -- Props --

export interface DayCalendarTimelineProps {
  dateStr: string;
  startHour?: number;
  endHour?: number;
  disableDensityCompaction?: boolean;
  initialsModeThreshold?: number;
  adaptiveTitleCompaction?: boolean;

  calendarEvents: EventInstance[];
  onCalEventClick?: (id: string) => void;
  onCalEventPointerDown?: (event: EventInstance, e: React.PointerEvent) => void;
  draggedCalEventId?: string | null;

  dropRef?: (el: HTMLDivElement | null) => void;
  gridBodyRef?: React.RefObject<HTMLDivElement>;
  isDropOver?: boolean;

  calPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  calPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  calPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;

  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
  onScroll?: () => void;

  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  contentWrapRef?: React.RefObject<HTMLDivElement>;

  children?: React.ReactNode;
  gridBodyChildren?: React.ReactNode;
}

// -- Component --

export const DayCalendarTimeline: React.FC<DayCalendarTimelineProps> = ({
  dateStr,
  startHour = 0,
  endHour = 24,
  disableDensityCompaction = false,
  initialsModeThreshold = Number.POSITIVE_INFINITY,
  adaptiveTitleCompaction = true,
  calendarEvents,
  onCalEventClick,
  onCalEventPointerDown,
  draggedCalEventId,
  dropRef,
  gridBodyRef,
  isDropOver,
  calPointerMove,
  calPointerUp,
  calPointerCancel,
  onMouseMove,
  onMouseLeave,
  onScroll,
  scrollContainerRef: externalScrollRef,
  contentWrapRef: externalContentRef,
  children,
  gridBodyChildren,
}) => {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = (externalScrollRef ?? internalScrollRef) as React.RefObject<HTMLDivElement>;

  const internalContentRef = useRef<HTMLDivElement>(null);
  const contentRef = (externalContentRef ?? internalContentRef) as React.RefObject<HTMLDivElement>;

  const shouldCompactEvents = !disableDensityCompaction;

  // -- Derived constants --
  const TOTAL_HEIGHT = (endHour - startHour) * HOUR_HEIGHT;
  const MIDNIGHT_OFFSET_PX = startHour * HOUR_HEIGHT;
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  // -- Virtualization: visible time range from scroll --
  const timeRange = useVisibleTimeRange(scrollRef, 90);
  const adjustedRenderStart = Math.max(0, timeRange.renderStartMin - startHour * 60) + startHour * 60;
  const adjustedRenderEnd = Math.min(endHour * 60, timeRange.renderEndMin);

  // -- Now indicator --
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowInView = nowMins >= startHour * 60 && nowMins <= endHour * 60;
  const nowTop = (nowMins - startHour * 60) * PX_PER_MIN;

  // -- Unified overlap layout --
  const overlapResult = useMemo(() => {
    return calculateOverlapsWithGuard(calendarEvents);
  }, [calendarEvents]);

  const combinedOverlapMap = overlapResult.overlapMap;

  const compressedHours = useMemo(() => {
    if (!shouldCompactEvents) return new Map<number, HourDensityData>();

    const hourMap = new Map<number, HourDensityData>();
    for (let hour = startHour; hour < endHour; hour += 1) {
      const slotStart = hour * 60;
      const slotEnd = slotStart + 60;
      const inHour = calendarEvents.filter((event) => {
        const start = timeToMinutes(event.startTime);
        const end = timeToMinutes(event.endTime);
        return end > slotStart && start < slotEnd;
      });
      if (inHour.length > MAX_VISIBLE_PER_HOUR) {
        const isDense = inHour.length > DENSE_HOUR_THRESHOLD;
        hourMap.set(hour, {
          overflow: inHour.length - MAX_VISIBLE_PER_HOUR,
          isDense,
          events: inHour,
        });
      }
    }
    return hourMap;
  }, [shouldCompactEvents, calendarEvents, startHour, endHour]);

  // -- Virtualize: filter to visible calendar events --
  const visibleCalEvents = useMemo(() => {
    const visible = getVisibleEvents(calendarEvents, adjustedRenderStart, adjustedRenderEnd);
    const compacted = shouldCompactEvents && compressedHours.size > 0
      ? (() => {
          const seenPerHour = new Map<number, number>();
          return visible.filter((event) => {
            const hour = Math.floor(timeToMinutes(event.startTime) / 60);
            const hourData = compressedHours.get(hour);
            if (!hourData) return true;
            if (hourData.isDense) return false;
            const seen = seenPerHour.get(hour) ?? 0;
            if (seen < MAX_VISIBLE_PER_HOUR) {
              seenPerHour.set(hour, seen + 1);
              return true;
            }
            return false;
          });
        })()
      : visible;

    return disableDensityCompaction
      ? compacted
      : compacted.slice(0, MAX_DOM_NODES_PER_DAY);
  }, [
    calendarEvents,
    adjustedRenderStart,
    adjustedRenderEnd,
    shouldCompactEvents,
    disableDensityCompaction,
    compressedHours,
  ]);

  // -- Memoized static grid lines --
  const gridLines = useMemo(() => (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-border/60"
          style={{ top: (hour - startHour) * HOUR_HEIGHT }}
        />
      ))}
      {hours.map((hour) => (
        <div
          key={`h-${hour}`}
          className="absolute left-0 right-0 border-t border-dashed border-border/30"
          style={{ top: (hour - startHour) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
        />
      ))}
    </div>
  ), [hours, startHour]);

  // -- Render --
  return (
    <div
      ref={(el) => {
        (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className="flex-1 min-h-0 overflow-y-auto no-scrollbar scroll-smooth relative"
      onScroll={onScroll}
    >
      <div
        ref={(el) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="flex relative touch-none select-none"
        style={{ minHeight: `${TOTAL_HEIGHT}px` }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onPointerMove={calPointerMove}
        onPointerUp={calPointerUp}
        onPointerCancel={calPointerCancel}
      >
        {children}

        {/* -- Time labels sidebar -- */}
        <div className={TIME_SIDEBAR_CLS}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex flex-col items-center justify-start"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              <span className={`${TIME_LABEL_CLS} pt-1.5`}>
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* -- Grid body -- */}
        <div
          ref={(el) => {
            if (gridBodyRef) {
              (gridBodyRef as { current: HTMLDivElement | null }).current = el;
            }
            dropRef?.(el);
          }}
          className={`flex-1 relative transition-colors duration-150 ${isDropOver ? 'bg-primary/5' : ''}`}
          style={{ height: `${TOTAL_HEIGHT}px` }}
        >
          {gridLines}

          {gridBodyChildren}

          {/* z-40 -- NOW indicator */}
          {nowInView && isSameDay(new Date(dateStr + 'T00:00:00'), now) && (
            <div
              className="absolute left-0 right-0 pointer-events-none flex items-center"
              style={{ top: `${nowTop}px`, zIndex: 40 }}
            >
              <div className="pointer-events-none w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px]" />
              <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500/60 to-transparent relative">
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-background rounded-full animate-ping" />
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )}

          {/* z-10 -- Calendar event cards (virtualized) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 10 }}
          >
            <div
              className="absolute left-0 right-0"
              style={{ top: -MIDNIGHT_OFFSET_PX, height: `${24 * HOUR_HEIGHT}px` }}
            >
              {visibleCalEvents.map((event) => {
                const layout = combinedOverlapMap.get(event.id);
                if (layout && layout.column === -1) return null;
                const totalCols = layout?.totalColumns ?? 1;
                const col = layout?.column ?? 0;
                const renderInitialsMode = (layout?.overlapCount ?? 1) >= initialsModeThreshold;
                const colWidthPct = 100 / totalCols;
                return (
                  <TimeGridEvent
                    key={event.id}
                    event={event}
                    onClick={(id) => onCalEventClick?.(id)}
                    renderInitialsMode={renderInitialsMode}
                    adaptiveTitleCompaction={adaptiveTitleCompaction}
                    onPointerDown={
                      onCalEventPointerDown
                        ? (e) => onCalEventPointerDown(event, e)
                        : undefined
                    }
                    isDraggedOrigin={draggedCalEventId === event.id}
                    width={`${colWidthPct}%`}
                    left={`${col * colWidthPct}%`}
                    hasConflict={layout?.hasConflict ?? false}
                  />
                );
              })}
            </div>
          </div>

          {shouldCompactEvents && Array.from(compressedHours.entries()).map(([hour, hourData]) => {
            const localHour = hour - startHour;
            if (localHour < 0 || localHour >= endHour - startHour) return null;

            return (
              <DensityOverflowIndicator
                key={`compact-${hour}`}
                hour={localHour}
                overflow={hourData.overflow}
                isDense={hourData.isDense}
                hourEvents={hourData.events}
                onEventClick={onCalEventClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

DayCalendarTimeline.displayName = 'DayCalendarTimeline';
