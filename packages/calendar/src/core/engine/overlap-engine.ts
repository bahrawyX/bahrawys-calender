/**
 * Overlap Engine — slot-aware helpers for event collision detection.
 * All functions are pure: O(n log n) or O(n), memoised at the call site.
 */

export { calculateOverlaps } from '../utils/date-utils';

import type { EventInstance } from '../../types';
import { timeToMinutes } from '../utils/time-utils';
import { eventOverlapsSlot } from './slot-engine';

/**
 * Returns all events from a day's list that overlap a given hour slot.
 * O(n) — called only on slot click, never during hover or scroll.
 */
export const getEventsForSlot = (
  dayEvents: EventInstance[],
  slotStartMinute: number,
  slotDurationMinutes: number,
): EventInstance[] => {
  const slotEnd = slotStartMinute + slotDurationMinutes;
  return dayEvents.filter((e) =>
    eventOverlapsSlot(
      timeToMinutes(e.startTime),
      timeToMinutes(e.endTime),
      slotStartMinute,
      slotEnd,
    ),
  );
};

/**
 * Builds a Map<hour (0–23), boolean> that indicates whether any event
 * touches (even partially) each hour slot.
 */
export const buildHourOccupancyMap = (
  dayEvents: EventInstance[],
): Map<number, boolean> => {
  const map = new Map<number, boolean>();
  for (let h = 0; h < 24; h++) {
    const slotStart = h * 60;
    const slotEnd = slotStart + 60;
    map.set(
      h,
      dayEvents.some((e) =>
        eventOverlapsSlot(
          timeToMinutes(e.startTime),
          timeToMinutes(e.endTime),
          slotStart,
          slotEnd,
        ),
      ),
    );
  }
  return map;
};

/**
 * Returns contiguous free-time blocks for the day.
 */
export const getFreeGapsForDay = (
  dayEvents: EventInstance[],
): Array<{ startMinute: number; durationMinutes: number }> => {
  if (dayEvents.length === 0) return [{ startMinute: 0, durationMinutes: 1440 }];
  const sorted = [...dayEvents].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
  const gaps: Array<{ startMinute: number; durationMinutes: number }> = [];
  let cursor = 0;
  for (const ev of sorted) {
    const evStart = timeToMinutes(ev.startTime);
    if (evStart > cursor)
      gaps.push({ startMinute: cursor, durationMinutes: evStart - cursor });
    cursor = Math.max(cursor, timeToMinutes(ev.endTime));
  }
  if (cursor < 1440)
    gaps.push({ startMinute: cursor, durationMinutes: 1440 - cursor });
  return gaps;
};
