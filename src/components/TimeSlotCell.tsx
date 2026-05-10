'use client';

/**
 * TimeSlotCell
 * ------------
 * A first-class, independently clickable hour-slot cell in the time grid.
 *
 * Layer contract (z-index):
 *   z-0   visual grid lines  — pointer-events: none  (rendered in parent)
 *   z-[2] THIS component     — pointer-events: auto  (handles background clicks)
 *   z-10  TimeGridEvent cards — pointer-events: auto  (handle event clicks directly)
 *
 * Click routing:
 *   Any slot click emits a minute-accurate payload via onSlotClick(...)
 *   The parent decides whether to create immediately or show conflict UI.
 *
 * Event cards sit above (z-10 > z-2) so pointer events on events are
 * captured by the event card layer before reaching this cell.
 * The events container wrapper must carry pointer-events-none so that
 * empty-space clicks in that layer fall through to z-[2].
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { HOUR_HEIGHT } from '../utils/dateUtils';
import { hourLabel } from '../engine/slotEngine';

export interface TimelineSlotClickPayload {
  slotKey: string;
  dateISO: string;
  startMinute: number;
  clickedMinute: number;
  triggerHighlight: () => void;
}

interface TimeSlotCellProps {
  /** Deterministic slot key from makeSlotKey() */
  slotKey: string;
  dateISO: string;
  /** 0–23 */
  hour: number;
  /** Pre-computed: true when at least one event overlaps this hour */
  hasEvents: boolean;
  onSlotClick: (payload: TimelineSlotClickPayload) => void;
  /** Optional: called when a task is dropped from the TaskBoard via native HTML5 drag */
  onTaskDrop?: (taskId: string, dateISO: string, startMinute: number) => void;
}

const TimeSlotCell = memo<TimeSlotCellProps>(
  ({ slotKey, dateISO, hour, hasEvents, onSlotClick, onTaskDrop }) => {
    const [hovered, setHovered] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [flashOffsetPct, setFlashOffsetPct] = useState<number | null>(null);
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (flashTimerRef.current) {
          clearTimeout(flashTimerRef.current);
        }
      };
    }, []);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const relativeY = Math.max(0, Math.min(HOUR_HEIGHT, e.clientY - rect.top));
        const minuteOffset = Math.max(0, Math.min(59, Math.floor((relativeY / HOUR_HEIGHT) * 60)));
        const startMinute = hour * 60;
        const clickedMinute = Math.min(1439, startMinute + minuteOffset);

        const triggerHighlight = () => {
          setFlashOffsetPct((relativeY / HOUR_HEIGHT) * 100);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setFlashOffsetPct(null), 600);
        };

        onSlotClick({
          slotKey,
          dateISO,
          startMinute,
          clickedMinute,
          triggerHighlight,
        });
      },
      [slotKey, dateISO, hour, onSlotClick]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      if (e.dataTransfer.types.includes('application/lumina-task')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      }
    }, []);

    const handleDragLeave = useCallback(() => { setDragOver(false); }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      setDragOver(false);
      const raw = e.dataTransfer.getData('application/lumina-task');
      if (!raw || !onTaskDrop) return;
      try {
        const { taskId } = JSON.parse(raw);
        if (typeof taskId === 'string') {
          e.preventDefault();
          onTaskDrop(taskId, dateISO, hour * 60);
        }
      } catch { /* malformed - ignore */ }
    }, [onTaskDrop, dateISO, hour]);

    return (
      <div
        role="gridcell"
        aria-label={`${hourLabel(hour)} on ${dateISO}`}
        className="absolute left-0 right-0 cursor-crosshair"
        style={{
          top: `${hour * HOUR_HEIGHT}px`,
          height: `${HOUR_HEIGHT}px`,
          zIndex: 2,
          backgroundColor: dragOver
            ? 'rgba(109, 89, 224, 0.12)'
            : hovered
              ? 'rgba(109, 89, 224, 0.045)'
              : 'transparent',
          transition: 'background-color 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {flashOffsetPct != null && (
          <div
            className="absolute left-1.5 right-1.5 h-5 -translate-y-1/2 pointer-events-none rounded-md bg-primary/15 border border-primary/35 animate-pulse"
            style={{ top: `${flashOffsetPct}%` }}
          />
        )}

        {/* Half-hour dashed divider */}
        <div
          className="absolute left-0 right-0 border-t border-border/40 border-dashed pointer-events-none"
          style={{ top: '50%' }}
        />
        {/* Bottom hour border */}
        <div className="absolute bottom-0 left-0 right-0 border-b border-border/60 pointer-events-none" />
        {/* Hover time hint - non-blocking */}
        {hovered && (
          <span className="absolute right-2 top-1.5 text-[7.5px] font-bold text-primary/35 pointer-events-none select-none leading-none">
            {hourLabel(hour)}
            {!hasEvents && (
              <span className="block text-[7px] font-medium text-primary/25 mt-0.5">
                + Add
              </span>
            )}
          </span>
        )}
      </div>
    );
  }
);

TimeSlotCell.displayName = 'TimeSlotCell';
export default TimeSlotCell;
