/**
 * <BahrawyCalendar /> — the root component template.
 *
 * This is the entry point for consumers. It wraps the provider, renders the
 * view switcher header, and renders the active view (Month/Week/Day).
 *
 * This file is meant to be copied into the user's project (shadcn-style)
 * and customized. The core logic lives in bahrawy-calendar (npm package).
 */

'use client';

import React from 'react';
// NOTE: When used outside the package, import from 'bahrawy-calendar'
// These are intra-package imports for the template source.
import { BahrawyCalendarProvider, useCalendarContext } from '../context/calendar-provider';
import { ViewType } from '../types';
import type { CalendarEvent, NotifyFn, CalendarLifecycleCallbacks } from '../types';
import type { PersistenceAdapter } from '../core/persistence/types';
import type { CalendarThemeTokens } from '../theme/tokens';
import { themeTokensToCSS } from '../theme/tokens';

// ── Props ───────────────────────────────────────────────────────────────────
export interface BahrawyCalendarProps {
  /** Default view on mount */
  defaultView?: 'month' | 'week' | 'day';
  /** Initial date on mount */
  initialDate?: Date;

  /** Controlled events (external state). When provided, overrides internal store. */
  events?: CalendarEvent[];
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (id: string) => void;
  onEventMove?: (id: string, newDate: string, startTime?: string, endTime?: string) => void;

  /** External provider events (read-only overlay) */
  externalEvents?: {
    google?: CalendarEvent[];
    outlook?: CalendarEvent[];
    apple?: CalendarEvent[];
  };

  /** Custom persistence adapter. Default: localStorage */
  persistence?: PersistenceAdapter;

  /** Notification function (e.g. Sonner's toast). Default: no-op */
  notify?: NotifyFn;

  /** Theme overrides via CSS variables */
  theme?: Partial<CalendarThemeTokens>;

  /** Root container className */
  className?: string;

  /** Feature flags */
  enableRecurrence?: boolean;
  enableDragAndDrop?: boolean;
  enableConflictDetection?: boolean;
  enableKeyboardShortcuts?: boolean;

  /** Lifecycle callbacks */
  callbacks?: CalendarLifecycleCallbacks;
}

// ── ViewType mapping ────────────────────────────────────────────────────────
const VIEW_MAP: Record<string, ViewType> = {
  month: ViewType.MONTH,
  week: ViewType.WEEK,
  day: ViewType.DAY,
};

// ── Root Component ──────────────────────────────────────────────────────────
export function BahrawyCalendar({
  defaultView = 'month',
  initialDate,
  events,
  externalEvents,
  persistence,
  notify,
  theme,
  className,
  enableRecurrence = true,
  enableDragAndDrop = true,
  enableConflictDetection = true,
  enableKeyboardShortcuts = true,
  callbacks,
}: BahrawyCalendarProps) {
  const themeStyles = theme ? themeTokensToCSS(theme) : undefined;

  return (
    <BahrawyCalendarProvider
      defaultView={VIEW_MAP[defaultView]}
      initialDate={initialDate}
      externalEvents={externalEvents}
      persistence={persistence}
      notify={notify}
      enableRecurrence={enableRecurrence}
      enableDragAndDrop={enableDragAndDrop}
      enableConflictDetection={enableConflictDetection}
      enableKeyboardShortcuts={enableKeyboardShortcuts}
      callbacks={callbacks}
    >
      <div
        className={`bahrawy-calendar relative flex flex-col h-full ${className ?? ''}`}
        style={themeStyles}
      >
        <CalendarInner />
      </div>
    </BahrawyCalendarProvider>
  );
}

// ── Inner Component (has access to context) ─────────────────────────────────
function CalendarInner() {
  const { useCalendarStore } = useCalendarContext();
  const view = useCalendarStore((s) => s.view);

  return (
    <>
      <CalendarHeader />
      <div className="flex-1 overflow-hidden">
        {/*
          Replace these placeholders with your actual view components:

          {view === ViewType.MONTH && <MonthView events={filteredInstances} />}
          {view === ViewType.WEEK && <WeekView events={filteredInstances} />}
          {view === ViewType.DAY && <DayView events={filteredInstances} />}
        */}
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">
            Calendar view: <strong>{view}</strong>
            <br />
            <span className="text-xs opacity-60">
              Copy your view components here. See the docs for setup instructions.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

// ── Header with view switcher + navigation ──────────────────────────────────
function CalendarHeader() {
  const { useCalendarStore } = useCalendarContext();
  const view = useCalendarStore((s) => s.view);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setView = useCalendarStore((s) => s.setView);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);

  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const navigateDate = (offset: number) => {
    const next = new Date(currentDate);
    if (view === ViewType.MONTH) {
      next.setMonth(next.getMonth() + offset);
    } else if (view === ViewType.WEEK) {
      next.setDate(next.getDate() + offset * 7);
    } else {
      next.setDate(next.getDate() + offset);
    }
    setCurrentDate(next);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigateDate(-1)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h2 className="text-sm font-semibold min-w-[140px] text-center">{monthLabel}</h2>
        <button
          onClick={() => navigateDate(1)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          Today
        </button>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
        {(['month', 'week', 'day'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(VIEW_MAP[v])}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === VIEW_MAP[v]
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
