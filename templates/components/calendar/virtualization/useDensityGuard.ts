'use client';

/**
 * useDensityGuard — adapted for bahrawy-calendar package.
 */

import { useMemo } from 'react';
import type { EventInstance, OverlapGroup } from 'bahrawy-calendar';
import { timeToMinutes, calculateOverlaps } from 'bahrawy-calendar/compat';

const MAX_EVENTS_BEFORE_COMPACT = 200;
const MAX_VISIBLE_COLUMNS = 4;
const MAX_EVENTS_PER_HOUR = 12;

export const MAX_VISIBLE_PER_HOUR = 2;
export const DENSE_HOUR_THRESHOLD = 10;

export interface HourDensityData {
  overflow: number;
  isDense: boolean;
  events: EventInstance[];
}

export interface DensityInfo {
  isCompactMode: boolean;
  compressedHours: Map<number, { visible: EventInstance[]; overflow: number }>;
}

export function calculateOverlapsWithGuard(
  events: EventInstance[],
): { overlapMap: Map<string, OverlapGroup>; isCompact: boolean } {
  const isCompact = events.length > MAX_EVENTS_BEFORE_COMPACT;

  if (!isCompact) {
    return { overlapMap: calculateOverlaps(events), isCompact: false };
  }

  const overlapMap = calculateOverlaps(events);

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
