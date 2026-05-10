'use client';

/**
 * MobileCalendar
 *
 * Full mobile calendar layout — replaces MonthView/WeekView/DayView on
 * viewports < md. Desktop components stay completely untouched; the
 * gate lives in CalendarPage behind `useIsMobile()`.
 *
 * Layout:
 *  ┌─────────────────────┐
 *  │ APR 2026            │   ← month header
 *  │ compact month grid  │   ← MobileMonthGrid (horizontal swipe nav)
 *  ├─────────────────────┤
 *  │ 24 THU              │   ← big selected-day header
 *  │ day event list      │   ← MobileDayList (scrollable)
 *  ├─────────────────────┤
 *  │ [ Add event...  + ] │   ← fixed quick-add bar above bottom nav
 *  └─────────────────────┘
 *
 * Selected date is sourced from `useCalendarStore.currentDate` so
 * navigation stays shared with any surrounding desktop state (e.g.
 * the top-nav Today button if the user resizes). The visible month
 * is derived locally from the selected date — swiping the month grid
 * advances the month and selects the same weekday in the new month.
 */
import React, { useCallback, useMemo } from 'react';
import { MONTHS } from '@/constants';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useCalendarEventsStore } from '@/store/useCalendarEventsStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { expandRecurrences, formatDateISO, getDaysInMonth } from '@/utils/dateUtils';
import { EventInstance } from '@/types';
import { MobileMonthGrid } from './MobileMonthGrid';
import { MobileDayList } from './MobileDayList';
import { PlusIcon } from '@/components/icons';

export const MobileCalendar: React.FC = () => {
  const selectedDate = useCalendarStore((s) => s.currentDate);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);
  const openModal = useCalendarStore((s) => s.openModal);
  const searchQuery = useCalendarStore((s) => s.searchQuery);
  const activeFilters = useCalendarStore((s) => s.activeFilters);
  const isFocusMode = useCalendarStore((s) => s.isFocusMode);

  const events = useCalendarEventsStore((s) => s.events);
  const outlookEvents = usePlannerStore((s) => s.outlookEvents);
  const googleEvents = usePlannerStore((s) => s.googleEvents);

  // Month range for the visible grid — recompute once per month change.
  const monthRange = useMemo(() => {
    const days = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
    return { start: days[0], end: days[days.length - 1] };
  }, [selectedDate]);

  // Combined event instances for the visible month (local recurrences +
  // already-flattened external events). Mirrors useCalendar's shape so
  // downstream components can treat them identically.
  const monthEvents: EventInstance[] = useMemo(() => {
    const local = expandRecurrences(events, monthRange.start, monthRange.end);
    const startStr = formatDateISO(monthRange.start);
    const endStr = formatDateISO(monthRange.end);
    const external: EventInstance[] = [...googleEvents, ...outlookEvents]
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .map((e) => ({ ...e, instanceDate: e.date }));
    return [...local, ...external];
  }, [events, googleEvents, outlookEvents, monthRange]);

  // Apply the same search / category / focus-mode filters the desktop
  // useCalendar hook applies, so filter state stays meaningful on mobile.
  const filteredMonthEvents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const todayStr = formatDateISO(new Date());
    return monthEvents.filter((e) => {
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.description ?? '').toLowerCase().includes(query);
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
  }, [monthEvents, searchQuery, activeFilters, isFocusMode]);

  const handleSelectDate = useCallback(
    (d: Date) => {
      setCurrentDate(d);
    },
    [setCurrentDate],
  );

  const handleNavigateMonth = useCallback(
    (direction: 1 | -1) => {
      const next = new Date(selectedDate);
      next.setDate(1);
      next.setMonth(next.getMonth() + direction);
      // Preserve the previously selected day-of-month where possible,
      // clamping to the new month's last day.
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(selectedDate.getDate(), lastDay));
      setCurrentDate(next);
    },
    [selectedDate, setCurrentDate],
  );

  const handleNavigateYear = useCallback(
    (direction: 1 | -1) => {
      const next = new Date(selectedDate);
      next.setDate(1);
      next.setFullYear(next.getFullYear() + direction);
      // Clamp to the new month's last day so Feb 29 → Feb 28 in non-leap years.
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(selectedDate.getDate(), lastDay));
      setCurrentDate(next);
    },
    [selectedDate, setCurrentDate],
  );

  const handleEventClick = useCallback(
    (eventId: string) => {
      openModal(eventId);
    },
    [openModal],
  );

  const handleQuickAdd = useCallback(() => {
    openModal(undefined, formatDateISO(selectedDate));
  }, [openModal, selectedDate]);

  const monthLabel = `${MONTHS[selectedDate.getMonth()].toUpperCase()} ${selectedDate.getFullYear()}`;

  return (
    <div className="flex flex-col h-full w-full" data-testid="mobile-calendar">
      {/* Top panel — compact month grid */}
      <section className="flex-shrink-0 bg-background">
        <div className="flex items-center justify-center gap-2 pt-1 pb-2">
          <button
            type="button"
            onClick={() => handleNavigateYear(-1)}
            aria-label="Previous year"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateMonth(-1)}
            aria-label="Previous month"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="font-display text-lg tracking-[-0.02em] text-foreground min-w-[120px] text-center">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => handleNavigateMonth(1)}
            aria-label="Next month"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateYear(1)}
            aria-label="Next year"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        </div>
        <MobileMonthGrid
          monthDate={selectedDate}
          selectedDate={selectedDate}
          events={filteredMonthEvents}
          onSelectDate={handleSelectDate}
          onNavigateMonth={handleNavigateMonth}
        />
      </section>

      <div className="h-px bg-border/60 mx-2 my-2 flex-shrink-0" role="presentation" />

      {/* Bottom panel — day event list (scrolls). Bottom padding leaves
          room for the fixed quick-add bar + bottom nav + safe-area. */}
      <section className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[calc(env(safe-area-inset-bottom)+140px)]">
        <MobileDayList
          date={selectedDate}
          events={filteredMonthEvents}
          onEventClick={handleEventClick}
        />
      </section>

      {/* Quick-add button — fixed, sits just above the mobile bottom nav.
          Centered button with "Add event" text and + icon — no longer
          mimics a text input. */}
      <div
        className="md:hidden fixed left-3 right-3 z-40 flex justify-center"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 68px + 8px)' }}
      >
        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label="Add event"
          className="h-11 px-5 rounded-full bg-primary text-primary-foreground flex items-center gap-2 shadow-soft hover:opacity-90 active:scale-[0.98] transition-all font-medium text-sm"
        >
          <PlusIcon size={16} />
          <span>Add event</span>
        </button>
      </div>
    </div>
  );
};

MobileCalendar.displayName = 'MobileCalendar';

export default MobileCalendar;
