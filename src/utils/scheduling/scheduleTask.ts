/**
 * scheduleTask — picks the best free slot for a task and returns the chosen
 * start/end time, or a typed error when no slot is available.
 *
 * Selection rules (in priority order):
 *  1. Earliest slot that starts at-or-after `nowMins` and fits the task.
 *  2. Earliest slot overall (past or future) that fits the task.
 *  3. No slot → return an error.
 */
import { minutesToTime } from '../dateUtils';
import { findFreeTime } from './findFreeTime';
import { mergeOccupied, TimedItem } from './timelineMerge';

export const DEFAULT_DURATION_MINS = 30;

export type ScheduleResult =
  | { ok: true; startTime: string; endTime: string }
  | { ok: false; reason: 'no_free_time' | 'task_too_long' };

/**
 * @param durationMins   How long the task needs (minutes).
 * @param calendarItems  Calendar events for today.
 * @param planItems      Planned task items for today.
 * @param nowMins        Current time in minutes-from-midnight (used to prefer future slots).
 * @param dayStart       Window start (default 0).
 * @param dayEnd         Window end (default 1440).
 */
export function scheduleTask(
  durationMins: number,
  calendarItems: TimedItem[],
  planItems: TimedItem[],
  nowMins: number,
  dayStart = 0,
  dayEnd = 1440,
): ScheduleResult {
  const occupied = mergeOccupied(calendarItems, planItems);
  const free = findFreeTime(occupied, dayStart, dayEnd);

  if (free.length === 0) {
    return { ok: false, reason: 'no_free_time' };
  }

  // Check whether any slot is long enough at all
  const longestSlot = free.reduce((max, s) => s.lengthMins > max ? s.lengthMins : max, 0);
  if (longestSlot < durationMins) {
    return { ok: false, reason: 'task_too_long' };
  }

  // Prefer a slot that starts at-or-after now and is long enough
  const preferredSlot = free.find(
    (s) => s.startMins >= nowMins && s.lengthMins >= durationMins,
  );

  // Fall back to earliest slot that fits (could be in the past)
  const fallbackSlot = free.find((s) => s.lengthMins >= durationMins);

  const chosen = preferredSlot ?? fallbackSlot!;

  // If nowMins falls inside the chosen slot, start from now rather than the slot boundary
  const startMins = Math.max(chosen.startMins, nowMins);
  const endMins = startMins + durationMins;

  // Ensure the resolved slot doesn't overflow the day window
  if (endMins > dayEnd) {
    return { ok: false, reason: 'task_too_long' };
  }

  return {
    ok: true,
    startTime: minutesToTime(startMins),
    endTime: minutesToTime(endMins),
  };
}
