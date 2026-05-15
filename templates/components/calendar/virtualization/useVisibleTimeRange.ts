'use client';

/**
 * useVisibleTimeRange — adapted for bahrawy-calendar package.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HOUR_HEIGHT } from 'bahrawy-calendar/compat';

const PX_PER_MIN = HOUR_HEIGHT / 60;
const DEFAULT_BUFFER_MINS = 120;

export interface VisibleTimeRange {
  visibleStartMin: number;
  visibleEndMin: number;
  renderStartMin: number;
  renderEndMin: number;
  scrollTop: number;
}

export function useVisibleTimeRange(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  bufferMinutes = DEFAULT_BUFFER_MINS,
): VisibleTimeRange {
  const [range, setRange] = useState<VisibleTimeRange>(() =>
    computeRange(0, 600, bufferMinutes),
  );

  const rafRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      setRange(computeRange(el.scrollTop, el.clientHeight, bufferMinutes));
    });
  }, [scrollContainerRef, bufferMinutes]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setRange(computeRange(el.scrollTop, el.clientHeight, bufferMinutes));

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollContainerRef, handleScroll, bufferMinutes]);

  return range;
}

function computeRange(
  scrollTop: number,
  viewportHeight: number,
  buffer: number,
): VisibleTimeRange {
  const visibleStartMin = scrollTop / PX_PER_MIN;
  const visibleEndMin = visibleStartMin + viewportHeight / PX_PER_MIN;

  return {
    visibleStartMin,
    visibleEndMin,
    renderStartMin: Math.max(0, visibleStartMin - buffer),
    renderEndMin: Math.min(1440, visibleEndMin + buffer),
    scrollTop,
  };
}
