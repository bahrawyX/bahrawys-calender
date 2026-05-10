'use client';

import { useMemo } from 'react';
import { EventInstance } from '../../../types';
import { timeToMinutes } from '../../../utils/dateUtils';

export interface VirtualizationStats {
  total: number;
  rendered: number;
  skipped: number;
}

export interface VirtualizedResult {
  events: EventInstance[];
  stats: VirtualizationStats;
}

/**
 * Filters events to only those intersecting the render window.
 *
 * This is the core virtualization filter. From 1000 events, typically
 * only ~30-60 will pass through depending on scroll position.
 */
export function useVirtualizedEvents(
  events: EventInstance[],
  renderStartMin: number,
  renderEndMin: number,
): VirtualizedResult {
  return useMemo(() => {
    const visible: EventInstance[] = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const start = timeToMinutes(e.startTime);
      const end = timeToMinutes(e.endTime);
      if (end > renderStartMin && start < renderEndMin) {
        visible.push(e);
      }
    }
    return {
      events: visible,
      stats: {
        total: events.length,
        rendered: visible.length,
        skipped: events.length - visible.length,
      },
    };
  }, [events, renderStartMin, renderEndMin]);
}

/**
 * Groups events by day (ISO string key), then filters each day's events
 * against the render window. For WeekView where events span 7 days.
 */
export function useVirtualizedEventsByDay(
  eventsByDay: Map<string, EventInstance[]>,
  renderStartMin: number,
  renderEndMin: number,
): Map<string, EventInstance[]> {
  return useMemo(() => {
    const result = new Map<string, EventInstance[]>();
    for (const [day, events] of eventsByDay) {
      const visible: EventInstance[] = [];
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const start = timeToMinutes(e.startTime);
        const end = timeToMinutes(e.endTime);
        if (end > renderStartMin && start < renderEndMin) {
          visible.push(e);
        }
      }
      result.set(day, visible);
    }
    return result;
  }, [eventsByDay, renderStartMin, renderEndMin]);
}
