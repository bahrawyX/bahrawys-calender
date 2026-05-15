'use client';

/**
 * WeekView — adapted for bahrawy-calendar package.
 *
 * All imports now come from 'bahrawy-calendar/compat' instead of relative paths.
 * Removed: useTaskBoardStore, handleTaskDrop, showFragWarning (app-level concerns).
 * Added: optional onTaskDrop prop for external task-to-calendar integration.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { EventInstance } from 'bahrawy-calendar';
import {
  useCalendarStore,
  useCalendarEventsStore,
  useDragStore,
  getDaysInWeek,
  isSameDay,
  formatDateISO,
  timeToMinutes,
  HOUR_HEIGHT,
  buildHourOccupancyMap,
  makeSlotKey,
  minutesToHHMM,
  DAYS,
  EVENT_COLORS,
  notify,
  uid,
  calculateDragCollision,
  useTimelineConflict,
} from 'bahrawy-calendar/compat';

// These are local component imports — keep them relative to your project
import HoverTimeIndicator, { HoverIndicatorHandle } from './HoverTimeIndicator';
import {
  CalendarSurface,
  HEADER_CLS,
  WEEKDAY_LABEL_CLS,
  TIME_LABEL_CLS,
  TIME_SIDEBAR_CLS,
  TODAY_BADGE_CLS,
  DATE_NUMBER_CLS,
} from './ui/CalendarShared';
import TimeGridEvent from './TimeGridEvent';
import TimeSlotCell, { TimelineSlotClickPayload } from './TimeSlotCell';
import DragGhost from './DragGhost';
import { getVisibleEvents } from './calendar/getVisibleEvents';
import {
  useVisibleTimeRange,
  calculateOverlapsWithGuard,
  usePerfDebug,
  DensityOverflowIndicator,
  MAX_VISIBLE_PER_HOUR,
  DENSE_HOUR_THRESHOLD,
} from './calendar/virtualization';
import type { HourDensityData } from './calendar/virtualization';
import TimelineConflictDialog from './calendar/interaction/TimelineConflictDialog';
import TimelineConflictSheet from './calendar/interaction/TimelineConflictSheet';

const MAX_DOM_NODES = 300;
const DISABLE_WEEK_DENSITY_COMPACTION = true;

interface WeekViewProps {
  events: EventInstance[];
  /** Optional: handle external task drops onto the calendar grid */
  onTaskDrop?: (taskId: string, dropDateISO: string, startMinute: number) => void;
}

interface PendingDrag {
  timerId: ReturnType<typeof setTimeout>;
  eventId: string;
  pointerId: number;
  offsetY: number;
  startX: number;
  startY: number;
  origin: {
    dayKey: string;
    startMin: number;
    endMin: number;
    durationMin: number;
    rect: { left: number; width: number };
  };
}

const WeekView: React.FC<WeekViewProps> = ({ events, onTaskDrop }) => {
  const currentDate = useCalendarStore(s => s.currentDate);
  const openModal   = useCalendarStore(s => s.openModal);
  const timezone    = useCalendarStore(s => s.timezone);
  const moveEvent   = useCalendarEventsStore(s => s.moveEvent);
  const deleteEvent = useCalendarEventsStore(s => s.deleteEvent);
  const addEvent    = useCalendarEventsStore(s => s.addEvent);

  const dragState     = useDragStore(s => s.dragState);
  const startDrag     = useDragStore(s => s.startDrag);
  const updateDragPreview = useDragStore(s => s.updateDragPreview);
  const commitDrag    = useDragStore(s => s.commitDrag);
  const cancelDrag    = useDragStore(s => s.cancelDrag);

  const weekDays = useMemo(() => getDaysInWeek(currentDate), [currentDate]);
  const todayDateStr = new Date().toDateString();
  const today = useMemo(() => new Date(), [todayDateStr]);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HoverIndicatorHandle>(null);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const pendingDragRef = useRef<PendingDrag | null>(null);
  const [now, setNow] = useState(new Date());
  const [showJumpToNow, setShowJumpToNow] = useState(false);
  const {
    selectedTime,
    selectedTimeLabel,
    conflictEvents,
    isDialogOpen,
    isSheetOpen,
    setIsDialogOpen,
    setIsSheetOpen,
    startConflictFlow,
    closeDialog,
    openSheetFromDialog,
    closeAll,
    removeConflictEvent,
  } = useTimelineConflict();

  const TOTAL_HEIGHT = 24 * HOUR_HEIGHT;
  const PX_PER_MIN = HOUR_HEIGHT / 60;

  /* ── Virtualization: visible time window from scroll position ── */
  const timeRange = useVisibleTimeRange(scrollContainerRef, 120);

  /* ── Per-day precomputed data (single O(N) grouping pass) ── */
  const { eventsByDay, overlapMaps, hourOccupancyMaps, dayDensityMap, compressedHoursByDay, isCompact } = useMemo(() => {
    const byDay = new Map<string, EventInstance[]>();
    weekDays.forEach((date) => byDay.set(formatDateISO(date), []));
    events.forEach((e) => {
      const bucket = byDay.get(e.instanceDate);
      if (bucket) bucket.push(e);
    });

    const overlapMaps = new Map<string, ReturnType<typeof calculateOverlapsWithGuard>>();
    const hourOccupancyMaps = new Map<string, Map<number, boolean>>();
    const dayDensityMap = new Map<string, number>();
    const compressedHoursByDay = new Map<string, Map<number, HourDensityData>>();
    let anyCompact = false;

    weekDays.forEach((date) => {
      const ds = formatDateISO(date);
      const evs = byDay.get(ds)!;
      const result = calculateOverlapsWithGuard(evs);
      overlapMaps.set(ds, result);
      if (result.isCompact && !DISABLE_WEEK_DENSITY_COMPACTION) anyCompact = true;
      hourOccupancyMaps.set(ds, buildHourOccupancyMap(evs));

      const hourDensity = new Map<number, HourDensityData>();
      if (!DISABLE_WEEK_DENSITY_COMPACTION) {
        for (let hour = 0; hour < 24; hour += 1) {
          const slotStart = hour * 60;
          const slotEnd = slotStart + 60;
          const inHour = evs.filter((event) => {
            const start = timeToMinutes(event.startTime);
            const end = timeToMinutes(event.endTime);
            return end > slotStart && start < slotEnd;
          });
          if (inHour.length > MAX_VISIBLE_PER_HOUR) {
            const isDense = inHour.length > DENSE_HOUR_THRESHOLD;
            hourDensity.set(hour, {
              overflow: inHour.length - MAX_VISIBLE_PER_HOUR,
              isDense,
              events: inHour,
            });
          }
        }
      }
      compressedHoursByDay.set(ds, hourDensity);

      const mins = evs.reduce((sum, e) => {
        const dur = Math.max(0, timeToMinutes(e.endTime) - timeToMinutes(e.startTime));
        return sum + dur;
      }, 0);
      dayDensityMap.set(ds, Math.min(1, mins / 1440));
    });

    return {
      eventsByDay: byDay,
      overlapMaps,
      hourOccupancyMaps,
      dayDensityMap,
      compressedHoursByDay,
      isCompact: anyCompact,
    };
  }, [events, weekDays]);

  /* ── Aggregate virtualization stats for perf debug ── */
  const totalRenderedRef = useRef({ total: events.length, rendered: 0, skipped: 0 });
  const renderedCount = useMemo(() => {
    const maxPerDay = Math.floor(MAX_DOM_NODES / 7);
    let count = 0;
    for (const dayEvs of eventsByDay.values()) {
      const vis = getVisibleEvents(dayEvs, timeRange.renderStartMin, timeRange.renderEndMin);
      count += Math.min(vis.length, maxPerDay);
    }
    return count;
  }, [eventsByDay, timeRange.renderStartMin, timeRange.renderEndMin]);
  totalRenderedRef.current = { total: events.length, rendered: renderedCount, skipped: events.length - renderedCount };

  let compressedHourTotal = 0;
  for (const m of compressedHoursByDay.values()) compressedHourTotal += m.size;
  usePerfDebug(totalRenderedRef.current, isCompact, compressedHourTotal);

  const openNewEventAtMinute = useCallback((dateISO: string, minute: number) => {
    openModal(undefined, dateISO, minutesToHHMM(minute));
  }, [openModal]);

  /* ── Slot click handlers ── */
  const handleTimelineSlotClick = useCallback((payload: TimelineSlotClickPayload) => {
    if (isDraggingRef.current || dragState.isDragging) return;

    const dayEvents = eventsByDay.get(payload.dateISO) ?? [];
    const overlaps = dayEvents
      .filter((event) => {
        const start = timeToMinutes(event.startTime);
        const end = timeToMinutes(event.endTime);
        return start <= payload.clickedMinute && payload.clickedMinute < end;
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (overlaps.length === 0) {
      openNewEventAtMinute(payload.dateISO, payload.clickedMinute);
      return;
    }

    payload.triggerHighlight();
    startConflictFlow({
      dateISO: payload.dateISO,
      clickedMinute: payload.clickedMinute,
      overlappingEvents: overlaps,
    });
  }, [dragState.isDragging, eventsByDay, openNewEventAtMinute, startConflictFlow]);

  const handleAddNewFromConflict = useCallback(() => {
    if (!selectedTime) return;
    closeAll();
    openNewEventAtMinute(selectedTime.dateISO, selectedTime.clickedMinute);
  }, [selectedTime, closeAll, openNewEventAtMinute]);

  const handleOpenEventFromSheet = useCallback((eventId: string) => {
    closeAll();
    openModal(eventId);
  }, [closeAll, openModal]);

  const handleDeleteEventFromSheet = useCallback((eventId: string) => {
    deleteEvent(eventId);
    removeConflictEvent(eventId);
  }, [deleteEvent, removeConflictEvent]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dragState.isDragging) return;
    const onWindowPointerUp = (evt: PointerEvent) => {
      if (dragState.pointer?.pointerId != null && evt.pointerId !== dragState.pointer.pointerId) return;
      commitDrag();
    };
    const onWindowPointerCancel = () => cancelDrag();
    const onWindowBlur = () => cancelDrag();
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerCancel);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerCancel);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [dragState.isDragging, dragState.pointer?.pointerId, commitDrag, cancelDrag]);

  useEffect(() => {
    isDraggingRef.current = dragState.isDragging;
    if (dragState.isDragging) {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      hoverRef.current?.hide();
    }
  }, [dragState.isDragging]);

  useEffect(() => {
    const scrollMins = now.getHours() * 60 + now.getMinutes();
    if (scrollContainerRef.current) {
      const top = Math.max(0, (scrollMins / 60) * HOUR_HEIGHT - 200);
      scrollContainerRef.current.scrollTop = top;
    }
  }, []);

  useEffect(() => {
    return () => { if (pendingDragRef.current) clearTimeout(pendingDragRef.current.timerId); };
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop: st, clientHeight: ch } = scrollContainerRef.current;
    const nowPos = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;
    setShowJumpToNow(!(nowPos >= st && nowPos <= st + ch));
  };

  const jumpToNow = () => {
    const nowPos = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;
    scrollContainerRef.current?.scrollTo({ top: nowPos - 200, behavior: 'smooth' });
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pending = pendingDragRef.current;
    if (pending && e.pointerId === pending.pointerId) {
      const dx = Math.abs(e.clientX - pending.startX);
      const dy = Math.abs(e.clientY - pending.startY);
      if (dx > 8 || dy > 8) {
        clearTimeout(pending.timerId);
        pendingDragRef.current = null;
        startDrag(pending.eventId, pending.pointerId, pending.offsetY, pending.origin);
      }
      return;
    }

    if (!dragState.isDragging || e.pointerId !== dragState.pointer?.pointerId) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const wrap = contentWrapRef.current;
      if (!container || !wrap || !dragState.draggedEventId || !dragState.origin) return;

      const rect = container.getBoundingClientRect();
      const pointerY = e.clientY - rect.top + container.scrollTop;
      const eventTopPx = Math.max(0, pointerY - dragState.pointer.offsetYWithinEventPx);
      const minsFromMidnight = (eventTopPx / TOTAL_HEIGHT) * 1440;
      const snappedMins = Math.floor(minsFromMidnight / 15) * 15;
      const durationMin = dragState.origin.durationMin;
      const startMin = Math.max(0, snappedMins);
      const endMin = Math.min(1440, startMin + durationMin);

      const SIDEBAR_W = 80;
      const gridWidth = wrap.offsetWidth - SIDEBAR_W;
      const colWidth = gridWidth / 7;
      const xInGrid = e.clientX - rect.left - SIDEBAR_W;
      const colIndex = Math.max(0, Math.min(6, Math.floor(xInGrid / colWidth)));

      const targetDateStr = formatDateISO(weekDays[colIndex]);
      const dayEvents = eventsByDay.get(targetDateStr) ?? [];
      const visibleDayEvents = getVisibleEvents(dayEvents, timeRange.renderStartMin, timeRange.renderEndMin);
      const collision = calculateDragCollision(visibleDayEvents, dragState.draggedEventId, startMin, endMin);

      updateDragPreview({
        dayKey: targetDateStr, startMin, endMin,
        topPx: eventTopPx,
        heightPx: (durationMin / 60) * HOUR_HEIGHT,
        columnIndex: collision.columnIndex,
        columnCount: collision.columnCount,
      });
    });
  }, [dragState, eventsByDay, weekDays, TOTAL_HEIGHT, updateDragPreview, timeRange.renderStartMin, timeRange.renderEndMin, startDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pending = pendingDragRef.current;
    if (pending && e.pointerId === pending.pointerId) {
      clearTimeout(pending.timerId);
      pendingDragRef.current = null;
      openModal(pending.eventId);
      return;
    }
    if (dragState.isDragging && e.pointerId === dragState.pointer?.pointerId) {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      commitDrag();
    }
  }, [dragState, commitDrag, openModal]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pending = pendingDragRef.current;
    if (pending && e.pointerId === pending.pointerId) {
      clearTimeout(pending.timerId);
      pendingDragRef.current = null;
      return;
    }
    if (dragState.isDragging && e.pointerId === dragState.pointer?.pointerId) {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      cancelDrag();
    }
  }, [dragState, cancelDrag]);

  const hoverLabel = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = Math.floor(totalMinutes % 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if ((e.target as HTMLElement).closest('[data-hover-card]')) { hoverRef.current?.hide(); return; }
    const container = scrollContainerRef.current;
    const wrap = contentWrapRef.current;
    if (!container || !wrap) return;
    const rect = container.getBoundingClientRect();
    const relativeY = e.clientY - rect.top + container.scrollTop;
    const clamped = Math.max(0, Math.min(TOTAL_HEIGHT - 1, relativeY));
    const minutes = (clamped / TOTAL_HEIGHT) * 1440;
    const SIDEBAR_W = 80;
    const gridWidth = wrap.offsetWidth - SIDEBAR_W;
    const colWidth = gridWidth / 7;
    const xInGrid = e.clientX - rect.left - SIDEBAR_W;
    const colIndex = Math.max(0, Math.min(6, Math.floor(xInGrid / colWidth)));
    const colLeftPx = SIDEBAR_W + colIndex * colWidth;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      hoverRef.current?.update(clamped, hoverLabel(minutes), colLeftPx);
    });
  }, [TOTAL_HEIGHT]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    hoverRef.current?.hide();
  }, []);

  const timeIndicatorTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;
  let totalRendered = 0;

  return (
    <CalendarSurface className="relative" role="grid">
      {isSheetOpen && (
        <div className="pointer-events-none absolute inset-0 z-30 bg-black/10" />
      )}

      {/* Header */}
      <div className={`flex sticky top-0 z-30 ${HEADER_CLS}`}>
        <div className="w-20 border-r border-border flex items-center justify-center">
          <span className={TIME_LABEL_CLS}>GMT</span>
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((date, idx) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={idx} className="py-4 flex flex-col items-center gap-1 border-r border-border last:border-r-0">
                <span className={WEEKDAY_LABEL_CLS}>{DAYS[date.getDay()]}</span>
                <span className={`text-sm font-extrabold w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150 ${isToday ? TODAY_BADGE_CLS : DATE_NUMBER_CLS}`}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Canvas */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative"
      >
        <div
          ref={contentWrapRef}
          className="flex relative touch-none select-none"
          style={{ minHeight: `${TOTAL_HEIGHT}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <HoverTimeIndicator ref={hoverRef} />
          <div className={TIME_SIDEBAR_CLS}>
            {hours.map(hour => (
              <div key={hour} className="flex flex-col items-center justify-start" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className={`${TIME_LABEL_CLS} pt-1`}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 relative">
            <DragGhost dayKeys={weekDays.map(d => formatDateISO(d))} />

            {timeIndicatorTop > 0 && weekDays.some(d => isSameDay(d, now)) && (
              <div className="absolute left-0 right-0 z-40 pointer-events-none flex items-center" style={{ top: `${timeIndicatorTop}px` }}>
                <div className="h-[2px] flex-1 bg-red-500 opacity-60 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full shadow-lg flex items-center gap-1.5">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )}

            {weekDays.map((date, dayIdx) => {
              const dateStr = formatDateISO(date);
              const dayEvents = eventsByDay.get(dateStr) ?? [];
              const visibleDayEvents = getVisibleEvents(dayEvents, timeRange.renderStartMin, timeRange.renderEndMin);
              const maxPerDay = Math.floor(MAX_DOM_NODES / 7);
              const cappedEvents = DISABLE_WEEK_DENSITY_COMPACTION
                ? visibleDayEvents
                : visibleDayEvents.length > maxPerDay
                  ? visibleDayEvents.slice(0, maxPerDay)
                  : visibleDayEvents;
              totalRendered += cappedEvents.length;
              const overlapResult = overlapMaps.get(dateStr)!;
              const overlapMap = overlapResult.overlapMap;
              const hourOccMap = hourOccupancyMaps.get(dateStr);

              return (
                <div key={dayIdx} className="relative border-r border-border/60 last:border-r-0 h-full" role="gridcell">
                  {(dayDensityMap.get(dateStr) ?? 0) > 0 && (
                    <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundColor: `hsl(var(--primary) / ${Math.min(0.10, (dayDensityMap.get(dateStr) ?? 0) * 0.3)})` }} />
                  )}

                  <div className="absolute inset-0" style={{ zIndex: 2 }}>
                    {hours.map((hour) => (
                      <TimeSlotCell
                        key={`${dateStr}-${hour}`}
                        slotKey={makeSlotKey(dateStr, hour * 60)}
                        dateISO={dateStr}
                        hour={hour}
                        hasEvents={hourOccMap?.get(hour) ?? false}
                        onSlotClick={handleTimelineSlotClick}
                        onTaskDrop={onTaskDrop}
                      />
                    ))}
                  </div>

                  <div className="absolute inset-0 z-10 pointer-events-none pt-0.5">
                    {cappedEvents.map((event) => {
                      const layout = overlapMap?.get(event.id);
                      if (layout && layout.column === -1) return null;
                      const totalCols = layout?.totalColumns ?? 1;
                      const col = layout?.column ?? 0;
                      const renderInitialsMode = (layout?.overlapCount ?? 1) >= 3;

                      return (
                        <TimeGridEvent
                          key={event.id}
                          event={event}
                          renderInitialsMode={renderInitialsMode}
                          onClick={(id) => openModal(id)}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const target = e.currentTarget as HTMLElement;
                            try { target.setPointerCapture?.(e.pointerId); } catch {}
                            const rect = target.getBoundingClientRect();
                            const originStartMin = timeToMinutes(event.startTime);
                            const originEndMin = timeToMinutes(event.endTime);
                            const origin = {
                              dayKey: dateStr,
                              startMin: originStartMin,
                              endMin: originEndMin,
                              durationMin: originEndMin - originStartMin,
                              rect: { left: rect.left, width: rect.width },
                            };
                            const offsetY = e.clientY - rect.top;
                            const timerId = setTimeout(() => {
                              pendingDragRef.current = null;
                              startDrag(event.id, e.pointerId, offsetY, origin);
                            }, 500);
                            pendingDragRef.current = {
                              timerId, eventId: event.id, pointerId: e.pointerId,
                              offsetY, startX: e.clientX, startY: e.clientY, origin,
                            };
                          }}
                          isDraggedOrigin={dragState.draggedEventId === event.id}
                          width={`${100 / totalCols}%`}
                          left={`${(col / totalCols) * 100}%`}
                          hasConflict={layout?.hasConflict}
                        />
                      );
                    })}
                  </div>

                  {!DISABLE_WEEK_DENSITY_COMPACTION && Array.from((compressedHoursByDay.get(dateStr) ?? new Map<number, HourDensityData>()).entries()).map(([hour, hourData]) => (
                    <DensityOverflowIndicator
                      key={`overflow-${dateStr}-${hour}`}
                      hour={hour}
                      overflow={hourData.overflow}
                      isDense={hourData.isDense}
                      hourEvents={hourData.events}
                      onEventClick={(id) => openModal(id)}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
              <p className="text-muted-foreground/50 text-sm font-medium select-none">No events this week</p>
            </div>
          )}
        </div>
      </div>

      {showJumpToNow && (
        <button
          onClick={jumpToNow}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-white text-xs font-bold rounded-lg shadow-elevated z-50 hover:bg-primary-hover transition-all flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          Jump to Now
        </button>
      )}

      <TimelineConflictDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onViewExisting={openSheetFromDialog}
        onAddNewEvent={handleAddNewFromConflict}
        onCancel={closeDialog}
      />
      <TimelineConflictSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        selectedTimeLabel={selectedTimeLabel}
        events={conflictEvents}
        onOpenEvent={handleOpenEventFromSheet}
        onDeleteEvent={handleDeleteEventFromSheet}
      />
    </CalendarSurface>
  );
};

export default WeekView;
