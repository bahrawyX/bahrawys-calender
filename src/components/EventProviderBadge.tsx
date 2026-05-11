'use client';

/**
 * EventProviderBadge — a 14–18 px rounded-[4px] mini-chip that shows:
 *   • Google / Outlook / Apple → brand-tinted box with full-color provider logo
 *   • Local context events     → event-color-tinted box with category-specific
 *                                SVG icon (Critical, Focus, Work, Personal,
 *                                Social, Health, or a generic dot fallback)
 *
 * Used in both EventItem (event pills) and MonthView's overflow popover so
 * provider identity is always visible without eating into title space.
 */

import React from 'react';
import { AppleProviderIcon, GoogleProviderIcon, OutlookProviderIcon } from './icons/ProviderIcons';

/* ── Provider colour table (RGB strings matching EventItem.tsx) ───────────── */
const PROVIDER_RGB: Record<string, string> = {
  google:    '52,168,83',
  microsoft: '0,120,212',
  apple:     '168,169,176',
};

/* ── Category-specific micro-icons ───────────────────────────────────────── */
function CategoryIcon({ category, size }: { category: string; size: number }) {
  const s = size;
  const cat = category?.toLowerCase();

  if (cat === 'critical') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {/* Warning triangle with exclamation */}
        <path d="M12 2.5 L22 20.5 H2 Z" strokeLinejoin="round" />
        <path d="M12 9v5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <circle cx="12" cy="17.5" r="1.2" />
      </svg>
    );
  }

  if (cat === 'focus') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (cat === 'work') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    );
  }

  if (cat === 'personal') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    );
  }

  if (cat === 'social') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  if (cat === 'health') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }

  /* Default — a solid circle (matches the existing colored dot metaphor) */
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

/* ── hex → "r,g,b" ───────────────────────────────────────────────────────── */
function hexToRgb(hex: string): string | null {
  if (!hex || hex[0] !== '#') return null;
  let c = hex.slice(1);
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return null;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `${r},${g},${b}`;
}

/* ── Public API ───────────────────────────────────────────────────────────── */
interface EventProviderBadgeProps {
  /** Resolved provider — pass 'local' for non-external events. */
  provider: 'google' | 'microsoft' | 'apple' | 'local';
  /** Badge size in px. Icon renders at ~62 % of this. Default 16. */
  size?: number;
  /** For local events only — drives the icon glyph selection. */
  category?: string;
  /** For local events only — hex color used for tinting. */
  color?: string;
}

export function EventProviderBadge({
  provider,
  size = 16,
  category,
  color,
}: EventProviderBadgeProps) {
  const iconSize = Math.max(7, Math.round(size * 0.62));

  /* ── External provider ── */
  if (provider !== 'local') {
    const rgb = PROVIDER_RGB[provider] ?? '128,128,128';
    const ProviderIcon =
      provider === 'apple'
        ? AppleProviderIcon
        : provider === 'google'
          ? GoogleProviderIcon
          : OutlookProviderIcon;

    const iconClass =
      provider === 'apple'
        ? 'text-[#3a3a3a] dark:text-[#d0d0d0]'
        : '';

    return (
      <span
        aria-hidden
        className="grid place-items-center flex-shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          background: `rgba(${rgb},0.18)`,
          border: `1px solid rgba(${rgb},0.25)`,
          boxShadow: `0 0 0 1px rgba(${rgb},0.08)`,
        }}
      >
        <ProviderIcon size={iconSize} className={iconClass} />
      </span>
    );
  }

  /* ── Local / context event ── */
  const rgb = color ? hexToRgb(color) : null;
  const fill = color ?? '#6D59E0';

  return (
    <span
      aria-hidden
      className="grid place-items-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: rgb ? `rgba(${rgb},0.2)` : `${fill}20`,
        border: `1px solid ${rgb ? `rgba(${rgb},0.28)` : `${fill}30`}`,
        color: fill,
      }}
    >
      <CategoryIcon category={category ?? ''} size={iconSize} />
    </span>
  );
}
