'use client';

import React, { useEffect } from 'react';
import { useCoinsStore, selectActiveCosmetics } from '@/store/useCoinsStore';
import { ACCENT_COLORS } from '@/config/shopItems';

/**
 * CosmeticsProvider — injects a <style> tag to override --primary when
 * the user has an active accent color cosmetic equipped.
 *
 * Wrap the app layout with this component.
 */
export function CosmeticsProvider({ children }: { children: React.ReactNode }) {
  const activeCosmetics = useCoinsStore(selectActiveCosmetics);

  useEffect(() => {
    if (!activeCosmetics) return;
    const color = activeCosmetics.accentColor;
    const hsl = color ? ACCENT_COLORS[color] : null;

    if (hsl) {
      document.documentElement.style.setProperty('--primary', hsl);
    } else {
      // Reset to default (defined in globals.css)
      document.documentElement.style.removeProperty('--primary');
    }

    return () => {
      document.documentElement.style.removeProperty('--primary');
    };
  }, [activeCosmetics?.accentColor]);

  return <>{children}</>;
}
