'use client';

/**
 * HoverTimeIndicator
 *
 * GPU-composited hover line + cap circle + time badge for Day / Week grids.
 * Zero React re-renders on mousemove — all DOM writes are imperative.
 *
 * Root element IS the line (height: 2px, left: 80 → right: 0).
 * Cap + badge are absolute children that overflow the root vertically.
 * overflow: visible on root means ancestor overflow-hidden cannot clip them
 * the way height: 0 children could be.
 * visibility: hidden/visible — instant toggle, no opacity-transition lag.
 */

import React, { useImperativeHandle, forwardRef, useRef } from 'react';

export interface HoverIndicatorHandle {
  /** Move indicator to y px from parent top, show label, position cap+badge at colLeftPx. */
  update(y: number, label: string, colLeftPx?: number): void;
  /** Hide instantly. */
  hide(): void;
}

const CAP = 8;  // cap circle diameter px
const GAP = 5;  // gap between cap right-edge and badge

const HoverTimeIndicator = forwardRef<HoverIndicatorHandle>((_props, ref) => {
  const rootRef  = useRef<HTMLDivElement>(null);
  const capRef   = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    update(y: number, label: string, colLeftPx?: number) {
      const root  = rootRef.current;
      const cap   = capRef.current;
      const badge = badgeRef.current;
      if (!root || !cap || !badge) return;

      // GPU-composited vertical position (no layout recalc)
      root.style.transform = `translateY(${y}px)`;

      // cap + badge track the active column. Root starts at left:80, so
      // child left offsets are relative to x=80 in the parent.
      const col = (colLeftPx ?? 80) - 80;   // offset from root's left edge
      cap.style.left   = `${col}px`;
      badge.style.left = `${col + CAP + GAP}px`;

      if (badge.textContent !== label) badge.textContent = label;

      if (root.style.visibility !== 'visible') root.style.visibility = 'visible';
    },

    hide() {
      const root = rootRef.current;
      if (root) root.style.visibility = 'hidden';
    },
  }));

  return (
    /*
     * Root = the horizontal line.
     * height: 2px  — visible even without children
     * left: 80     — clears the 80px time-labels sidebar (w-20)
     * overflow: visible — cap/badge extend beyond 2px height without being clipped
     * visibility: hidden  — toggled imperatively; no transition lag
     */
    <div
      ref={rootRef}
      style={{
        position  : 'absolute',
        top       : 0,           // translateY moves this
        left      : 80,          // starts after time-labels sidebar
        right     : 0,
        height    : '2px',
        background: 'var(--hover-line-bg, rgba(109,89,224,0.60))',
        visibility: 'hidden',
        overflow  : 'visible',
        zIndex    : 50,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      {/* Cap circle — vertically centred on the 2px line */}
      <div
        ref={capRef}
        style={{
          position    : 'absolute',
          top         : `${-(CAP / 2) + 1}px`,  // centre on 2px line
          left        : 0,                        // overwritten by update()
          width       : CAP,
          height      : CAP,
          borderRadius: '50%',
          background  : 'var(--hover-badge-text, #6D59E0)',
          opacity     : 1,
        }}
      />

      {/* Time badge */}
      <span
        ref={badgeRef}
        style={{
          position     : 'absolute',
          top          : `-${Math.round((18 - 2) / 2)}px`,  // centre 18px badge on 2px line
          left         : CAP + GAP,                          // overwritten by update()
          lineHeight   : '18px',
          padding      : '0 7px',
          borderRadius : 99,
          fontSize     : 10,
          fontWeight   : 600,
          fontFamily   : 'var(--font-body, Inter, sans-serif)',
          whiteSpace   : 'nowrap',
          letterSpacing: '0.01em',
          color        : 'var(--hover-badge-text, #6D59E0)',
          background   : 'var(--hover-badge-bg, rgba(255,255,255,0.97))',
          border       : '1px solid var(--hover-badge-border, rgba(109,89,224,0.28))',
          boxShadow    : '0 1px 4px rgba(0,0,0,0.10)',
          opacity      : 1,
        }}
      />
    </div>
  );
});

HoverTimeIndicator.displayName = 'HoverTimeIndicator';
export default HoverTimeIndicator;
