/**
 * Core date and event-position utilities for the calendar grid.
 */

import type { CalendarEvent, OverlapGroup, EventInstance } from '../../types';
import { timeToMinutes, minutesToTime } from './time-utils';

export { timeToMinutes, minutesToTime };

export const HOUR_HEIGHT = 80;

export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
  );
};

export const getDaysInWeek = (currentDate: Date): Date[] => {
  const date = new Date(currentDate);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const startOfWeek = new Date(date.setDate(diff));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
};

const MIN_EVENT_HEIGHT_PX = 28;

export const getEventPosition = (startTime: string, endTime: string) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const duration = Math.max(endMins - startMins, 0);
  const top = (startMins / 60) * HOUR_HEIGHT;
  const height = Math.max((duration / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT_PX);
  return { top, height };
};

/**
 * Expand recurring events into individual instances within a date range.
 * Handles EXDATE (exceptions) and lazy expansion with fast-forward optimization.
 */
export const expandRecurrences = (events: CalendarEvent[], startRange: Date, endRange: Date): EventInstance[] => {
  const instances: EventInstance[] = [];
  const startISO = formatDateISO(startRange);
  const endISO = formatDateISO(endRange);

  for (const event of events) {
    const isExcluded = (date: string) => event.exceptions?.includes(date);

    if (!event.recurrence) {
      if (event.date >= startISO && event.date <= endISO && !isExcluded(event.date)) {
        instances.push({ ...event, instanceDate: event.date });
      }
      continue;
    }

    const { frequency, interval, daysOfWeek, endCondition } = event.recurrence;
    const safeInterval = Math.max(1, Math.floor(interval ?? 1));
    let current = new Date(event.date + 'T00:00:00');
    let count = 0;

    // Fast-forward to range if possible
    if (frequency === 'DAILY' && current < startRange) {
      const diffMs = startRange.getTime() - current.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const jump = Math.floor(diffDays / safeInterval) * safeInterval;
      current.setDate(current.getDate() + Math.max(0, jump - safeInterval));
    }

    while (true) {
      const currentISO = formatDateISO(current);

      if (endCondition.type === 'UNTIL' && currentISO > endCondition.untilDate) break;
      if (endCondition.type === 'COUNT' && count >= endCondition.count) break;
      if (currentISO > endISO) break;

      let matches = false;
      if (frequency === 'DAILY') matches = true;
      if (frequency === 'WEEKLY') {
        matches = !daysOfWeek || daysOfWeek.includes(current.getDay());
      }
      if (frequency === 'MONTHLY') {
        const startDate = new Date(event.date + 'T00:00:00');
        matches = current.getDate() === startDate.getDate();
      }

      if (matches) {
        if (currentISO >= startISO && currentISO <= endISO && !isExcluded(currentISO)) {
          instances.push({ ...event, instanceDate: currentISO });
        }
        count++;
      }

      if (frequency === 'DAILY') current.setDate(current.getDate() + safeInterval);
      else if (frequency === 'WEEKLY') current.setDate(current.getDate() + 1);
      else if (frequency === 'MONTHLY') current.setMonth(current.getMonth() + safeInterval);

      if (count > 2000 || currentISO > '2099-12-31') break;
    }
  }
  return instances;
};

/**
 * Calculate column layouts for overlapping events in a day.
 */
export const calculateOverlaps = (dayEvents: EventInstance[]): Map<string, OverlapGroup> => {
  const sorted = [...dayEvents].sort((a, b) => {
    const startA = timeToMinutes(a.startTime);
    const startB = timeToMinutes(b.startTime);
    return startA !== startB ? startA - startB : timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });

  const results = new Map<string, OverlapGroup>();
  if (sorted.length === 0) return results;

  const clusters: EventInstance[][] = [];
  let currentCluster: EventInstance[] = [];
  let clusterEnd = -1;

  for (const event of sorted) {
    const start = timeToMinutes(event.startTime);
    const end = timeToMinutes(event.endTime);
    if (start >= clusterEnd) {
      if (currentCluster.length > 0) clusters.push(currentCluster);
      currentCluster = [event];
      clusterEnd = end;
    } else {
      currentCluster.push(event);
      clusterEnd = Math.max(clusterEnd, end);
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  for (const cluster of clusters) {
    const columns: number[] = [];
    for (const event of cluster) {
      const start = timeToMinutes(event.startTime);
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        if (start >= columns[i]) {
          columns[i] = timeToMinutes(event.endTime);
          results.set(event.id, {
            column: i,
            totalColumns: 0,
            hasConflict: cluster.length > 1,
            overlapCount: cluster.length,
          });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push(timeToMinutes(event.endTime));
        results.set(event.id, {
          column: columns.length - 1,
          totalColumns: 0,
          hasConflict: cluster.length > 1,
          overlapCount: cluster.length,
        });
      }
    }
    const totalColumns = columns.length;
    for (const event of cluster) {
      const existing = results.get(event.id);
      if (existing) {
        results.set(event.id, { ...existing, totalColumns, overlapCount: totalColumns });
      }
    }
  }
  return results;
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hour, min] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${min.toString().padStart(2, '0')} ${ampm}`;
};
