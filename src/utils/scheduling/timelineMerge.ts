/**
 * timelineMerge — merge calendar events + planned tasks into a single sorted
 * list of occupied time blocks for a given day.
 */
import { timeToMinutes } from '../dateUtils';

export interface TimeBlock {
  startMins: number;
  endMins: number;
}

export interface OccupiedBlock extends TimeBlock {
  source: 'calendar' | 'plan';
  id: string;
}

export interface TimedItem {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

/**
 * Merges calendar and plan items into a single list of occupied blocks,
 * sorted by start time. Overlapping blocks are NOT merged — callers that
 * need gap analysis should use `findFreeTime`.
 */
export function mergeOccupied(
  calendarItems: TimedItem[],
  planItems: TimedItem[],
): OccupiedBlock[] {
  const blocks: OccupiedBlock[] = [
    ...calendarItems.map((e) => ({
      id: e.id,
      source: 'calendar' as const,
      startMins: timeToMinutes(e.startTime),
      endMins: timeToMinutes(e.endTime),
    })),
    ...planItems.map((e) => ({
      id: e.id,
      source: 'plan' as const,
      startMins: timeToMinutes(e.startTime),
      endMins: timeToMinutes(e.endTime),
    })),
  ].filter((b) => b.endMins > b.startMins); // discard zero/inverted blocks

  return blocks.sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);
}
