'use client';

import { useState, useEffect } from 'react';

/**
 * Returns `true` when the app is running as an installed PWA (standalone mode).
 * Works on iOS Safari (navigator.standalone) and other browsers (display-mode media query).
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsPWA(standalone);

    // Listen for display-mode changes (e.g. user installs while session is active)
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isPWA;
}
