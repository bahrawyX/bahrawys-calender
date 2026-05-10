'use client';

import React from 'react';
import Link from 'next/link';
import { useCoinsStore, selectCoinBalance } from '@/store/useCoinsStore';

/**
 * Three coin display variants used across the app:
 *   - chip:   compact inline pill (DailyBriefStrip)
 *   - card:   stat tile (PerformancePage Weekly Review)
 *   - hero:   large header treatment (ShopPage)
 *
 * All three subscribe to `useCoinsStore` — the only DB-backed source of
 * truth for the coin balance. When any code path updates the balance
 * (purchase, refetch, or `setBalance` after an award response), every
 * `<CoinsBadge />` mounted in the tree updates in the same React tick.
 *
 * Visuals share the same coin glyph + amber accent + tabular-nums numerals
 * so the three placements feel like the same component, not three forks.
 */

interface CoinsBadgeProps {
  variant?: 'chip' | 'card' | 'hero';
  /**
   * Override the value shown. Defaults to the live store balance — pass an
   * explicit value only when rendering a coin label that isn't the user's
   * current balance (e.g. an item cost). Hard-defaulting to the store keeps
   * the three placements in lockstep without each call site re-wiring.
   */
  amount?: number;
  /** Wrap in a `next/link` to /shop. Defaults true for chip + card variants. */
  href?: string | false;
  /** Optional caption — only shown on the card variant. */
  caption?: string;
  /** Test id — wires up to the existing data-testid in PerformancePage. */
  'data-testid'?: string;
  className?: string;
}

const CoinIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-amber-500"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M8 10h8M8 14h8" />
  </svg>
);

export const CoinsBadge: React.FC<CoinsBadgeProps> = ({
  variant = 'chip',
  amount,
  href,
  caption,
  className,
  ...rest
}) => {
  const liveBalance = useCoinsStore(selectCoinBalance);
  const value = typeof amount === 'number' ? amount : liveBalance;

  // Default linking behaviour: chip and card are clickable nav into /shop;
  // hero variant is non-interactive (it sits on the shop page itself).
  const resolvedHref =
    href === false
      ? null
      : href ?? (variant === 'hero' ? null : '/shop');

  if (variant === 'chip') {
    const inner = (
      <span
        className={[
          'inline-flex items-center gap-1.5 whitespace-nowrap',
          className ?? '',
        ].join(' ')}
        data-testid={rest['data-testid']}
      >
        <span className="opacity-70">
          <CoinIcon size={12} />
        </span>
        <span className="font-semibold tabular-nums text-foreground">{value}</span>
        <span className="text-muted-foreground/70">coins</span>
      </span>
    );
    return resolvedHref ? (
      <Link
        href={resolvedHref}
        className="hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.05] px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-md transition-colors"
      >
        {inner}
      </Link>
    ) : (
      inner
    );
  }

  if (variant === 'card') {
    const body = (
      <div
        className={[
          'flex flex-col gap-1 p-4 rounded-2xl bg-card border border-border shadow-sm',
          resolvedHref ? 'transition-colors hover:border-amber-500/30 hover:bg-amber-500/[0.03]' : '',
          className ?? '',
        ].join(' ')}
        data-testid={rest['data-testid']}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
          Coins
        </span>
        <div className="flex items-baseline gap-1.5">
          <CoinIcon size={22} />
          <span
            className="font-display text-2xl font-bold tabular-nums leading-none text-foreground"
            data-testid="coins-value"
          >
            {value.toLocaleString()}
          </span>
        </div>
        {caption && (
          <span className="text-[11px] text-muted-foreground/60 mt-0.5">{caption}</span>
        )}
      </div>
    );
    return resolvedHref ? <Link href={resolvedHref}>{body}</Link> : body;
  }

  // hero variant — large header treatment
  const heroBody = (
    <div
      className={[
        'flex items-baseline gap-1.5 flex-shrink-0',
        className ?? '',
      ].join(' ')}
      data-testid={rest['data-testid']}
    >
      <CoinIcon size={20} />
      <span
        className="font-display text-[26px] font-medium tabular-nums text-foreground leading-none"
        data-testid="coins-value"
      >
        {value.toLocaleString()}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        coins
      </span>
    </div>
  );
  return resolvedHref ? <Link href={resolvedHref}>{heroBody}</Link> : heroBody;
};
