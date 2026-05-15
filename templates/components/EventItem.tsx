'use client';

/**
 * EventItem — adapted for bahrawy-calendar package.
 *
 * All imports now come from 'bahrawy-calendar/compat' instead of relative paths.
 */

import React, { memo } from 'react';
import type { CalendarEvent } from 'bahrawy-calendar';
import { EVENT_COLORS } from 'bahrawy-calendar/compat';

// These are local component imports — keep them relative to your project
import { GoogleProviderIcon, OutlookProviderIcon, RepeatIcon } from './icons';
import { AppleProviderIcon } from './icons/ProviderIcons';

type ExternalProvider = 'google' | 'microsoft' | 'apple';

interface ProviderTheme {
  rgb: string;
  accent: string;
  iconClassName: string;
}

function getProviderTheme(provider: ExternalProvider): ProviderTheme {
  if (provider === 'apple') {
    return {
      rgb: '168,169,176',
      accent: '#A8A9B0',
      iconClassName: 'text-[#1d1d1f] dark:text-[#C0C0C0]',
    };
  }
  if (provider === 'google') {
    return {
      rgb: '52,168,83',
      accent: '#34A853',
      iconClassName: '',
    };
  }
  return {
    rgb: '0,120,212',
    accent: '#0078D4',
    iconClassName: '',
  };
}

function hexToRgb(hex: string): string | null {
  if (!hex || hex[0] !== '#') return null;
  let cleaned = hex.slice(1);
  if (cleaned.length === 3) cleaned = cleaned.split('').map((c) => c + c).join('');
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r},${g},${b}`;
}

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
        : event.source === 'apple'
          ? 'apple'
          : 'local');
  const isExternal = provider === 'microsoft' || provider === 'google' || provider === 'apple';
  const isRecurring = !!(event.recurrence || event.recurringEventId || event.isRecurrenceException);
  const timeLabel = event.startTime ? fmt(event.startTime) : null;

  if (compact && isExternal) {
    const theme = getProviderTheme(provider as ExternalProvider);
    const ProviderIcon = provider === 'apple'
      ? AppleProviderIcon
      : provider === 'google'
        ? GoogleProviderIcon
        : OutlookProviderIcon;
    return (
      <button
        draggable={false}
        onClick={(e) => { e.stopPropagation(); onClick(event.id); }}
        className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 min-[1400px]:gap-2 min-[1400px]:px-2.5 min-[1400px]:py-2 rounded-lg cursor-default group focus:outline-none"
        style={{
          background: `linear-gradient(135deg, rgba(${theme.rgb},0.14) 0%, rgba(${theme.rgb},0.05) 100%)`,
          border: `1px solid rgba(${theme.rgb},0.22)`,
        }}
      >
        <ProviderIcon size={13} className={`flex-shrink-0 ${theme.iconClassName}`} />
        <span
          className="truncate text-[11px] min-[1400px]:text-[12px] font-medium leading-none"
          style={{ color: theme.accent }}
        >
          {event.title}{timeLabel ? ` · ${timeLabel}` : ''}
        </span>
      </button>
    );
  }

  if (isExternal) {
    const theme = getProviderTheme(provider as ExternalProvider);
    const ProviderIcon = provider === 'apple'
      ? AppleProviderIcon
      : provider === 'google'
        ? GoogleProviderIcon
        : OutlookProviderIcon;
    return (
      <button
        draggable={false}
        onClick={(e) => { e.stopPropagation(); onClick(event.id); }}
        className="w-full text-left flex flex-col px-2.5 py-2 min-[1400px]:py-2.5 rounded-lg cursor-default group focus:outline-none"
        style={{
          background: `linear-gradient(135deg, rgba(${theme.rgb},0.14) 0%, rgba(${theme.rgb},0.05) 100%)`,
          border: `1px solid rgba(${theme.rgb},0.20)`,
          boxShadow: `0 1px 3px rgba(${theme.rgb},0.10)`,
        }}
      >
        <span
          className="truncate text-[11px] font-semibold leading-tight flex items-center gap-1.5"
          style={{ color: theme.accent }}
        >
          <ProviderIcon size={14} className={`flex-shrink-0 ${theme.iconClassName}`} />
          {isRecurring && (
            <RepeatIcon
              size={10}
              className={`flex-shrink-0 ${event.isRecurrenceException ? 'opacity-100' : 'opacity-50'}`}
            />
          )}
          {event.title}
        </span>
        {timeLabel && (
          <span
            className="text-[10px] font-normal leading-tight mt-0.5 tabular-nums"
            style={{ color: theme.accent, opacity: 0.65 }}
          >
            {timeLabel}
          </span>
        )}
      </button>
    );
  }

  const color = event.color || EVENT_COLORS[event.category] || '#6D59E0';
  const rgb = hexToRgb(color);

  const localCardStyle: React.CSSProperties = rgb
    ? {
        background: `linear-gradient(135deg, rgba(${rgb},0.14) 0%, rgba(${rgb},0.05) 100%)`,
        border: `1px solid rgba(${rgb},0.22)`,
        boxShadow: `0 1px 3px rgba(${rgb},0.08)`,
      }
    : {
        backgroundColor: `${color}12`,
        border: `1px solid ${color}20`,
      };

  if (compact) {
    return (
      <button
        draggable
        onDragStart={(e) => { e.dataTransfer.setData('eventId', event.id); }}
        onClick={(e) => { e.stopPropagation(); onClick(event.id); }}
        className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 min-[1400px]:gap-2 min-[1400px]:px-2.5 min-[1400px]:py-2 rounded-lg transition-all duration-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer hover:-translate-y-[1px]"
        style={localCardStyle}
      >
        <span
          className="w-1.5 h-1.5 min-[1400px]:w-2 min-[1400px]:h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className="truncate text-[11px] min-[1400px]:text-[12px] font-semibold leading-none"
          style={{ color, opacity: event.completed ? 0.45 : 1 }}
        >
          {event.title}{timeLabel ? ` · ${timeLabel}` : ''}
        </span>
      </button>
    );
  }

  return (
    <button
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('eventId', event.id); }}
      onClick={(e) => { e.stopPropagation(); onClick(event.id); }}
      className="w-full text-left flex flex-col px-2.5 py-2 min-[1400px]:py-2.5 rounded-lg transition-all duration-[120ms] ease-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]"
      style={localCardStyle}
    >
      <span
        className="truncate text-[11px] font-semibold leading-tight flex items-center gap-1.5"
        style={{ color, opacity: event.completed ? 0.45 : 1 }}
      >
        {isRecurring && (
          <RepeatIcon
            size={10}
            className={`flex-shrink-0 ${event.isRecurrenceException ? 'opacity-100' : 'opacity-50'}`}
          />
        )}
        {event.title}
      </span>
      {timeLabel && (
        <span
          className="text-[10px] font-normal leading-tight mt-0.5 tabular-nums"
          style={{ color, opacity: 0.65 }}
        >
          {timeLabel}
        </span>
      )}
    </button>
  );
});
EventItem.displayName = 'EventItem';

export default EventItem;
