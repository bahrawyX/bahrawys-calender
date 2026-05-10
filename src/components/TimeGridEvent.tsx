'use client';

import React from 'react';
import { EventInstance } from '../types';
import { EVENT_COLORS } from '../constants';
import { formatTime, getEventPosition, timeToMinutes } from '../utils/dateUtils';
import {
  VideoIcon as Video,
  ExternalLinkIcon as ExternalLink,
  GoogleProviderIcon,
  OutlookProviderIcon,
  RepeatIcon,
} from './icons';
import { AppleProviderIcon } from './icons/ProviderIcons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TimeGridEventProps {
  event: EventInstance;
  onClick: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  width?: string;
  left?: string;
  isGhost?: boolean;
  hasConflict?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  isDraggedOrigin?: boolean;
  renderInitialsMode?: boolean;
  adaptiveTitleCompaction?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

function getEventInitials(title: string): string {
  const cleanedWords = title
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean);

  if (cleanedWords.length >= 2) {
    return `${cleanedWords[0][0] ?? ''}${cleanedWords[1][0] ?? ''}`.toUpperCase();
  }

  const oneWord = cleanedWords[0] ?? title.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '');
  return oneWord.slice(0, 2).toUpperCase();
}

/**
 * EventContent — pure presentational layer (title, time, badges).
 * Separated so positional changes to EventShell don't re-render text content.
 */
const EventContent = React.memo<{
  event: EventInstance;
  duration: number;
  isShort: boolean;
  isVeryShort: boolean;
  isNarrow: boolean;
  isExternal: boolean;
  provider: 'local' | 'google' | 'microsoft' | 'apple';
  accentColor: string;
  forceInitialsMode: boolean;
  adaptiveTitleCompaction: boolean;
}>(({ event, duration, isShort, isVeryShort, isNarrow, isExternal, provider, accentColor, forceInitialsMode, adaptiveTitleCompaction }) => {
  const useCompactTitle = adaptiveTitleCompaction && (isShort || isNarrow);
  const displayTitle = forceInitialsMode
    ? getEventInitials(event.title)
    : useCompactTitle
    ? event.title.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') + '..'
    : event.title;

  const isRecurring = !!(event.recurrence || event.recurringEventId || event.isRecurrenceException);
  const showRecurringIcon = isRecurring && !isVeryShort;

  return (
    <>
      <div className="flex items-start justify-between gap-1 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {showRecurringIcon && (
            <RepeatIcon
              size={isShort ? 10 : 12}
              className={`flex-shrink-0 ${event.isRecurrenceException ? 'opacity-100' : 'opacity-50'}`}
            />
          )}
          {isExternal && !isVeryShort && (
            provider === 'google'
              ? <GoogleProviderIcon size={isShort ? 10 : 12} className="flex-shrink-0" />
              : provider === 'apple'
                ? <AppleProviderIcon size={isShort ? 11 : 13} className="flex-shrink-0 opacity-90" />
                : <OutlookProviderIcon size={isShort ? 10 : 12} className="flex-shrink-0 opacity-80" />
          )}
          {(forceInitialsMode || useCompactTitle) ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4
                    className={`font-bold leading-tight overflow-hidden ${
                      isExternal ? '' : 'text-foreground'
                    } ${isVeryShort ? 'text-[8px]' : isShort ? 'text-[9px]' : 'text-[11px]'}`}
                    style={{ color: isExternal ? accentColor : undefined }}
                  >
                    {displayTitle}
                  </h4>
                </TooltipTrigger>
                <TooltipContent side="top">{event.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <h4
              className={`font-bold leading-tight overflow-hidden ${
                isExternal ? '' : 'text-foreground'
              } ${isVeryShort ? 'text-[8px]' : isShort ? 'text-[9px]' : 'text-[11px]'}`}
              style={{ color: isExternal ? accentColor : undefined }}
            >
              {displayTitle}
            </h4>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {event.meetingLink && !isVeryShort && (
            <div className="px-1.5 py-0.5 bg-white/50 dark:bg-black/20 rounded-md">
              <Video size={10} className="text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Start time — always shown unless the card is too tiny to fit a second line */}
      {!isVeryShort && (
        <div className="flex items-center gap-1.5 opacity-60">
          <span className={`font-bold leading-none ${
            isExternal ? '' : 'text-muted-foreground'
          } ${(isShort || forceInitialsMode) ? 'text-[8px]' : 'text-[9px]'}`} style={{
            color: isExternal ? accentColor : undefined,
            opacity: isExternal ? 0.75 : undefined,
          }}>
            {formatTime(event.startTime)}
          </span>
          {isExternal && event.organizer && !isShort && !forceInitialsMode && duration > 45 && (
            <span className="text-[8px] truncate" style={{ color: accentColor, opacity: 0.55 }}>
              {event.organizer}
            </span>
          )}
        </div>
      )}

      {/* Location — only for full-size cards */}
      {!isShort && !forceInitialsMode && event.location && duration > 45 && (
        <span className="text-[9px] text-muted-foreground/70 italic truncate mt-auto leading-none flex items-center gap-1">
          <ExternalLink size={8} /> {event.location}
        </span>
      )}
    </>
  );
}, (prev, next) =>
  prev.event.title === next.event.title &&
  prev.event.startTime === next.event.startTime &&
  prev.event.endTime === next.event.endTime &&
  prev.event.location === next.event.location &&
  prev.event.meetingLink === next.event.meetingLink &&
  prev.event.organizer === next.event.organizer &&
  prev.event.source === next.event.source &&
  prev.event.provider === next.event.provider &&
  prev.event.category === next.event.category &&
  prev.event.recurrence === next.event.recurrence &&
  prev.event.recurringEventId === next.event.recurringEventId &&
  prev.event.isRecurrenceException === next.event.isRecurrenceException &&
  prev.isShort === next.isShort &&
  prev.isNarrow === next.isNarrow &&
  prev.forceInitialsMode === next.forceInitialsMode &&
  prev.adaptiveTitleCompaction === next.adaptiveTitleCompaction
);
EventContent.displayName = 'EventContent';

/**
 * EventShell — handles position, drag, resize, and visual state.
 * Uses CSS transitions instead of framer-motion for all static events.
 * Only the actively-dragged event gets willChange: transform.
 * `contain: layout style paint` isolates each card's rendering cost.
 */
const TimeGridEvent = React.memo<TimeGridEventProps>(({
  event,
  onClick,
  onDoubleClick,
  width = '100%',
  left = '0%',
  isGhost = false,
  isSelected = false,
  isDimmed = false,
  isDraggedOrigin = false,
  renderInitialsMode = false,
  adaptiveTitleCompaction = true,
  onPointerDown,
}) => {
  const pointerDownPos = React.useRef({ x: 0, y: 0 });

  const { top, height } = getEventPosition(event.startTime, event.endTime);
  const provider: 'local' | 'google' | 'microsoft' | 'apple' =
    event.provider === 'google' ? 'google'
    : event.provider === 'microsoft' || event.provider === 'outlook' ? 'microsoft'
    : event.provider === 'apple' ? 'apple'
    : event.source === 'outlook' || event.source === 'microsoft' ? 'microsoft'
    : event.source === 'google' ? 'google'
    : event.source === 'apple' ? 'apple'
    : 'local';
  const isExternal = provider === 'microsoft' || provider === 'google' || provider === 'apple';

  const isApple = provider === 'apple';
  const APPLE_ACCENT = '#A2845E';
  const color = isApple
    ? APPLE_ACCENT
    : isExternal
      ? (event.color || (provider === 'google' ? '#4285F4' : '#0078D4'))
      : (EVENT_COLORS[event.category] || '#7C5CFC');

  const duration = timeToMinutes(event.endTime) - timeToMinutes(event.startTime);
  const isShort = duration < 30;
  const isVeryShort = duration < 20;

  const widthPct = parseFloat(width);
  const isNarrow = !isNaN(widthPct) && widthPct < 45;

  return (
    <div
      data-hover-card="true"
      onPointerDown={(e) => {
        if (isGhost || isExternal) return;
        if (e.button !== 0) return;
        e.stopPropagation();
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        if (onPointerDown) onPointerDown(e);
      }}
      onClick={(e) => {
        if (isGhost) return;
        e.stopPropagation();
        const dx = Math.abs(e.clientX - pointerDownPos.current.x);
        const dy = Math.abs(e.clientY - pointerDownPos.current.y);
        if (dx > 5 || dy > 5) return;
        onClick(event.id);
      }}
      onDoubleClick={(e) => {
        if (isGhost || isExternal) return;
        e.stopPropagation();
        if (onDoubleClick) onDoubleClick(event.id);
      }}
      className={`absolute rounded-xl overflow-hidden flex flex-col gap-0.5 ${
        isGhost ? 'border-dashed pointer-events-none'
        : isExternal ? 'cursor-default pointer-events-auto'
        : 'cursor-pointer pointer-events-auto hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${left} + 5px)`,
        width: `calc(${width} - 10px)`,
        ...(isApple ? {
          /* Apple-flavored card: warm champagne gradient, subtle all-around border */
          background: 'linear-gradient(135deg, rgba(162,132,94,0.12) 0%, rgba(162,132,94,0.05) 100%)',
          border: '1px solid rgba(162,132,94,0.18)',
          borderLeft: '3px solid rgba(162,132,94,0.50)',
        } : {
          backgroundColor: isExternal
            ? `${color}14`
            : `${color}${isSelected ? '1c' : '10'}`,
          borderLeft: isExternal
            ? `3.5px solid ${color}`
            : `3px solid ${color}${isSelected ? 'cc' : '70'}`,
          borderTop: `1px solid ${color}12`,
          borderRight: `1px solid ${color}08`,
          borderBottom: `1px solid ${color}08`,
        }),
        padding: '6px 8px',
        zIndex: isSelected ? 20 : 10,
        boxSizing: 'border-box',
        opacity: isDraggedOrigin ? 0.35 : isGhost ? 0.28 : isDimmed ? 0.68 : 1,
        filter: isDraggedOrigin ? 'saturate(0)' : 'saturate(1)',
        boxShadow: isDraggedOrigin || isGhost ? 'none' : isApple
          ? '0 1px 4px rgba(162,132,94,0.10), 0 0 0 0.5px rgba(162,132,94,0.06)'
          : isSelected
            ? `0 4px 18px ${color}30, 0 1px 4px ${color}1a`
            : '0 1px 3px rgba(0,0,0,0.06)',
        willChange: isDraggedOrigin ? 'transform' : undefined,
        contain: 'layout style paint',
        transition: isDraggedOrigin ? 'none' : 'opacity 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease-out',
      }}
    >
      <EventContent
        event={event}
        duration={duration}
        isShort={isShort}
        isVeryShort={isVeryShort}
        isNarrow={isNarrow}
        isExternal={isExternal}
        provider={provider}
        accentColor={color}
        forceInitialsMode={renderInitialsMode}
        adaptiveTitleCompaction={adaptiveTitleCompaction}
      />
    </div>
  );
}, (prev, next) =>
  prev.event.id === next.event.id &&
  prev.event.startTime === next.event.startTime &&
  prev.event.endTime === next.event.endTime &&
  prev.event.title === next.event.title &&
  prev.event.category === next.event.category &&
  prev.isDraggedOrigin === next.isDraggedOrigin &&
  prev.isSelected === next.isSelected &&
  prev.isDimmed === next.isDimmed &&
  prev.isGhost === next.isGhost &&
  prev.renderInitialsMode === next.renderInitialsMode &&
  prev.adaptiveTitleCompaction === next.adaptiveTitleCompaction &&
  prev.width === next.width &&
  prev.left === next.left &&
  prev.hasConflict === next.hasConflict
);

TimeGridEvent.displayName = 'TimeGridEvent';

export default TimeGridEvent;
