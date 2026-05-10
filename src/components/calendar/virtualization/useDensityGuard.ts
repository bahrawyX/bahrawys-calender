'use client';

import { useMemo } from 'react';
import { EventInstance, OverlapGroup } from '../../../types';
import { timeToMinutes, calculateOverlaps } from '../../../utils/dateUtils';

const MAX_EVENTS_BEFORE_COMPACT = 200;
const MAX_VISIBLE_COLUMNS = 4;
const MAX_EVENTS_PER_HOUR = 12;

/** Max events rendered directly inside one hour slot before showing overflow. */
export const MAX_VISIBLE_PER_HOUR = 2;
/** Events/hour threshold above which the hour switches to compact cluster mode. */
export const DENSE_HOUR_THRESHOLD = 10;

/** Shape stored in the per-hour density map. */
export interface HourDensityData {
  /** Number of events hidden behind the overflow indicator. */
  overflow: number;
  /** True when the hour has more than DENSE_HOUR_THRESHOLD events → cluster card. */
  isDense: boolean;
  /** All events that intersect this hour, sorted chronologically. */
  events: EventInstance[];
}

export interface DensityInfo {
  isCompactMode: boolean;
  compressedHours: Map<number, { visible: EventInstance[]; overflow: number }>;
}

/**
 * Compact overlap mode: when event count exceeds a threshold,
 * limits visible columns and adds overflow indicators.
 */
export function calculateOverlapsWithGuard(
  events: EventInstance[],
): { overlapMap: Map<string, OverlapGroup>; isCompact: boolean } {
  const isCompact = events.length > MAX_EVENTS_BEFORE_COMPACT;

  if (!isCompact) {
    return { overlapMap: calculateOverlaps(events), isCompact: false };
  }

  const overlapMap = calculateOverlaps(events);

  // Cap columns to MAX_VISIBLE_COLUMNS
  for (const [id, group] of overlapMap) {
    if (group.totalColumns > MAX_VISIBLE_COLUMNS) {
      if (group.column >= MAX_VISIBLE_COLUMNS) {
        overlapMap.set(id, { ...group, column: -1, totalColumns: MAX_VISIBLE_COLUMNS });
      } else {
        overlapMap.set(id, { ...group, totalColumns: MAX_VISIBLE_COLUMNS });
      }
    }
  }

  return { overlapMap, isCompact: true };
}

/**
 * Per-hour density check: if more than MAX_EVENTS_PER_HOUR events
 * overlap a single hour, compress to show a subset + "+N more".
 */
export function useDensityGuard(events: EventInstance[]): DensityInfo {
  return useMemo(() => {
    const isCompactMode = events.length > MAX_EVENTS_BEFORE_COMPACT;
    const compressedHours = new Map<number, { visible: EventInstance[]; overflow: number }>();

    for (let hour = 0; hour < 24; hour++) {
      const slotStart = hour * 60;
      const slotEnd = slotStart + 60;
      const inHour = events.filter((e) => {
        const s = timeToMinutes(e.startTime);
        const end = timeToMinutes(e.endTime);
        return end > slotStart && s < slotEnd;
      });

      if (inHour.length > MAX_EVENTS_PER_HOUR) {
        const showCount = 3;
        compressedHours.set(hour, {
          visible: inHour.slice(0, showCount),
          overflow: inHour.length - showCount,
        });
      }
    }

    return { isCompactMode, compressedHours };
  }, [events]);
}

export { MAX_EVENTS_BEFORE_COMPACT, MAX_VISIBLE_COLUMNS, MAX_EVENTS_PER_HOUR };
