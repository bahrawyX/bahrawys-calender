import { EventInstance } from '../../types';
import { timeToMinutes } from '../dateUtils';

/**
 * Returns only events that intersect the visible timeline window.
 *
 * Both boundaries are in minutes-from-midnight (0–1440).
 * The caller should pad them by ~60 min on each side to avoid pop-in
 * artifacts at the top / bottom of the viewport.
 */
export function getVisibleEvents(
  events: EventInstance[],
  visibleStartMin: number,
  visibleEndMin: number,
): EventInstance[] {
  return events.filter((e) => {
    const start = timeToMinutes(e.startTime);
    const end = timeToMinutes(e.endTime);
    // Overlap test: event overlaps window ↔ end > windowStart AND start < windowEnd
    return end > visibleStartMin && start < visibleEndMin;
  });
}
