/**
 * calendarTheme — Single source of truth for all calendar view design tokens.
 *
 * Rules:
 *  - Every MonthView / WeekView / DayView / TimeSlotCell class that affects
 *    surface, border, shadow, typography, or motion must come from here.
 *  - No random hex values or one-off Tailwind colors inside view components.
 *  - All tokens are plain Tailwind class strings; use template literals to
 *    compose them in JSX: className={`${cal.container} relative`}
 */

export const cal = {
  /* ── Outer container (the big rounded card — identical for all 3 views) ── */
  container:
    'flex-1 flex flex-col h-full bg-white dark:bg-neutral-panel rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-border shadow-soft',

  /* ── Sticky header bar (weekday labels + date numbers) ── */
  header:
    'border-b border-gray-100 dark:border-neutral-border bg-gray-50/20 dark:bg-neutral-dark/20',

  /* ── Weekday column label (SUN / MON / TUE …) ── */
  weekdayLabel:
    'text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500',

  /* ── Hour-of-day label (12 AM, 1 PM …) ── */
  timeLabel:
    'text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600',

  /* ── Hour-label sidebar column (week + day views) ── */
  timeSidebar:
    'w-20 border-r border-gray-100 dark:border-neutral-border/50 bg-gray-50/10 dark:bg-neutral-dark/10 sticky left-0 z-20',

  /* ── Vertical column separator between day columns ── */
  colDivider:
    'border-r border-gray-100 dark:border-neutral-border/50',

  /* ── Horizontal hour-boundary line inside the time grid ── */
  hourLine:
    'border-b border-gray-100/60 dark:border-neutral-border/25',

  /* ── Dashed quarter-hour guide line ── */
  quarterLine:
    'border-t border-gray-50 dark:border-neutral-border/10 border-dashed',

  /* ── "Today" circle badge (day number) ── */
  todayBadge:
    'bg-primary text-white shadow-sm',

  /* ── Normal day number (within current month / visible week) ── */
  dayNumber:
    'text-gray-700 dark:text-gray-300',

  /* ── Muted day number (padding days outside current month) ── */
  dayNumberMuted:
    'text-gray-400 dark:text-gray-600',

  /* ── Ring highlight for today's cell in month grid ── */
  todayRing:
    'ring-1 ring-primary/20',

  /* ── Shared CSS transition — all interactive calendar cells ── */
  cellTransition:
    'transition-[transform,box-shadow,background-color] duration-[130ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',

  /* ── Month day cell: active (current month) — card surface + hover ── */
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

  /* ── Slot cell hover background (rgba value, used inline) ── */
  slotHoverBg: 'rgba(109, 89, 224, 0.04)',

  /* ── Grid background shown between / behind month cells ── */
  monthGridBg:
    'bg-gray-50/30 dark:bg-neutral-dark/25',
} as const;
