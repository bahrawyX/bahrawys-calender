/**
 * findFreeTime — computes free time slots within a day window given a list of
 * occupied blocks. Blocks are merged so overlapping/adjacent entries don't
 * create phantom gaps.
 */
import type { OccupiedBlock, TimeBlock } from './timelineMerge';

export interface FreeSlot extends TimeBlock {
  lengthMins: number;
}

/**
 * @param occupied   Sorted list of occupied blocks (output of `mergeOccupied`).
 * @param dayStart   First minute of the day window (default 0 = midnight).
 * @param dayEnd     Last minute of the day window (default 1440 = midnight+1).
 * @returns          Array of free slots sorted by start time.
 */
export function findFreeTime(
  occupied: OccupiedBlock[],
  dayStart = 0,
  dayEnd = 1440,
): FreeSlot[] {
  // Combine overlapping/adjacent occupied blocks into a union
  const union: TimeBlock[] = [];
  for (const block of occupied) {
    const s = Math.max(block.startMins, dayStart);
    const e = Math.min(block.endMins, dayEnd);
    if (s >= e) continue; // outside window
    if (union.length === 0 || s > union[union.length - 1].endMins) {
      union.push({ startMins: s, endMins: e });
    } else {
      union[union.length - 1].endMins = Math.max(union[union.length - 1].endMins, e);
    }
  }

  // Gaps between union entries are free slots
  const free: FreeSlot[] = [];
  let cursor = dayStart;
  for (const block of union) {
    if (block.startMins > cursor) {
      const length = block.startMins - cursor;
      free.push({ startMins: cursor, endMins: block.startMins, lengthMins: length });
    }
    cursor = Math.max(cursor, block.endMins);
  }
  if (cursor < dayEnd) {
    free.push({ startMins: cursor, endMins: dayEnd, lengthMins: dayEnd - cursor });
  }

  return free;
}
