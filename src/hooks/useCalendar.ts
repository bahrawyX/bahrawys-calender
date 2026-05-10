'use client';

import { useMemo } from 'react';
import { useCalendarStore } from '../store/useCalendarStore';
import { useCalendarEventsStore } from '../store/useCalendarEventsStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { expandRecurrences, getDaysInMonth, getDaysInWeek, formatDateISO } from '../utils/dateUtils';
import { ViewType, EventInstance } from '../types';

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
  const searchQuery   = useCalendarStore((s) => s.searchQuery);
  const activeFilters = useCalendarStore((s) => s.activeFilters);
  const view          = useCalendarStore((s) => s.view);
  const currentDate   = useCalendarStore((s) => s.currentDate);
  const isFocusMode   = useCalendarStore((s) => s.isFocusMode);
  const events        = useCalendarEventsStore((s) => s.events);
  const outlookEvents    = usePlannerStore((s) => s.outlookEvents);
  const googleEvents     = usePlannerStore((s) => s.googleEvents);
  const appleEvents      = usePlannerStore((s) => s.appleEvents);
  const demoLocalEvents  = usePlannerStore((s) => s.demoLocalEvents);

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
    const endStr   = formatDateISO(visibleRange.end);

    const googleInstances: EventInstance[] = googleEvents
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    const outlookInstances: EventInstance[] = outlookEvents
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    const appleInstances: EventInstance[] = appleEvents
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    // Session-only demo events for built-in contexts (injected by useExternalSync).
    const demoLocalInstances: EventInstance[] = demoLocalEvents
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));

    // Keep a stable preference order for duplicate external events.
    const dedupedExternal = dedupeExternalInstances([
      ...googleInstances,
      ...outlookInstances,
      ...appleInstances,
    ]);

    return [...localInstances, ...demoLocalInstances, ...dedupedExternal];
  }, [events, googleEvents, outlookEvents, appleEvents, demoLocalEvents, visibleRange]);

  const filteredInstances = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const now = new Date();
    const todayStr = formatDateISO(now);

    return allInstances.filter(e => {
      const matchesSearch = !query || e.title.toLowerCase().includes(query) || (e.description ?? '').toLowerCase().includes(query);
      const matchesFilter = activeFilters.length === 0 || activeFilters.includes(e.category);
      
      if (!matchesSearch || !matchesFilter) return false;

      if (isFocusMode) {
        const provider = e.provider || (e.source === 'outlook' ? 'microsoft' : 'local');
        if (provider === 'microsoft' || provider === 'google') return true;
        const isFocusCategory = e.category === 'Focus' || e.category === 'Critical';
        const isFuture = e.instanceDate >= todayStr;
        return isFocusCategory && isFuture;
      }

      return true;
    });
  }, [allInstances, searchQuery, activeFilters, isFocusMode]);

  return {
    filteredInstances,
  };
};
