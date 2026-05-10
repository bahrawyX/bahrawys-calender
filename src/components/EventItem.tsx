'use client';

import React, { memo } from 'react';
import { CalendarEvent } from '../types';
import { EVENT_COLORS } from '../constants';
import { GoogleProviderIcon, OutlookProviderIcon, RepeatIcon } from './icons';

interface EventItemProps {
  event: CalendarEvent;
  onClick: (id: string) => void;
  compact?: boolean;
}

function fmt(t: string): string {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${m} ${period}`;
}

const EventItem = memo<EventItemProps>(({ event, onClick, compact }) => {
  const provider = event.provider
    || (event.source === 'outlook' || event.source === 'microsoft'
      ? 'microsoft'
      : event.source === 'google'
        ? 'google'
        : 'local');
  const isExternal = provider === 'microsoft' || provider === 'google';
  const isRecurring = !!(event.recurrence || event.recurringEventId || event.isRecurrenceException);

  const color = isExternal
    ? (event.color || (provider === 'google' ? '#4285F4' : '#0078D4'))
    : (EVENT_COLORS[event.category] ?? '#6D59E0');
  const timeLabel = event.startTime ? fmt(event.startTime) : null;

  if (compact) {
    return (
      <button
        draggable={!isExternal}
        onDragStart={(e) => {
          if (isExternal) { e.preventDefault(); return; }
          e.dataTransfer.setData('eventId', event.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(event.id);
        }}
        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 min-[1400px]:gap-2 min-[1400px]:px-2.5 min-[1400px]:py-1.5 rounded-md transition-colors duration-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          isExternal ? 'cursor-default' : 'cursor-pointer hover:brightness-95'
        }`}
        style={{ backgroundColor: `${color}12`, borderLeft: `2px solid ${color}` }}
      >
        <span
          className="w-1.5 h-1.5 min-[1400px]:w-2 min-[1400px]:h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className="truncate text-[11px] min-[1400px]:text-[12px] font-medium leading-none"
          style={{ opacity: event.completed ? 0.45 : 1, color: isExternal ? color : undefined }}
        >
          {event.title}{timeLabel ? ` · ${timeLabel}` : ''}
        </span>
      </button>
    );
  }

  return (
    <button
      draggable={!isExternal}
      onDragStart={(e) => {
        if (isExternal) { e.preventDefault(); return; }
        e.dataTransfer.setData('eventId', event.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event.id);
      }}
      className={`w-full text-left flex flex-col px-2 py-1.5 rounded-md transition-all duration-[120ms] ease-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        isExternal
          ? 'cursor-default'
          : 'cursor-pointer hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]'
      }`}
      style={{
        backgroundColor: `${color}12`,
        borderLeft: `2px solid ${color}`,
      }}
    >
      <span
        className={`truncate text-[11px] font-medium leading-tight group-hover:text-foreground flex items-center gap-1 ${
          isExternal ? '' : 'text-foreground'
        }`}
        style={{
          opacity: event.completed ? 0.45 : 1,
          color: isExternal ? color : undefined,
        }}
      >
        {isRecurring && (
          <RepeatIcon
            size={10}
            className={`flex-shrink-0 ${event.isRecurrenceException ? 'opacity-100' : 'opacity-50'}`}
          />
        )}
        {isExternal && (provider === 'google'
          ? <GoogleProviderIcon size={10} className="flex-shrink-0" />
          : <OutlookProviderIcon size={10} className="flex-shrink-0 opacity-80" />)}
        {event.title}
      </span>
      {timeLabel && (
        <span className={`text-[10px] font-normal leading-tight mt-0.5 tabular-nums ${
          isExternal ? '' : 'text-muted-foreground'
        }`} style={{
          color: isExternal ? color : undefined,
          opacity: isExternal ? 0.72 : undefined,
        }}>
          {timeLabel}
        </span>
      )}
    </button>
  );
});
EventItem.displayName = 'EventItem';

export default EventItem;
