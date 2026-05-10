'use client';

/**
 * MobileMonthGrid
 *
 * Compact iOS-style month grid used in the top panel of the mobile
 * calendar. Renders 6 weeks (42 cells) of small tap targets with:
 *
 *  - Filled primary circle for today.
 *  - Primary-coloured outline ring for the selected date (if not today).
 *  - Up to 3 small coloured dots below the date number to hint at
 *    events present on that day (one per distinct category colour).
 *
 * The grid owns its own horizontal swipe gesture — `touchstart` and
 * `touchend` compute deltaX; > 50 px triggers `onNavigateMonth(±1)`.
 * We only listen on this component; the day list below keeps its
 * own native vertical scrolling unaffected.
 */
import React, { useRef, useMemo } from 'react';
import { EventInstance } from '@/types';
import { EVENT_COLORS } from '@/constants';
import { formatDateISO, getDaysInMonth, isSameDay } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface MobileMonthGridProps {
  monthDate: Date;
  selectedDate: Date;
  events: EventInstance[];
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (direction: 1 | -1) => void;
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MobileMonthGrid: React.FC<MobileMonthGridProps> = ({
  monthDate,
  selectedDate,
  events,
  onSelectDate,
  onNavigateMonth,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const currentMonth = monthDate.getMonth();

  const days = useMemo(
    () => getDaysInMonth(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  );

  // Map ISO date → up to 3 distinct category colours (preserves first-seen order).
  const dotsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ev of events) {
      const iso = ev.instanceDate;
      const colour =
        EVENT_COLORS[ev.category as keyof typeof EVENT_COLORS] ?? ev.color ?? '#6D59E0';
      const arr = map.get(iso) ?? [];
      if (arr.length < 3 && !arr.includes(colour)) {
        arr.push(colour);
        map.set(iso, arr);
      } else if (!map.has(iso)) {
        map.set(iso, [colour]);
      }
    }
    return map;
  }, [events]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Only treat as a horizontal swipe when |Δx| dominates |Δy| — keeps
    // vertical scrolling within parent layouts unaffected.
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    onNavigateMonth(deltaX < 0 ? 1 : -1);
  };

  return (
    <div
      className="select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="mobile-month-grid"
    >
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-0 px-1 pb-1.5">
        {DOW.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground/70"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0 px-1">
        {days.map((day) => {
          const iso = formatDateISO(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dots = dotsByDate.get(iso) ?? [];

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-label={iso}
              aria-pressed={isSelected}
              className="relative flex flex-col items-center justify-start py-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
            >
              <span
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-medium transition-colors',
                  isToday && 'bg-primary text-primary-foreground',
                  !isToday && isSelected && 'border border-primary text-foreground',
                  !isToday && !isSelected && isCurrentMonth && 'text-foreground',
                  !isToday && !isSelected && !isCurrentMonth && 'text-muted-foreground/40',
                )}
              >
                {day.getDate()}
              </span>
              {dots.length > 0 && (
                <div className="flex items-center gap-[3px] mt-0.5 h-1">
                  {dots.map((c, i) => (
                    <span
                      key={i}
                      className="block w-1 h-1 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

MobileMonthGrid.displayName = 'MobileMonthGrid';
