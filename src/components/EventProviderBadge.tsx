'use client';

/**
 * EventProviderBadge
 *
 * A self-contained, library-ready badge that visually identifies the source
 * of a calendar event. Intended for use in list contexts (overflow popovers,
 * sidebars, agenda views) where there is room to show identity without
 * impacting the compact event pill layout.
 *
 * Props are intentionally decoupled from any internal store — the caller
 * resolves the provider string and passes a hex color so this component
 * has zero app-level dependencies.
 */

import React from 'react';
import {
  AppleProviderIcon,
  GoogleProviderIcon,
  OutlookProviderIcon,
} from './icons/ProviderIcons';

/* ── Provider color table ────────────────────────────────────────────────── */
const PROVIDER_RGB: Record<string, string> = {
  google:    '52,168,83',
  microsoft: '0,120,212',
  apple:     '168,169,176',
};

/* ── hex → "r,g,b" helper ───────────────────────────────────────────────── */
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

/* ── Category micro-icons (local / context events) ──────────────────────── */
function CategoryIcon({ category, size }: { category: string; size: number }) {
  const s = size;
  const cat = (category ?? '').toLowerCase();

  if (cat === 'critical') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
  /* Default — solid circle (mirrors the colored-dot metaphor) */
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export interface EventProviderBadgeProps {
  /** Resolved provider. Pass `'local'` for non-external events. */
  provider: 'google' | 'microsoft' | 'apple' | 'local';
  /**
   * Badge size in px. The icon is scaled to ~60 % of this value.
   * @default 20
   */
  size?: number;
  /** Local events only — drives the category glyph. */
  category?: string;
  /**
   * Local events only — hex color (#rrggbb / #rgb) for tinting.
   * Non-hex strings (e.g. CSS vars) fall back to the default purple.
   */
  color?: string;
}

export function EventProviderBadge({
  provider,
  size = 20,
  category,
  color,
}: EventProviderBadgeProps) {
  const iconSize = Math.max(8, Math.round(size * 0.58));

  /* ── External provider (Google / Outlook / Apple) ── */
  if (provider !== 'local') {
    const rgb = PROVIDER_RGB[provider] ?? '128,128,128';

    const ProviderIcon =
      provider === 'apple'
        ? AppleProviderIcon
        : provider === 'google'
          ? GoogleProviderIcon
          : OutlookProviderIcon;

    const iconClass =
      provider === 'apple' ? 'text-[#3a3a3a] dark:text-[#d0d0d0]' : '';

    return (
      <span
        aria-hidden
        className="grid place-items-center flex-shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: 5,
          background: `rgba(${rgb},0.14)`,
          border: `1px solid rgba(${rgb},0.24)`,
          boxShadow: `0 0 0 1.5px rgba(${rgb},0.07)`,
        }}
      >
        <ProviderIcon size={iconSize} className={iconClass} />
      </span>
    );
  }

  /* ── Local / context event ── */
  const safeColor = color && color[0] === '#' ? color : undefined;
  const rgb = safeColor ? hexToRgb(safeColor) : null;
  const fill = safeColor ?? '#6D59E0';

  return (
    <span
      aria-hidden
      className="grid place-items-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        background: rgb ? `rgba(${rgb},0.16)` : `${fill}22`,
        border: `1px solid ${rgb ? `rgba(${rgb},0.26)` : `${fill}35`}`,
        color: fill,
      }}
    >
      <CategoryIcon category={category ?? ''} size={iconSize} />
    </span>
  );
}
