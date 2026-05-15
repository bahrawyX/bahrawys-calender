/**
 * Drag Engine — lightweight collision detection for drag-and-drop.
 * Assigns column lanes to ghost preview, matching Google Calendar behavior.
 */

import type { EventInstance } from '../../types';
import { timeToMinutes } from '../utils/time-utils';

export interface DragCollisionResult {
  columnIndex: number;
  columnCount: number;
}

/**
 * Performs a lightweight collision detection to assign a column "lane"
 * to the dragged ghost preview.
 *
 * @param dayEvents Events for the day (ideally pre-filtered to visible range)
 * @param draggedEventId The ID of the event currently being dragged
 * @param previewStartMin Ghost's preview start time (minutes from midnight)
 * @param previewEndMin Ghost's preview end time (minutes from midnight)
 */
export const calculateDragCollision = (
  dayEvents: EventInstance[],
  draggedEventId: string,
  previewStartMin: number,
  previewEndMin: number,
): DragCollisionResult => {
  const overlappingEvents = dayEvents.filter((e) => {
    if (e.id === draggedEventId) return false;
    const eStart = timeToMinutes(e.startTime);
    const eEnd = timeToMinutes(e.endTime);
    return eStart < previewEndMin && eEnd > previewStartMin;
  });

  if (overlappingEvents.length === 0) {
    return { columnIndex: 0, columnCount: 1 };
  }

  const ghostItem = {
    id: draggedEventId,
    start: previewStartMin,
    end: previewEndMin,
    duration: previewEndMin - previewStartMin,
  };

  const cluster = overlappingEvents.map((e) => {
    const start = timeToMinutes(e.startTime);
    const end = timeToMinutes(e.endTime);
    return { id: e.id, start, end, duration: end - start };
  });

  cluster.push(ghostItem);

  cluster.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.duration - a.duration;
  });

  const lanes: number[] = [];
  let ghostColumnIndex = 0;

  for (const item of cluster) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (item.start >= lanes[i]) {
        lanes[i] = item.end;
        if (item.id === draggedEventId) ghostColumnIndex = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push(item.end);
      if (item.id === draggedEventId) ghostColumnIndex = lanes.length - 1;
    }
  }

  return {
    columnIndex: ghostColumnIndex,
    columnCount: lanes.length,
  };
};
