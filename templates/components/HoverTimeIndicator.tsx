'use client';

/**
 * HoverTimeIndicator — pure UI component, no calendar-specific imports.
 *
 * GPU-composited hover line + cap circle + time badge for Day / Week grids.
 * Zero React re-renders on mousemove — all DOM writes are imperative.
 */

import React, { useImperativeHandle, forwardRef, useRef } from 'react';

export interface HoverIndicatorHandle {
  update(y: number, label: string, colLeftPx?: number): void;
  hide(): void;
}

const CAP = 8;
const GAP = 5;

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

      root.style.transform = `translateY(${y}px)`;

      const col = (colLeftPx ?? 80) - 80;
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
    <div
      ref={rootRef}
      style={{
        position  : 'absolute',
        top       : 0,
        left      : 80,
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
      <div
        ref={capRef}
        style={{
          position    : 'absolute',
          top         : `${-(CAP / 2) + 1}px`,
          left        : 0,
          width       : CAP,
          height      : CAP,
          borderRadius: '50%',
          background  : 'var(--hover-badge-text, #6D59E0)',
          opacity     : 1,
        }}
      />

      <span
        ref={badgeRef}
        style={{
          position     : 'absolute',
          top          : `-${Math.round((18 - 2) / 2)}px`,
          left         : CAP + GAP,
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
