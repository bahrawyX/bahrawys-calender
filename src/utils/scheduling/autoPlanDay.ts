/**
 * autoPlanDay — pure scheduler that fits unscheduled tasks into the
 * remaining free time of a day.
 *
 * Sort order: priority (high → medium → low), then chronological createdAt.
 * Tasks that don't fit the remaining window are silently skipped; scheduling
 * stops entirely once no free slot is wide enough for any remaining task.
 */

import type { TaskPriority } from '../../types/task';
import { addMinsToTime, DEFAULT_TASK_DURATION_MINS, timeToMinutes } from '../dailyPlanUtils';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
const MAX_EVENTS_PER_HOUR = 10;
const DAY_START_MINS = 0;

interface MinuteRange {
  startMins: number;
  endMins: number;
}

export interface AutoPlanTask {
  id: string;
  priority: TaskPriority;
  createdAt: string;
  /** Estimated work duration in minutes. Falls back to DEFAULT_TASK_DURATION_MINS. */
  durationMinutes?: number;
}

export interface AutoPlanAssignment {
  taskId: string;
  startTime: string;
  endTime: string;
}

/**
 * @param tasks       Unscheduled pool tasks to place.
 * @param busyRanges  Already-occupied time ranges for today (events + plan items).
 * @param nowTime     Current time as "HH:mm" — tasks will not be placed before this.
 * @param dayEnd      End of the schedulable window (default "22:00").
 * @returns           Ordered list of time assignments; may be shorter than `tasks` if
 *                    the day fills up or all remaining slots are too narrow.
 */
export function autoPlanDay(
  tasks: AutoPlanTask[],
  busyRanges: { startTime: string; endTime: string }[],
  nowTime: string,
  dayEnd = '22:00',
): AutoPlanAssignment[] {
  const dayEndMins = timeToMinutes(dayEnd);
  const nowMins = Math.max(DAY_START_MINS, Math.min(timeToMinutes(nowTime), dayEndMins));

  const sorted = [...tasks].sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const mergedBusy = normalizeBusyRanges(busyRanges, DAY_START_MINS, dayEndMins);
  const freeSlots = buildFreeSlots(mergedBusy, DAY_START_MINS, dayEndMins);
  const hourLoad = buildHourLoad(mergedBusy);
  const assignments: AutoPlanAssignment[] = [];

  if (freeSlots.length === 0) return assignments;

  for (let i = 0; i < sorted.length; i += 1) {
    const task = sorted[i];
    const duration = task.durationMinutes ?? DEFAULT_TASK_DURATION_MINS;
    let placed = false;

    for (let slotIndex = 0; slotIndex < freeSlots.length; slotIndex += 1) {
      const slot = freeSlots[slotIndex];
      const candidateStart = Math.max(slot.startMins, nowMins);
      const candidateEnd = candidateStart + duration;

      if (candidateEnd > slot.endMins || candidateEnd > dayEndMins) {
        continue;
      }

      if (!canPlaceWithinHourDensity(hourLoad, candidateStart, candidateEnd)) {
        continue;
      }

      assignments.push({
        taskId: task.id,
        startTime: minsToTime(candidateStart),
        endTime: minsToTime(candidateEnd),
      });

      bumpHourLoad(hourLoad, candidateStart, candidateEnd);
      splitFreeSlot(freeSlots, slotIndex, candidateStart, candidateEnd);
      placed = true;
      break;
    }

    if (!placed) {
      const minRemaining = sorted
        .slice(i)
        .reduce((min, t) => Math.min(min, t.durationMinutes ?? DEFAULT_TASK_DURATION_MINS), Number.POSITIVE_INFINITY);
      const largestRemainingSlot = freeSlots.reduce((max, slot) => {
        const available = slot.endMins - Math.max(slot.startMins, nowMins);
        return Math.max(max, available);
      }, 0);

      if (largestRemainingSlot < minRemaining) {
        break;
      }
    }
  }

  return assignments;
}

function minsToTime(totalMins: number): string {
  const clamped = Math.max(0, Math.min(1439, totalMins));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function normalizeBusyRanges(
  busyRanges: { startTime: string; endTime: string }[],
  dayStartMins: number,
  dayEndMins: number,
): MinuteRange[] {
  const sorted = busyRanges
    .map((range) => ({
      startMins: Math.max(dayStartMins, Math.min(timeToMinutes(range.startTime), dayEndMins)),
      endMins: Math.max(dayStartMins, Math.min(timeToMinutes(range.endTime), dayEndMins)),
    }))
    .filter((range) => range.endMins > range.startMins)
    .sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);

  const merged: MinuteRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.startMins > last.endMins) {
      merged.push({ ...range });
      continue;
    }
    last.endMins = Math.max(last.endMins, range.endMins);
  }
  return merged;
}

function buildFreeSlots(
  mergedBusy: MinuteRange[],
  dayStartMins: number,
  dayEndMins: number,
): MinuteRange[] {
  const slots: MinuteRange[] = [];
  let cursor = dayStartMins;

  for (const block of mergedBusy) {
    if (block.startMins > cursor) {
      slots.push({ startMins: cursor, endMins: block.startMins });
    }
    cursor = Math.max(cursor, block.endMins);
  }

  if (cursor < dayEndMins) {
    slots.push({ startMins: cursor, endMins: dayEndMins });
  }

  return slots;
}

function splitFreeSlot(
  freeSlots: MinuteRange[],
  slotIndex: number,
  placedStart: number,
  placedEnd: number,
): void {
  const slot = freeSlots[slotIndex];
  const next: MinuteRange[] = [];

  if (placedStart > slot.startMins) {
    next.push({ startMins: slot.startMins, endMins: placedStart });
  }
  if (placedEnd < slot.endMins) {
    next.push({ startMins: placedEnd, endMins: slot.endMins });
  }

  freeSlots.splice(slotIndex, 1, ...next);
}

function buildHourLoad(blocks: MinuteRange[]): number[] {
  const hourLoad = new Array<number>(24).fill(0);
  for (const block of blocks) {
    const startHour = Math.floor(block.startMins / 60);
    const endHour = Math.floor((Math.max(block.endMins - 1, block.startMins)) / 60);
    for (let hour = startHour; hour <= endHour; hour += 1) {
      if (hour >= 0 && hour < 24) hourLoad[hour] += 1;
    }
  }
  return hourLoad;
}

function canPlaceWithinHourDensity(hourLoad: number[], startMins: number, endMins: number): boolean {
  const startHour = Math.floor(startMins / 60);
  const endHour = Math.floor((Math.max(endMins - 1, startMins)) / 60);

  for (let hour = startHour; hour <= endHour; hour += 1) {
    if (hour >= 0 && hour < 24 && hourLoad[hour] >= MAX_EVENTS_PER_HOUR) {
      return false;
    }
  }
  return true;
}

function bumpHourLoad(hourLoad: number[], startMins: number, endMins: number): void {
  const startHour = Math.floor(startMins / 60);
  const endHour = Math.floor((Math.max(endMins - 1, startMins)) / 60);
  for (let hour = startHour; hour <= endHour; hour += 1) {
    if (hour >= 0 && hour < 24) hourLoad[hour] += 1;
  }
}
