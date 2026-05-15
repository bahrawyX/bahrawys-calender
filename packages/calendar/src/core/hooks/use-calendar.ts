/**
 * useCalendar — core data derivation hook.
 *
 * Computes visible event instances from stores + external events,
 * applies search/filter, and deduplicates external provider events.
 */

'use client';

import { useMemo } from 'react';
import { useCalendarContext } from '../../context/calendar-provider';
import { expandRecurrences, getDaysInMonth, getDaysInWeek, formatDateISO } from '../utils/date-utils';
import { ViewType } from '../../types';
import type { EventInstance } from '../../types';

function buildExactExternalKey(event: EventInstance): string {
  return `${event.title.toLowerCase()}|${event.date}|${event.startTime}|${event.endTime}`;
}

function buildFallbackExternalKey(event: EventInstance): string {
  return `${event.title.toLowerCase()}|${event.date}|${event.startTime}`;
}

function dedupeExternalInstances(instances: EventInstance[]): EventInstance[] {
  const exactSeen = new Set<string>();
  const fallbackSeen = new Set<string>();
  const deduped: EventInstance[] = [];

  for (const event of instances) {
    const exactKey = buildExactExternalKey(event);
    const fallbackKey = buildFallbackExternalKey(event);
    if (exactSeen.has(exactKey) || fallbackSeen.has(fallbackKey)) {
      continue;
    }
    exactSeen.add(exactKey);
    fallbackSeen.add(fallbackKey);
    deduped.push(event);
  }

  return deduped;
}

export const useCalendar = () => {
  const { useCalendarStore, useEventsStore, externalEvents } = useCalendarContext();

  const searchQuery = useCalendarStore((s) => s.searchQuery);
  const activeFilters = useCalendarStore((s) => s.activeFilters);
  const view = useCalendarStore((s) => s.view);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const events = useEventsStore((s) => s.events);

  const visibleRange = useMemo(() => {
    if (view === ViewType.MONTH) {
      const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
      return { start: days[0], end: days[days.length - 1] };
    } else if (view === ViewType.WEEK) {
      const days = getDaysInWeek(currentDate);
      return { start: days[0], end: days[6] };
    } else {
      return { start: currentDate, end: currentDate };
    }
  }, [view, currentDate]);

  const allInstances = useMemo(() => {
    const localInstances = expandRecurrences(events, visibleRange.start, visibleRange.end);

    const startStr = formatDateISO(visibleRange.start);
    const endStr = formatDateISO(visibleRange.end);

    const googleInstances: EventInstance[] = (externalEvents.google ?? [])
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    const outlookInstances: EventInstance[] = (externalEvents.outlook ?? [])
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    const appleInstances: EventInstance[] = (externalEvents.apple ?? [])
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    const dedupedExternal = dedupeExternalInstances([
      ...googleInstances,
      ...outlookInstances,
      ...appleInstances,
    ]);

    return [...localInstances, ...dedupedExternal];
  }, [events, externalEvents.google, externalEvents.outlook, externalEvents.apple, visibleRange]);

  const filteredInstances = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return allInstances.filter((e) => {
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.description ?? '').toLowerCase().includes(query);
      const matchesFilter = activeFilters.length === 0 || activeFilters.includes(e.category);
      return matchesSearch && matchesFilter;
    });
  }, [allInstances, searchQuery, activeFilters]);

  return {
    filteredInstances,
    allInstances,
    visibleRange,
  };
};
