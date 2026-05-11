import React from 'react';
import { EventInstance } from '../../../types';
import { EVENT_COLORS } from '../../../constants';
import { formatTime, timeToMinutes } from '../../../utils/dateUtils';
import { EditIcon, TrashIcon } from '../../icons';
import {
  GoogleProviderIcon,
  OutlookProviderIcon,
  AppleProviderIcon,
} from '../../icons/ProviderIcons';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';

/* ── Provider helpers ─────────────────────────────────────────────────────── */
type Provider = 'google' | 'microsoft' | 'apple' | 'local';

const PROVIDER_ACCENT: Record<string, string> = {
  google:    '#34A853',
  microsoft: '#0078D4',
  apple:     '#A8A9B0',
};

const PROVIDER_RGB: Record<string, string> = {
  google:    '52,168,83',
  microsoft: '0,120,212',
  apple:     '168,169,176',
};

const PROVIDER_LABEL: Record<string, string> = {
  google:    'Google Calendar',
  microsoft: 'Outlook Calendar',
  apple:     'Apple Calendar',
};

function resolveProvider(event: EventInstance): Provider {
  if (event.provider === 'google' || event.provider === 'microsoft' || event.provider === 'apple')
    return event.provider;
  if (event.source === 'outlook' || event.source === 'microsoft') return 'microsoft';
  if (event.source === 'google') return 'google';
  if (event.source === 'apple') return 'apple';
  return 'local';
}

/* ── Provider dot/icon for each row ──────────────────────────────────────── */
function ProviderDot({ provider, localColor }: { provider: Provider; localColor: string }) {
  if (provider === 'local') {
    return (
      <span
        className="mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: localColor }}
        aria-hidden="true"
      />
    );
  }

  const rgb = PROVIDER_RGB[provider];
  const Icon =
    provider === 'google' ? GoogleProviderIcon
    : provider === 'apple' ? AppleProviderIcon
    : OutlookProviderIcon;

  return (
    <span
      aria-hidden="true"
      className="mt-0.5 grid place-items-center flex-shrink-0"
      style={{
        width: 22,
        height: 22,
        borderRadius: 5,
        background: `rgba(${rgb},0.14)`,
        border: `1px solid rgba(${rgb},0.24)`,
      }}
    >
      <Icon
        size={13}
        className={provider === 'apple' ? 'text-[#3a3a3a] dark:text-[#d0d0d0]' : undefined}
      />
    </span>
  );
}

/* ── Component ────────────────────────────────────────────────────────────── */
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
                const provider = resolveProvider(event);
                const isExternal = provider !== 'local';
                const localColor = EVENT_COLORS[event.category] || '#7C5CFC';
                const accentColor = isExternal ? PROVIDER_ACCENT[provider] : localColor;
                const durationMins = Math.max(
                  0,
                  timeToMinutes(event.endTime) - timeToMinutes(event.startTime),
                );

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
                        <ProviderDot provider={provider} localColor={localColor} />

                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ color: isExternal ? accentColor : undefined }}
                          >
                            {event.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                            {formatTime(event.startTime)} – {formatTime(event.endTime)}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/85">
                            <span>{durationMins} min</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            <span>
                              {isExternal
                                ? PROVIDER_LABEL[provider]
                                : (event.category || 'Event')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Edit / Delete only for local events — provider events are read-only */}
                    {!isExternal && (
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
                    )}
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
