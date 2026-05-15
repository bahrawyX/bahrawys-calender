'use client';

/**
 * DayView — adapted for bahrawy-calendar package.
 *
 * All imports now come from 'bahrawy-calendar/compat' instead of relative paths.
 * Removed: useTaskBoardStore, handleTaskDrop (app-level concerns).
 * Added: optional onTaskDrop prop for external task-to-calendar integration.
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { EventInstance } from 'bahrawy-calendar';
import {
  useCalendarStore,
  useCalendarEventsStore,
  useDragStore,
  formatDateISO,
  timeToMinutes,
  HOUR_HEIGHT,
  isSameDay,
  buildHourOccupancyMap,
  makeSlotKey,
  minutesToHHMM,
  EVENT_COLORS,
  notify,
  uid,
  calculateDragCollision,
  useTimelineConflict,
} from 'bahrawy-calendar/compat';

// These are local component imports — keep them relative to your project
import HoverTimeIndicator, { HoverIndicatorHandle } from './HoverTimeIndicator';
import { CalendarSurface } from './ui/CalendarShared';
import TimeSlotCell, { TimelineSlotClickPayload } from './TimeSlotCell';
import DragGhost from './DragGhost';
import { DayCalendarTimeline } from './calendar/DayCalendarTimeline';
import { getVisibleEvents } from './calendar/getVisibleEvents';
import TimelineConflictDialog from './calendar/interaction/TimelineConflictDialog';
import TimelineConflictSheet from './calendar/interaction/TimelineConflictSheet';

interface DayViewProps {
  events: EventInstance[];
  /** Optional: called when a task is dropped from an external task board */
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

const DayView: React.FC<DayViewProps> = ({ events, onTaskDrop }) => {
  const currentDate = useCalendarStore(s => s.currentDate);
  const openModal   = useCalendarStore(s => s.openModal);
  const timezone    = useCalendarStore(s => s.timezone);
  const moveEvent   = useCalendarEventsStore(s => s.moveEvent);
  const deleteEvent = useCalendarEventsStore(s => s.deleteEvent);
  const addEvent    = useCalendarEventsStore(s => s.addEvent);

  const dragState          = useDragStore(s => s.dragState);
  const startDrag          = useDragStore(s => s.startDrag);
  const updateDragPreview  = useDragStore(s => s.updateDragPreview);
  const commitDrag         = useDragStore(s => s.commitDrag);
  const cancelDrag         = useDragStore(s => s.cancelDrag);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HoverIndicatorHandle>(null);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const pendingDragRef = useRef<PendingDrag | null>(null);
  const dateStr = formatDateISO(currentDate);

  /* -- Derived data (memoised) -- */
  const dayEvents = useMemo(
    () => events.filter((e) => e.instanceDate === dateStr),
    [events, dateStr]
  );
  const hourOccupancyMap = useMemo(() => buildHourOccupancyMap(dayEvents), [dayEvents]);

  /* -- UI state -- */
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

  const scrollToNow = useCallback(() => {
    if (scrollContainerRef.current) {
      const mins = now.getHours() * 60 + now.getMinutes();
      scrollContainerRef.current.scrollTo({
        top: (mins / 60) * HOUR_HEIGHT - 200,
        behavior: 'smooth',
      });
    }
  }, [now]);

  useEffect(() => { scrollToNow(); }, []);

  useEffect(() => {
    return () => {
      if (pendingDragRef.current) clearTimeout(pendingDragRef.current.timerId);
    };
  }, []);

  useEffect(() => {
    isDraggingRef.current = dragState.isDragging;
    if (dragState.isDragging) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      hoverRef.current?.hide();
    }
  }, [dragState.isDragging]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const nowPos = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;
    const { scrollTop, clientHeight } = scrollContainerRef.current;
    setShowJumpToNow(!(nowPos >= scrollTop && nowPos <= scrollTop + clientHeight));
  };

  /* -- Drag handlers -- */
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

      const snappedMins = Math.floor(minsFromMidnight / 5) * 5;
      const durationMin = dragState.origin.durationMin;

      const startMin = Math.max(0, snappedMins);
      const endMin = Math.min(1440, startMin + durationMin);

      const visibleForCollision = getVisibleEvents(dayEvents, startMin - 120, endMin + 120);
      const collision = calculateDragCollision(visibleForCollision, dragState.draggedEventId, startMin, endMin);

      updateDragPreview({
        dayKey: dateStr,
        startMin,
        endMin,
        topPx: eventTopPx,
        heightPx: (durationMin / 60) * HOUR_HEIGHT,
        columnIndex: collision.columnIndex,
        columnCount: collision.columnCount
      });
    });
  }, [dragState, dayEvents, dateStr, TOTAL_HEIGHT, updateDragPreview, startDrag]);

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

  /* -- Hover time indicator helpers -- */
  const hoverLabel = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = Math.floor(totalMinutes % 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${String(m).padStart(2, '0')} ${period}`;
  };

  const minutesToHHmm = (totalMinutes: number): string =>
    `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(Math.floor(totalMinutes % 60)).padStart(2, '0')}`;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if ((e.target as HTMLElement).closest('[data-hover-card]')) {
      hoverRef.current?.hide();
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeY = e.clientY - rect.top + container.scrollTop;
    const clamped = Math.max(0, Math.min(TOTAL_HEIGHT - 1, relativeY));
    const minutes = (clamped / TOTAL_HEIGHT) * 1440;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      hoverRef.current?.update(clamped, hoverLabel(minutes));
    });
  }, [TOTAL_HEIGHT]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    hoverRef.current?.hide();
  }, []);

  const openNewEventAtMinute = useCallback((dateISO: string, minute: number) => {
    openModal(undefined, dateISO, minutesToHHmm(minute));
  }, [openModal]);

  /* -- Slot click handlers -- */
  const handleTimelineSlotClick = useCallback((payload: TimelineSlotClickPayload) => {
    if (isDraggingRef.current || dragState.isDragging) return;

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
  }, [dayEvents, dragState.isDragging, openNewEventAtMinute, startConflictFlow]);

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

  return (
    <CalendarSurface className="relative">
      {isSheetOpen && (
        <div className="pointer-events-none absolute inset-0 z-30 bg-foreground/5" />
      )}

      <DayCalendarTimeline
        dateStr={dateStr}
        startHour={0}
        endHour={24}
        disableDensityCompaction
        initialsModeThreshold={10}
        adaptiveTitleCompaction={false}
        calendarEvents={dayEvents}
        onCalEventClick={(id) => openModal(id)}
        onCalEventPointerDown={(event, e) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.currentTarget as HTMLElement;
          if (target.setPointerCapture) {
            try {
              target.setPointerCapture(e.pointerId);
            } catch {
              // no-op: capture can fail on stale pointer state
            }
          }
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
          const clientX = e.clientX;
          const clientY = e.clientY;
          const pointerId = e.pointerId;

          const timerId = setTimeout(() => {
            pendingDragRef.current = null;
            startDrag(event.id, pointerId, offsetY, origin);
          }, 500);

          pendingDragRef.current = {
            timerId,
            eventId: event.id,
            pointerId,
            offsetY,
            startX: clientX,
            startY: clientY,
            origin,
          };
        }}
        draggedCalEventId={dragState.draggedEventId}
        calPointerMove={handlePointerMove}
        calPointerUp={handlePointerUp}
        calPointerCancel={handlePointerCancel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onScroll={handleScroll}
        scrollContainerRef={scrollContainerRef}
        contentWrapRef={contentWrapRef}
        gridBodyChildren={
          <>
            <DragGhost dayKeys={[dateStr]} />
            <div className="absolute inset-0" style={{ zIndex: 2 }}>
              {Array.from({ length: 24 }, (_, h) => h).map((hour) => (
                <TimeSlotCell
                  key={`${dateStr}-${hour}`}
                  slotKey={makeSlotKey(dateStr, hour * 60)}
                  dateISO={dateStr}
                  hour={hour}
                  hasEvents={hourOccupancyMap.get(hour) ?? false}
                  onSlotClick={handleTimelineSlotClick}
                  onTaskDrop={onTaskDrop}
                />
              ))}
            </div>
            {dayEvents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                <p className="text-muted-foreground/50 text-sm font-medium select-none">
                  No events today
                </p>
              </div>
            )}
          </>
        }
      >
        <HoverTimeIndicator ref={hoverRef} />
      </DayCalendarTimeline>

      {/* Jump-to-now button */}
      {showJumpToNow && isSameDay(currentDate, now) && (
        <button
          onClick={scrollToNow}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-card/90 backdrop-blur-xl text-foreground text-[11px] font-semibold rounded-full shadow-elevated z-50 hover:bg-card transition-all flex items-center gap-2 border border-border animate-in fade-in slide-in-from-bottom-4 duration-200"
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

export default DayView;
