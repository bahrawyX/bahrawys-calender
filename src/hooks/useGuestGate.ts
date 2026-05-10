'use client';

import { useState, useCallback } from 'react';
import { useGuestStore } from '@/store/useGuestStore';

interface UseGuestGateReturn {
  /** True when the current user is in guest mode. */
  isGuest: boolean;
  /**
   * Call before executing an account-gated action.
   * Returns `true` (and opens the upgrade modal) if the user is a guest,
   * returns `false` if the user has an account and the action should proceed.
   *
   * @param feature – Optional display name of the blocked feature shown in the modal.
   */
  gate: (feature?: string) => boolean;
  /** Whether the upgrade modal is currently open. */
  upgradeModalOpen: boolean;
  /** Name of the feature passed to the most recent `gate()` call. */
  gatedFeatureName: string | undefined;
  /** Close the upgrade modal without navigating. */
  closeUpgradeModal: () => void;
}

/**
 * Hook for guarding account-only features.
 *
 * Usage:
 * ```tsx
 * const { isGuest, gate, upgradeModalOpen, gatedFeatureName, closeUpgradeModal } = useGuestGate();
 *
 * const handleSync = () => {
 *   if (gate('Calendar sync')) return; // stops here for guests
 *   // ... proceed with sync
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleSync}>Sync</button>
 *     <GuestUpgradeModal
 *       open={upgradeModalOpen}
 *       featureName={gatedFeatureName}
 *       onClose={closeUpgradeModal}
 *     />
 *   </>
 * );
 * ```
 */
export function useGuestGate(): UseGuestGateReturn {
  const isGuest = useGuestStore((s) => s.isGuest);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [gatedFeatureName, setGatedFeatureName] = useState<string | undefined>();

  const gate = useCallback(
    (feature?: string): boolean => {
      if (!isGuest) return false;
      setGatedFeatureName(feature);
      setUpgradeModalOpen(true);
      return true;
    },
    [isGuest],
  );

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
  }, []);

  return { isGuest, gate, upgradeModalOpen, gatedFeatureName, closeUpgradeModal };
}
