/**
 * Calendar Theme Tokens — CSS variable definitions with defaults.
 *
 * Users override these by setting CSS variables on the calendar container
 * or in their global stylesheet.
 *
 * Naming convention: --bc-* (bahrawy-calendar)
 */

export interface CalendarThemeTokens {
  /** Primary brand color */
  primary: string;
  /** Primary hover state */
  primaryHover: string;
  /** Card/surface background */
  surface: string;
  /** Border color */
  border: string;
  /** Primary text color */
  text: string;
  /** Muted/secondary text */
  textMuted: string;
  /** Border radius for cards */
  radius: string;
  /** Height of each hour row in the time grid (px) */
  hourHeight: string;
  /** Card shadow */
  shadowCard: string;
  /** Card hover shadow */
  shadowCardHover: string;
  /** Hover time indicator color */
  hoverLineBg: string;
  /** Today badge background */
  todayBadgeBg: string;
}

export const defaultThemeTokens: CalendarThemeTokens = {
  primary: '#6D59E0',
  primaryHover: '#5B4AC5',
  surface: 'hsl(var(--card, 0 0% 100%))',
  border: 'hsl(var(--border, 220 13% 91%))',
  text: 'hsl(var(--foreground, 224 71% 4%))',
  textMuted: 'hsl(var(--muted-foreground, 220 9% 46%))',
  radius: '12px',
  hourHeight: '80px',
  shadowCard: '0 1px 2px rgba(17,17,28,0.03)',
  shadowCardHover: '0 6px 16px -4px rgba(17,17,28,0.07)',
  hoverLineBg: 'rgba(109,89,224,0.60)',
  todayBadgeBg: 'var(--bc-primary, #6D59E0)',
};

/**
 * Generate CSS custom properties from theme tokens.
 * Returns a style object that can be spread onto the root calendar element.
 */
export function themeTokensToCSS(tokens: Partial<CalendarThemeTokens> = {}): React.CSSProperties {
  const merged = { ...defaultThemeTokens, ...tokens };
  return {
    '--bc-primary': merged.primary,
    '--bc-primary-hover': merged.primaryHover,
    '--bc-surface': merged.surface,
    '--bc-border': merged.border,
    '--bc-text': merged.text,
    '--bc-text-muted': merged.textMuted,
    '--bc-radius': merged.radius,
    '--bc-hour-height': merged.hourHeight,
    '--bc-shadow-card': merged.shadowCard,
    '--bc-shadow-card-hover': merged.shadowCardHover,
    '--bc-hover-line-bg': merged.hoverLineBg,
    '--bc-today-badge-bg': merged.todayBadgeBg,
  } as React.CSSProperties;
}

/**
 * Tailwind class-string tokens for calendar views.
 * Matches the original calendarTheme.ts from the app.
 */
export const cal = {
  container:
    'flex-1 flex flex-col h-full bg-white dark:bg-neutral-panel rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-border shadow-soft',
  header:
    'border-b border-gray-100 dark:border-neutral-border bg-gray-50/20 dark:bg-neutral-dark/20',
  weekdayLabel:
    'text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500',
  timeLabel:
    'text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600',
  timeSidebar:
    'w-20 border-r border-gray-100 dark:border-neutral-border/50 bg-gray-50/10 dark:bg-neutral-dark/10 sticky left-0 z-20',
  colDivider:
    'border-r border-gray-100 dark:border-neutral-border/50',
  hourLine:
    'border-b border-gray-100/60 dark:border-neutral-border/25',
  quarterLine:
    'border-t border-gray-50 dark:border-neutral-border/10 border-dashed',
  todayBadge:
    'bg-primary text-white shadow-sm',
  dayNumber:
    'text-gray-700 dark:text-gray-300',
  dayNumberMuted:
    'text-gray-400 dark:text-gray-600',
  todayRing:
    'ring-1 ring-primary/20',
  cellTransition:
    'transition-[transform,box-shadow,background-color] duration-[130ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
  monthCellActive: [
    'bg-white/70 dark:bg-neutral-panel/70',
    'shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]',
    'dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.04)]',
    'cursor-pointer select-none',
    'hover:-translate-y-px',
    'hover:shadow-[0_3px_10px_rgba(0,0,0,0.09),0_0_0_1px_rgba(0,0,0,0.06)]',
    'dark:hover:shadow-[0_3px_10px_rgba(0,0,0,0.34),0_0_0_1px_rgba(255,255,255,0.06)]',
    'hover:bg-white dark:hover:bg-neutral-panel',
  ].join(' '),
  slotHoverBg: 'rgba(109, 89, 224, 0.04)',
  monthGridBg:
    'bg-gray-50/30 dark:bg-neutral-dark/25',
} as const;
