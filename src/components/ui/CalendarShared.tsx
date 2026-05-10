/**
 * CalendarShared — single source of truth for all calendar view design tokens.
 *
 * Every Month / Week / Day view component must consume these exports.
 * No view should hard-code surface colours, border opacities, shadow values,
 * typography sizes, or motion parameters independently.
 */
import React from 'react';

/* ─── String token constants ─────────────────────────────────────────────── */

/** Outer rounded container — identical for Month, Week, Day */
export const SURFACE_CLS =
  'flex-1 flex flex-col h-full bg-card rounded-3xl overflow-hidden border border-border/70 shadow-soft';

/**
 * Card cell surface — used for month day cells AND week day columns.
 * Includes rounded corners, soft shadow, and subtle border.
 */
export const CELL_CLS = [
  'bg-card',
  'rounded-xl overflow-hidden',
  'border border-border/60',
  'shadow-card',
].join(' ');

/**
 * Interactive cell hover layer — apply on top of CELL_CLS for clickable cells.
 * 130 ms lift + shadow increase, no neon, no delay.
 */
export const CELL_HOVER_CLS = [
  'cursor-pointer select-none',
  'transition-[box-shadow,background-color,border-color]',
  'duration-[130ms] ease-signature',
  'hover:shadow-card-hover',
  'hover:border-foreground/14',
].join(' ');

/** Sticky header bar (weekday labels / date number row) */
export const HEADER_CLS =
  'border-b border-border/70 bg-muted/30';

/** Time-of-day label: 12 AM, 1 PM … */
export const TIME_LABEL_CLS =
  'text-[10px] font-bold uppercase text-muted-foreground';

/** Weekday abbreviation header: SUN, MON … */
export const WEEKDAY_LABEL_CLS =
  'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

/** Today circle badge */
export const TODAY_BADGE_CLS = 'font-display bg-primary text-white shadow-sm';

/** Normal (non-today) date number */
export const DATE_NUMBER_CLS = 'font-display text-foreground/80';

/** Today ring on interactive cells */
export const TODAY_RING_CLS = 'ring-1 ring-primary/20';

/** Hour boundary separator (used by TimeSlotCell + GridSeparator) */
export const HOUR_LINE_CLS =
  'border-b border-border/60';

/** Quarter-hour dashed guide (used by TimeSlotCell + GridSeparator) */
export const QUARTER_LINE_CLS =
  'border-t border-dashed border-border/30';

/** Left time-labels sidebar (week + day views) */
export const TIME_SIDEBAR_CLS =
  'w-20 border-r border-border/60 bg-muted/20 sticky left-0 z-20';

/** Canvas background visible between / behind the day-column cards */
export const GRID_CANVAS_CLS = 'bg-muted/20';

/** Slot hover tint (used inline as background-color value) */
export const SLOT_HOVER_BG = 'rgba(109, 89, 224, 0.04)';

/* ─── Primitive components ───────────────────────────────────────────────── */

interface CalendarSurfaceProps {
  children: React.ReactNode;
  className?: string;
  role?: string;
}

/**
 * CalendarSurface — the outer rounded card shell.
 * Drop-in replacement for the root div in Month / Week / Day views.
 */
export const CalendarSurface: React.FC<CalendarSurfaceProps> = ({
  children,
  className = '',
  role,
}) => (
  <div className={`${SURFACE_CLS} ${className}`} role={role}>
    {children}
  </div>
);

interface GridSeparatorProps {
  /** Row height in px — must match HOUR_HEIGHT */
  height: number;
  /** Whether to render the dashed half-hour guide at 50% */
  showHalf?: boolean;
}

/**
 * GridSeparator — one hour-row background separator for time-grid columns.
 * Renders the bottom hour line and an optional dashed half-hour guide.
 * Use inside day columns that don't already use TimeSlotCell.
 */
export const GridSeparator: React.FC<GridSeparatorProps> = ({
  height,
  showHalf = true,
}) => (
  <div
    className={`relative w-full pointer-events-none ${HOUR_LINE_CLS}`}
    style={{ height: `${height}px` }}
  >
    {showHalf && (
      <div
        className={`absolute inset-x-0 ${QUARTER_LINE_CLS}`}
        style={{ top: '50%' }}
      />
    )}
  </div>
);
