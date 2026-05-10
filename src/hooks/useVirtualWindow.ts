'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface UseVirtualWindowOptions {
  count: number;
  itemSize: number;
  overscan?: number;
  containerRef: React.RefObject<HTMLElement | null>;
}

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
}

interface ScrollState {
  scrollTop: number;
  viewportHeight: number;
}

/**
 * Lightweight fixed-size virtual window for long scroll lists.
 * Keeps DOM size bounded while preserving normal scroll behavior.
 */
export function useVirtualWindow({
  count,
  itemSize,
  overscan = 6,
  containerRef,
}: UseVirtualWindowOptions): VirtualWindow {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollTop: 0,
    viewportHeight: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;

    const update = () => {
      setScrollState({
        scrollTop: el.scrollTop,
        viewportHeight: el.clientHeight,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    el.addEventListener('scroll', onScroll, { passive: true });

    const resize = new ResizeObserver(() => update());
    resize.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      resize.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);

  return useMemo(() => {
    if (count <= 0 || itemSize <= 0) {
      return { startIndex: 0, endIndex: 0, paddingTop: 0, paddingBottom: 0 };
    }

    const { scrollTop, viewportHeight } = scrollState;
    const firstVisible = Math.floor(scrollTop / itemSize);
    const visibleCount = Math.ceil(Math.max(viewportHeight, itemSize) / itemSize);

    const startIndex = Math.max(0, firstVisible - overscan);
    const endIndex = Math.min(count, firstVisible + visibleCount + overscan);

    return {
      startIndex,
      endIndex,
      paddingTop: startIndex * itemSize,
      paddingBottom: Math.max(0, (count - endIndex) * itemSize),
    };
  }, [count, itemSize, overscan, scrollState]);
}
