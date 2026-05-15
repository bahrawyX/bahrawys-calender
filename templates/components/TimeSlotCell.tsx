'use client';

/**
 * TimeSlotCell — adapted for bahrawy-calendar package.
 *
 * All imports now come from 'bahrawy-calendar/compat' instead of relative paths.
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { HOUR_HEIGHT, hourLabel } from 'bahrawy-calendar/compat';

export interface TimelineSlotClickPayload {
  slotKey: string;
  dateISO: string;
  startMinute: number;
  clickedMinute: number;
  triggerHighlight: () => void;
}

interface TimeSlotCellProps {
  slotKey: string;
  dateISO: string;
  hour: number;
  hasEvents: boolean;
  onSlotClick: (payload: TimelineSlotClickPayload) => void;
  /** Optional: called when a task is dropped from an external task board via native HTML5 drag */
  onTaskDrop?: (taskId: string, dateISO: string, startMinute: number) => void;
  /** Override the drag data type identifier. Default: 'application/lumina-task' */
  dragDataType?: string;
}

const TimeSlotCell = memo<TimeSlotCellProps>(
  ({ slotKey, dateISO, hour, hasEvents, onSlotClick, onTaskDrop, dragDataType = 'application/lumina-task' }) => {
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
      if (e.dataTransfer.types.includes(dragDataType)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      }
    }, [dragDataType]);

    const handleDragLeave = useCallback(() => { setDragOver(false); }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      setDragOver(false);
      const raw = e.dataTransfer.getData(dragDataType);
      if (!raw || !onTaskDrop) return;
      try {
        const { taskId } = JSON.parse(raw);
        if (typeof taskId === 'string') {
          e.preventDefault();
          onTaskDrop(taskId, dateISO, hour * 60);
        }
      } catch { /* malformed - ignore */ }
    }, [onTaskDrop, dateISO, hour, dragDataType]);

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

        <div
          className="absolute left-0 right-0 border-t border-border/40 border-dashed pointer-events-none"
          style={{ top: '50%' }}
        />
        <div className="absolute bottom-0 left-0 right-0 border-b border-border/60 pointer-events-none" />
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
