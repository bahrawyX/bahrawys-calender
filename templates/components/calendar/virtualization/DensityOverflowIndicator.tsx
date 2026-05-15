'use client';

/**
 * DensityOverflowIndicator — adapted for bahrawy-calendar package.
 */

import React, { useState, memo } from 'react';
import type { EventInstance } from 'bahrawy-calendar';
import { HOUR_HEIGHT, EVENT_COLORS } from 'bahrawy-calendar/compat';

// These are local component imports — keep them relative to your project
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { ScrollArea } from '../../ui/scroll-area';

function fmtHourLabel(hour: number): string {
  const h12 = hour % 12 || 12;
  const ap = hour < 12 ? 'AM' : 'PM';
  return `${String(h12).padStart(2, '0')}:00 ${ap}`;
}

function fmtTime(t: string): string {
  if (!t) return '';
  const [hStr, mStr = '00'] = t.split(':');
  const h = parseInt(hStr, 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ap}`;
}

function toMins(t: string): number {
  const [h, m = '0'] = t.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

const EventRow: React.FC<{
  event: EventInstance;
  onSelect: () => void;
}> = ({ event, onSelect }) => {
  const isOutlook = event.source === 'outlook';
  const color = isOutlook ? '#0078D4' : (EVENT_COLORS[event.category] ?? '#6D59E0');
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/60
        transition-colors duration-100 text-left cursor-pointer"
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate leading-tight">
          {event.title}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {fmtTime(event.startTime)} — {fmtTime(event.endTime)}
        </p>
      </div>
    </button>
  );
};
EventRow.displayName = 'EventRow';

const PopoverBody: React.FC<{
  hour: number;
  sortedEvents: EventInstance[];
  onEventClick?: (id: string) => void;
  onClose: () => void;
}> = ({ hour, sortedEvents, onEventClick, onClose }) => (
  <>
    <div className="px-3 py-2.5 border-b border-border/60">
      <p className="text-[11px] font-semibold text-foreground">
        {fmtHourLabel(hour)} — All Events
      </p>
    </div>
    <ScrollArea className="h-[320px]">
      <div className="p-2 space-y-0.5">
        {sortedEvents.map((ev) => (
          <EventRow
            key={ev.id}
            event={ev}
            onSelect={() => { onClose(); onEventClick?.(ev.id); }}
          />
        ))}
      </div>
    </ScrollArea>
  </>
);
PopoverBody.displayName = 'PopoverBody';

export interface DensityOverflowIndicatorProps {
  hour: number;
  overflow: number;
  isDense: boolean;
  hourEvents: EventInstance[];
  onEventClick?: (id: string) => void;
}

const DensityOverflowIndicator = memo<DensityOverflowIndicatorProps>(
  ({ hour, overflow, isDense, hourEvents, onEventClick }) => {
    const [open, setOpen] = useState(false);

    const sortedEvents = React.useMemo(
      () => [...hourEvents].sort((a, b) => toMins(a.startTime) - toMins(b.startTime)),
      [hourEvents],
    );

    const stop = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation();

    if (isDense) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute z-20 rounded-xl flex flex-col items-center justify-center gap-1
                bg-primary/[0.07] dark:bg-primary/10 border border-primary/15 dark:border-primary/20
                hover:bg-primary/[0.12] hover:border-primary/30 active:scale-[0.99]
                cursor-pointer pointer-events-auto select-none transition-all duration-150"
              style={{
                top: hour * HOUR_HEIGHT + 2,
                height: HOUR_HEIGHT - 4,
                left: 4,
                right: 4,
              }}
              onClick={(e) => { stop(e); setOpen(true); }}
              onPointerDown={stop}
            >
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 leading-none">
                Events
              </span>
              <span className="text-[13px] font-bold text-primary/80 leading-none mt-1">
                +{sortedEvents.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0 overflow-hidden"
            align="start"
            sideOffset={4}
            onClick={stop}
          >
            <PopoverBody
              hour={hour}
              sortedEvents={sortedEvents}
              onEventClick={onEventClick}
              onClose={() => setOpen(false)}
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-1.5 z-30 px-2 py-0.5 rounded-md text-[9px] font-bold
              bg-primary/10 text-primary hover:bg-primary/20 active:scale-95
              transition-all cursor-pointer pointer-events-auto select-none"
            style={{ top: hour * HOUR_HEIGHT + HOUR_HEIGHT - 22 }}
            onClick={(e) => { stop(e); setOpen(true); }}
            onPointerDown={stop}
          >
            +{overflow} more
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 overflow-hidden"
          align="start"
          sideOffset={4}
          onClick={stop}
        >
          <PopoverBody
            hour={hour}
            sortedEvents={sortedEvents}
            onEventClick={onEventClick}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

DensityOverflowIndicator.displayName = 'DensityOverflowIndicator';
export default DensityOverflowIndicator;
