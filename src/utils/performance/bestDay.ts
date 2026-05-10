import { format, parseISO } from 'date-fns';
import type { FocusSession } from '@/store/useFocusStore';

/**
 * Find the calendar date with the highest total focus duration.
 * Returns null if there are no sessions.
 */
export function computeBestDay(sessions: FocusSession[]): { date: string; label: string; totalMinutes: number } | null {
  if (sessions.length === 0) return null;

  const minutesByDate = new Map<string, number>();

  for (const s of sessions) {
    if (!s.startTime) continue;
    const dateStr = s.startTime.slice(0, 10); // YYYY-MM-DD
    const mins = Math.round(s.duration / 60);
    minutesByDate.set(dateStr, (minutesByDate.get(dateStr) ?? 0) + mins);
  }

  let bestDate = '';
  let bestMins = 0;
  for (const [d, m] of minutesByDate) {
    if (m > bestMins) {
      bestMins = m;
      bestDate = d;
    }
  }

  if (!bestDate) return null;

  return {
    date: bestDate,
    label: format(parseISO(bestDate), 'EEE, MMM d'),
    totalMinutes: bestMins,
  };
}
