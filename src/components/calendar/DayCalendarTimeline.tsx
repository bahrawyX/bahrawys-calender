'use client';

/**
 * DayCalendarTimeline — shared scrollable time-grid used by both
 * DayView (full 0–24 h) and the Daily Planner (7–22 h window).
 *
 * Virtualization: only events intersecting the visible scroll window
 * (plus buffer) are rendered. The overlap layout is still computed from
 * the full event list so column positions remain correct.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EventInstance } from '../../types';
import {
  HOUR_HEIGHT,
  calculateOverlaps,
  isSameDay,
  timeToMinutes,
} from '../../utils/dateUtils';
import { TIME_LABEL_CLS, TIME_SIDEBAR_CLS } from '../ui/CalendarShared';
import TimeGridEvent from '../TimeGridEvent';
import { PlannedTaskCard } from '../planner/PlannedTaskCard';
import type { PlannedTaskItem } from '../../store/useDailyPlanStore';
import type { Task } from '../../types/task';
import { getVisibleEvents } from '../../utils/calendar/getVisibleEvents';
import {
  useVisibleTimeRange,
  calculateOverlapsWithGuard,
  DensityOverflowIndicator,
  MAX_VISIBLE_PER_HOUR,
  DENSE_HOUR_THRESHOLD,
} from './virtualization';
import type { HourDensityData } from './virtualization';

// ── Constants ─────────────────────────────────────────────────────────────────

const SNAP_MINS = 15;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const MAX_DOM_NODES_PER_DAY = 150;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function minsToTime(mins: number): string {
  const c = Math.max(0, Math.min(mins, 23 * 60 + 59));
  return `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`;
}

function snapToGrid(mins: number): number {
  return Math.round(mins / SNAP_MINS) * SNAP_MINS;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function formatTimeMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

// ── Positioned planner block ──────────────────────────────────────────────────

const PlannedBlock: React.FC<{
  planItem: PlannedTaskItem;
  task: Task | undefined;
  startHour: number;
  onRemove: (id: string) => void;
  onMarkDone?: (taskId: string) => void;
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
  isDragging: boolean;
  planDragRef: React.RefObject<PlanDragData | null>;
  left: string;
  width: string;
  revealDelayMs?: number;
}> = React.memo(({ planItem, task, startHour, onRemove, onMarkDone, onDragHandlePointerDown, isDragging, planDragRef, left, width, revealDelayMs }) => {
  const durMins = timeToMinutes(planItem.endTime) - timeToMinutes(planItem.startTime);
  const originalTop = (timeToMinutes(planItem.startTime) - startHour * 60) * PX_PER_MIN;
  const height = Math.max(32, durMins * PX_PER_MIN * 0.9);

  const blockRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = blockRef.current;
    const tip = tooltipRef.current;
    if (!isDragging || !el) {
      if (el) {
        el.style.transform = '';
        el.style.willChange = '';
        el.style.zIndex = '';
      }
      if (tip) tip.style.display = 'none';
      return;
    }
    el.style.willChange = 'transform';
    let raf: number;
    const loop = () => {
      const drag = planDragRef.current;
      if (drag && el) {
        const newTop = (drag.previewStartMins - startHour * 60) * PX_PER_MIN;
        el.style.transform = `translateY(${newTop - originalTop}px)`;
        el.style.zIndex = '30';
        if (tip) {
          tip.style.display = 'block';
          const label = tip.querySelector('[data-tip-label]') as HTMLElement | null;
          if (label) label.textContent = `${formatTimeMins(drag.previewStartMins)} – ${formatTimeMins(drag.previewStartMins + drag.durationMins)}`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (el) {
        el.style.transform = '';
        el.style.willChange = '';
        el.style.zIndex = '';
      }
      if (tip) tip.style.display = 'none';
    };
  }, [isDragging, originalTop, planDragRef, startHour]);

  return (
    <motion.div
      ref={blockRef}
      className="absolute z-20"
      style={{ top: originalTop, height, left, width, paddingRight: 2 }}
      initial={revealDelayMs !== undefined ? { opacity: 0, y: 6, scale: 0.985 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(1px)' }}
      transition={
        revealDelayMs !== undefined
          ? { duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: revealDelayMs / 1000 }
          : { duration: 0.22, ease: [0.2, 0, 0, 1] }
      }
    >
      <div
        ref={tooltipRef}
        style={{ display: 'none' }}
        className="absolute left-0 z-50 -top-6 pointer-events-none"
      >
        <div className="bg-foreground text-background text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap">
          <span data-tip-label />
        </div>
      </div>
      <PlannedTaskCard
        planItem={planItem}
        task={task}
        onRemove={onRemove}
        onMarkDone={onMarkDone}
        onDragHandlePointerDown={onDragHandlePointerDown}
        isDragging={isDragging}
      />
    </motion.div>
  );
});
PlannedBlock.displayName = 'PlannedBlock';

// ── Internal drag state shape ─────────────────────────────────────────────────

interface PlanDragData {
  planItemId: string;
  pointerId: number;
  durationMins: number;
  offsetPx: number;
  previewStartMins: number;
}

// ── Props ─────────────────────────────────────────────────────────────────────

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

  planItems?: PlannedTaskItem[];
  taskMap?: Map<string, Task>;
  revealPlanItemDelays?: Map<string, number>;
  onRemovePlanItem?: (id: string) => void;
  onMarkTaskDone?: (taskId: string) => void;
  onUpdatePlanItemTime?: (id: string, start: string, end: string) => void;

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

// ── Component ─────────────────────────────────────────────────────────────────

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
  planItems,
  taskMap,
  revealPlanItemDelays,
  onRemovePlanItem,
  onMarkTaskDone,
  onUpdatePlanItemTime,
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

  const planDragRef = useRef<PlanDragData | null>(null);
  const planRafRef = useRef<number>(0);
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);

  const isPlannerTimeline = Boolean(planItems);
  const shouldCompactEvents = !isPlannerTimeline && !disableDensityCompaction;

  // ── Derived constants ─────────────────────────────────────────────────────
  const TOTAL_HEIGHT = (endHour - startHour) * HOUR_HEIGHT;
  const MIDNIGHT_OFFSET_PX = startHour * HOUR_HEIGHT;
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  // ── Virtualization: visible time range from scroll ─────────────────────────
  const timeRange = useVisibleTimeRange(scrollRef, 90);
  const adjustedRenderStart = Math.max(0, timeRange.renderStartMin - startHour * 60) + startHour * 60;
  const adjustedRenderEnd = Math.min(endHour * 60, timeRange.renderEndMin);

  // ── Now indicator ─────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowInView = nowMins >= startHour * 60 && nowMins <= endHour * 60;
  const nowTop = (nowMins - startHour * 60) * PX_PER_MIN;

  // ── Unified overlap layout ─────────────────────────────────────────────────
  const overlapResult = useMemo(() => {
    if (!isPlannerTimeline) {
      return calculateOverlapsWithGuard(calendarEvents);
    }

    const timedItems: Array<{ id: string; startTime: string; endTime: string }> = [
      ...calendarEvents.map((ev) => ({ id: ev.id, startTime: ev.startTime, endTime: ev.endTime })),
      ...(planItems ?? []).map((item) => {
        const drag = planDragRef.current;
        if (drag?.planItemId === item.id) {
          const dur = timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
          return { id: item.id, startTime: minsToTime(drag.previewStartMins), endTime: minsToTime(drag.previewStartMins + dur) };
        }
        return { id: item.id, startTime: item.startTime, endTime: item.endTime };
      }),
    ];

    return {
      overlapMap: calculateOverlaps(timedItems as unknown as EventInstance[]),
      isCompact: false,
    };
  }, [calendarEvents, planItems, isPlannerTimeline, draggingPlanId]);

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

  // ── Virtualize: filter to visible calendar events ─────────────────────────
  const visibleCalEvents = useMemo(() => {
    const visible = getVisibleEvents(calendarEvents, adjustedRenderStart, adjustedRenderEnd);
    const compacted = shouldCompactEvents && compressedHours.size > 0
      ? (() => {
          const seenPerHour = new Map<number, number>();
          return visible.filter((event) => {
            const hour = Math.floor(timeToMinutes(event.startTime) / 60);
            const hourData = compressedHours.get(hour);
            if (!hourData) return true;
            // Dense hours: no individual cards — cluster card renders instead
            if (hourData.isDense) return false;
            // Normal overflow: show at most MAX_VISIBLE_PER_HOUR cards
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

  // ── Planner drag initiation ─────────────────────────────────────────────────
  const handlePlanDragStart = useCallback((planItemId: string, e: React.PointerEvent) => {
    if (!planItems || !onUpdatePlanItemTime) return;
    e.preventDefault();
    e.stopPropagation();
    const item = planItems.find((i) => i.id === planItemId);
    if (!item) return;
    const container = scrollRef.current;
    if (!container) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const durMins = timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
    const startMins = timeToMinutes(item.startTime);
    const containerRect = container.getBoundingClientRect();
    const absoluteY = e.clientY - containerRect.top + container.scrollTop;
    const cardTopPx = (startMins - startHour * 60) * PX_PER_MIN;
    const rawOffset = absoluteY - cardTopPx;

    planDragRef.current = {
      planItemId,
      pointerId: e.pointerId,
      durationMins: durMins,
      offsetPx: Math.max(0, Math.min(rawOffset, durMins * PX_PER_MIN)),
      previewStartMins: startMins,
    };
    setDraggingPlanId(planItemId);
  }, [planItems, startHour, scrollRef, onUpdatePlanItemTime]);

  // ── Unified pointer handlers ────────────────────────────────────────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (planDragRef.current?.pointerId === e.pointerId) {
      e.preventDefault();
      const container = scrollRef.current;
      if (!container || !planDragRef.current) return;
      cancelAnimationFrame(planRafRef.current);
      planRafRef.current = requestAnimationFrame(() => {
        if (!planDragRef.current) return;
        const rect = container.getBoundingClientRect();
        const absoluteY = e.clientY - rect.top + container.scrollTop;
        const cardTopPx = absoluteY - planDragRef.current.offsetPx;
        const rawStartMins = startHour * 60 + cardTopPx / PX_PER_MIN;
        const snapped = snapToGrid(rawStartMins);
        const clamped = Math.max(
          startHour * 60,
          Math.min(snapped, endHour * 60 - planDragRef.current.durationMins)
        );
        planDragRef.current.previewStartMins = clamped;
      });
    } else {
      calPointerMove?.(e);
    }
  }, [startHour, endHour, scrollRef, calPointerMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (planDragRef.current?.pointerId === e.pointerId) {
      cancelAnimationFrame(planRafRef.current);
      const { planItemId, previewStartMins, durationMins } = planDragRef.current;
      planDragRef.current = null;
      setDraggingPlanId(null);
      onUpdatePlanItemTime?.(
        planItemId,
        minsToTime(previewStartMins),
        minsToTime(previewStartMins + durationMins)
      );
    } else {
      calPointerUp?.(e);
    }
  }, [calPointerUp, onUpdatePlanItemTime]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (planDragRef.current?.pointerId === e.pointerId) {
      cancelAnimationFrame(planRafRef.current);
      planDragRef.current = null;
      setDraggingPlanId(null);
    } else {
      calPointerCancel?.(e);
    }
  }, [calPointerCancel]);

  // ── Memoized static grid lines ─────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
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
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {children}

        {/* ── Time labels sidebar ──────────────────────────────────────── */}
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

        {/* ── Grid body ────────────────────────────────────────────────── */}
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

          {/* z-40 — NOW indicator */}
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

          {/* z-10 — Calendar event cards (virtualized) */}
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

          {/* z-20 — Planner task blocks */}
          <AnimatePresence initial={false}>
            {planItems && planItems.map((item) => {
              const layout = combinedOverlapMap.get(item.id);
              const totalCols = layout?.totalColumns ?? 1;
              const col = layout?.column ?? 0;
              const pct = 100 / totalCols;
              return (
                <PlannedBlock
                  key={item.id}
                  planItem={item}
                  task={taskMap?.get(item.taskId)}
                  startHour={startHour}
                  onRemove={onRemovePlanItem ?? (() => {})}
                  onMarkDone={onMarkTaskDone}
                  isDragging={draggingPlanId === item.id}
                  planDragRef={planDragRef}
                  onDragHandlePointerDown={(e) => handlePlanDragStart(item.id, e)}
                  left={`${col * pct}%`}
                  width={`${pct}%`}
                  revealDelayMs={revealPlanItemDelays?.get(item.id)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

DayCalendarTimeline.displayName = 'DayCalendarTimeline';
