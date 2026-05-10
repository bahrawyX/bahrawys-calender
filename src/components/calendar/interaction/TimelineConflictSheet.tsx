import React from 'react';
import { EventInstance } from '../../../types';
import { EVENT_COLORS } from '../../../constants';
import { formatTime, timeToMinutes } from '../../../utils/dateUtils';
import { EditIcon, TrashIcon } from '../../icons';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';

interface TimelineConflictSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTimeLabel: string;
  events: EventInstance[];
  onOpenEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const TimelineConflictSheet: React.FC<TimelineConflictSheetProps> = ({
  open,
  onOpenChange,
  selectedTimeLabel,
  events,
  onOpenEvent,
  onDeleteEvent,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-4 sm:w-[440px] sm:max-w-[480px]">
        <SheetHeader className="pr-10">
          <SheetTitle>Events at this time</SheetTitle>
          <SheetDescription>{selectedTimeLabel}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100dvh-140px)] pr-2">
          <div className="space-y-2 pb-4">
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No overlapping events found.
              </div>
            ) : (
              events.map((event) => {
                const color = EVENT_COLORS[event.category] || '#7C5CFC';
                const durationMins = Math.max(0, timeToMinutes(event.endTime) - timeToMinutes(event.startTime));

                return (
                  <div
                    key={event.id}
                    className="group rounded-xl border border-border/60 bg-background/70 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-border hover:bg-accent/60 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                  >
                    <button
                      type="button"
                      className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      onClick={() => onOpenEvent(event.id)}
                      aria-label={`Open ${event.title}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/85">
                            <span>{durationMins} min</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            <span>{event.category}</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="mt-2 flex gap-2 opacity-85 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenEvent(event.id)}
                        className="h-7 px-2 text-xs"
                        aria-label={`Edit ${event.title}`}
                      >
                        <EditIcon size={12} />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteEvent(event.id)}
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        aria-label={`Delete ${event.title}`}
                      >
                        <TrashIcon size={12} />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TimelineConflictSheet;
