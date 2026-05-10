import { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import type { CalendarEvent } from '../types';
import type { PlannedTaskItem } from '../store/useDailyPlanStore';

// ── Time math ─────────────────────────────────────────────────────────────────
import { timeToMinutes, minutesToTime } from './time/timeUtils';
export { timeToMinutes, minutesToTime } from './time/timeUtils';

export function addMinsToTime(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins);
}

export function durationMinutes(startTime: string, endTime: string): number {
  return Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));
}

// ── Overlap detection ─────────────────────────────────────────────────────────

export interface TimeRange {
  startTime: string;
  endTime: string;
}

/** Find the earliest start time where a range of `durationMins` fits without overlapping existing ranges. */
export function findNextFreeSlot(
  existing: TimeRange[],
  durationMins: number,
  startAfter = '00:00',
  dayEnd = '23:59'
): string | null {
  const sorted = [...existing].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  let cursor = timeToMinutes(startAfter);
  const end = timeToMinutes(dayEnd);

  for (const block of sorted) {
    const bStart = timeToMinutes(block.startTime);
    const bEnd = timeToMinutes(block.endTime);
    if (cursor + durationMins <= bStart) return minutesToTime(cursor);
    if (bEnd > cursor) cursor = bEnd;
  }
  if (cursor + durationMins <= end) return minutesToTime(cursor);
  return null;
}

// ── Free block computation ────────────────────────────────────────────────────

export interface FreeBlock {
  startTime: string;
  endTime: string;
  durationMins: number;
}

export function computeFreeBlocks(
  busyRanges: TimeRange[],
  dayStart = '00:00',
  dayEnd = '23:59'
): FreeBlock[] {
  const sorted = [...busyRanges]
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const blocks: FreeBlock[] = [];
  let cursor = timeToMinutes(dayStart);
  const end = timeToMinutes(dayEnd);

  for (const range of sorted) {
    const rStart = timeToMinutes(range.startTime);
    const rEnd = timeToMinutes(range.endTime);
    if (rStart > cursor) {
      blocks.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(rStart),
        durationMins: rStart - cursor,
      });
    }
    if (rEnd > cursor) cursor = rEnd;
  }

  if (cursor < end) {
    blocks.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(end),
      durationMins: end - cursor,
    });
  }

  return blocks.filter((b) => b.durationMins >= 15);
}

// ── Summary computation ───────────────────────────────────────────────────────

export interface PlanSummary {
  plannedCount: number;
  plannedMinutes: number;
  unplannedCount: number;
  topFreeBlock: FreeBlock | null;
}

export function computePlanSummary(
  planItems: PlannedTaskItem[],
  calendarEvents: CalendarEvent[],
  totalUnplannedTasks: number
): PlanSummary {
  const plannedMinutes = planItems.reduce(
    (sum, item) => sum + durationMinutes(item.startTime, item.endTime),
    0
  );

  const allBusy: TimeRange[] = [
    ...calendarEvents.map((e) => ({ startTime: e.startTime, endTime: e.endTime })),
    ...planItems.map((i) => ({ startTime: i.startTime, endTime: i.endTime })),
  ];

  const freeBlocks = computeFreeBlocks(allBusy);
  const topFreeBlock = freeBlocks.sort((a, b) => b.durationMins - a.durationMins)[0] ?? null;

  return {
    plannedCount: planItems.length,
    plannedMinutes,
    unplannedCount: totalUnplannedTasks,
    topFreeBlock,
  };
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

// ── Default duration for a newly planned task ─────────────────────────────────

export const DEFAULT_TASK_DURATION_MINS = 60;

// ── Pixel constants for timeline ──────────────────────────────────────────────

export const TIMELINE_START_HOUR = 0;
export const TIMELINE_END_HOUR = 24;
export const SLOT_HEIGHT_PX = 64; // px per hour (legacy – rendering uses HOUR_HEIGHT from dateUtils)
export const PX_PER_MINUTE = SLOT_HEIGHT_PX / 60;
export const TIMELINE_TOTAL_PX = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * SLOT_HEIGHT_PX;
