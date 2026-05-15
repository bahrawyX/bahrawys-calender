/**
 * CalendarShared — single source of truth for all calendar view design tokens.
 *
 * Every Month / Week / Day view component must consume these exports.
 * No view should hard-code surface colours, border opacities, shadow values,
 * typography sizes, or motion parameters independently.
 *
 * Pure UI — no calendar-specific imports needed.
 */
import React from 'react';

/* -- String token constants -- */

export const SURFACE_CLS =
  'flex-1 flex flex-col h-full bg-card rounded-3xl overflow-hidden border border-border/70 shadow-soft';

export const CELL_CLS = [
  'bg-card',
  'rounded-xl overflow-hidden',
  'border border-border/60',
  'shadow-card',
].join(' ');

export const CELL_HOVER_CLS = [
  'cursor-pointer select-none',
  'transition-[box-shadow,background-color,border-color]',
  'duration-[130ms] ease-signature',
  'hover:shadow-card-hover',
  'hover:border-foreground/14',
].join(' ');

export const HEADER_CLS =
  'border-b border-border/70 bg-muted/30';

export const TIME_LABEL_CLS =
  'text-[10px] font-bold uppercase text-muted-foreground';

export const WEEKDAY_LABEL_CLS =
  'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

export const TODAY_BADGE_CLS = 'font-display bg-primary text-white shadow-sm';

export const DATE_NUMBER_CLS = 'font-display text-foreground/80';

export const TODAY_RING_CLS = 'ring-1 ring-primary/20';

export const HOUR_LINE_CLS =
  'border-b border-border/60';

export const QUARTER_LINE_CLS =
  'border-t border-dashed border-border/30';

export const TIME_SIDEBAR_CLS =
  'w-20 border-r border-border/60 bg-muted/20 sticky left-0 z-20';

export const GRID_CANVAS_CLS = 'bg-muted/20';

export const SLOT_HOVER_BG = 'rgba(109, 89, 224, 0.04)';

/* -- Primitive components -- */

interface CalendarSurfaceProps {
  children: React.ReactNode;
  className?: string;
  role?: string;
}

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
  height: number;
  showHalf?: boolean;
}

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
