'use client';

import { useEffect, useState } from 'react';

/**
 * True when the viewport sits in the "laptop" band (1024 ≤ w < 1400),
 * which is the same band that auto-collapses the sidebar to 72px.
 * Screens at 1400px+ are treated as wide desktops with the full sidebar
 * — those get the original spacious event cards instead of the compact
 * single-line variant.
 */
export function useIsLaptopWidth(): boolean {
  const [isLaptop, setIsLaptop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (max-width: 1399px)');
    const update = () => setIsLaptop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isLaptop;
}
