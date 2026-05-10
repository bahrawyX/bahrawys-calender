'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { VirtualizationStats } from './useVirtualizedEvents';

declare global {
  interface Window {
    __LUMINA_PERF_DEBUG__?: boolean;
    __LUMINA_PERF_STATS__?: PerfStats;
  }
}

interface PerfStats {
  renderedEvents: number;
  skippedEvents: number;
  totalEvents: number;
  fps: number;
  domNodes: number;
  compactMode: boolean;
  compressedHours: number;
}

/**
 * Development-only performance overlay.
 *
 * Enable: `window.__LUMINA_PERF_DEBUG__ = true` in console.
 * Displays rendered/skipped events, FPS, and DOM node count.
 */
export function usePerfDebug(
  stats: VirtualizationStats,
  isCompact: boolean,
  compressedHourCount: number,
) {
  const fpsFrames = useRef<number[]>([]);
  const fpsRef = useRef(60);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    if (!window.__LUMINA_PERF_DEBUG__) {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
      return;
    }

    const now = performance.now();
    fpsFrames.current.push(now);
    // Keep last second of frames
    while (fpsFrames.current.length > 0 && fpsFrames.current[0] < now - 1000) {
      fpsFrames.current.shift();
    }
    fpsRef.current = fpsFrames.current.length;

    if (!overlayRef.current) {
      overlayRef.current = document.createElement('div');
      Object.assign(overlayRef.current.style, {
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        zIndex: '99999',
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        lineHeight: '1.5',
        pointerEvents: 'none',
        whiteSpace: 'pre',
      });
      document.body.appendChild(overlayRef.current);
    }

    const domNodes = document.querySelectorAll('[data-hover-card]').length;

    overlayRef.current.textContent = [
      `LUMINA PERF DEBUG`,
      `rendered: ${stats.rendered}`,
      `skipped:  ${stats.skipped}`,
      `total:    ${stats.total}`,
      `fps:      ${fpsRef.current}`,
      `DOM evt:  ${domNodes}`,
      `compact:  ${isCompact ? 'ON' : 'off'}`,
      `compress: ${compressedHourCount} hours`,
    ].join('\n');

    rafRef.current = requestAnimationFrame(tick);
  }, [stats, isCompact, compressedHourCount]);

  useEffect(() => {
    if (window.__LUMINA_PERF_DEBUG__) {
      rafRef.current = requestAnimationFrame(tick);
    }

    const check = setInterval(() => {
      if (window.__LUMINA_PERF_DEBUG__ && !rafRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }, 2000);

    return () => {
      clearInterval(check);
      cancelAnimationFrame(rafRef.current);
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };
  }, [tick]);
}
