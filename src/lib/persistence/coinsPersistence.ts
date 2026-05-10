/**
 * coinsPersistence.ts (standalone stub)
 */
import type { CoinsData } from '@/types/coins';
import { DEFAULT_CONSUMABLES } from '@/types/coins';

export async function fetchCoinsData(): Promise<CoinsData> {
  return {
    balance: 0,
    transactions: [],
    consumables: { ...DEFAULT_CONSUMABLES },
    ownedItems: [],
    activeCosmetics: {},
  };
}

export async function purchaseItem(
  _itemId: string,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  return { success: false, error: 'standalone-mode' };
}

export async function activateCosmetic(_patch: Record<string, unknown>): Promise<boolean> {
  return false;
}
