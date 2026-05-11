'use client';

import React, { memo } from 'react';
import { CalendarEvent } from '../types';
import { EVENT_COLORS } from '../constants';
import { RepeatIcon } from './icons';
import { EventProviderBadge } from './EventProviderBadge';

/* ── Provider theming ────────────────────────────────────────────────────────
 * Each external provider gets a tinted gradient card matching its brand
 * identity:
 *   • Apple   → silver-titanium  (#A8A9B0)
 *   • Google  → brand green      (#34A853)
 *   • Outlook → brand blue       (#0078D4)
 *
 * `iconClassName` only applies to providers whose icon is inline-SVG that
 * inherits `currentColor` (Apple). Google/Outlook icons are full-color
 * brand `<img>` SVGs that don't recolor — those leave it empty.
 */
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
  // microsoft / outlook
  return {
    rgb: '0,120,212',
    accent: '#0078D4',
    iconClassName: '',
  };
}

/**
 * Parse a `#rrggbb` / `#rgb` hex string into an `r,g,b` triplet for use in
 * `rgba(...)` declarations. Returns null for non-hex colors (e.g. the
 * `hsl(var(--primary))` fallback used when a category lookup fails) so the
 * caller can fall back to a flat tint.
 */
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

  /* ── External (Apple / Google / Outlook) — compact card ─────────── */
  if (compact && isExternal) {
    const theme = getProviderTheme(provider as ExternalProvider);
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
        <EventProviderBadge provider={provider as 'google' | 'microsoft' | 'apple'} size={15} />
        <span
          className="truncate text-[11px] min-[1400px]:text-[12px] font-medium leading-none"
          style={{ color: theme.accent }}
        >
          {event.title}{timeLabel ? ` · ${timeLabel}` : ''}
        </span>
      </button>
    );
  }

  /* ── External (Apple / Google / Outlook) — normal card ──────────── */
  if (isExternal) {
    const theme = getProviderTheme(provider as ExternalProvider);
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
        <span className="flex items-center gap-1.5 min-w-0">
          <EventProviderBadge provider={provider as 'google' | 'microsoft' | 'apple'} size={16} />
          {isRecurring && (
            <RepeatIcon
              size={10}
              className={`flex-shrink-0 ${event.isRecurrenceException ? 'opacity-100' : 'opacity-50'}`}
              style={{ color: theme.accent }}
            />
          )}
          <span
            className="truncate text-[11px] font-semibold leading-tight"
            style={{ color: theme.accent }}
          >
            {event.title}
          </span>
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

  /* ── Local (built-in & custom contexts) ─────────────────────────── */
  // Prefer the event's stored color (filled in by EventModal at save time so
  // custom-context events keep their picked color), falling back to the
  // built-in category map.
  const color = event.color || EVENT_COLORS[event.category] || '#6D59E0';
  const rgb = hexToRgb(color);

  // Match the provider-card visual language: gradient background + thin
  // all-around border + 3px accented left rail. Falls back gracefully when
  // the color isn't a hex string (e.g. an old event saved with the hsl()
  // primary fallback).
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
        <EventProviderBadge provider="local" category={event.category} color={color} size={15} />
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
        className="flex items-center gap-1.5 min-w-0"
        style={{ opacity: event.completed ? 0.45 : 1 }}
      >
        <EventProviderBadge provider="local" category={event.category} color={color} size={16} />
        {isRecurring && (
          <RepeatIcon
            size={10}
            className={`flex-shrink-0 ${event.isRecurrenceException ? 'opacity-100' : 'opacity-50'}`}
            style={{ color }}
          />
        )}
        <span
          className="truncate text-[11px] font-semibold leading-tight"
          style={{ color }}
        >
          {event.title}
        </span>
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
