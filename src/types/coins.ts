/** Coin transaction record */
export interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  label: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** Consumable power-up keys */
export type ConsumableKey = 'focusBoost' | 'streakShield' | 'taskMultiplier' | 'autoPlan' | 'goalAccelerator';

/** Active cosmetic overrides */
export interface ActiveCosmetics {
  accentColor?: string;
  confetti?: boolean;
}

/** User's full coin economy data */
export interface CoinsData {
  balance: number;
  transactions: CoinTransaction[];
  consumables: Record<ConsumableKey, number>;
  ownedItems: string[];
  activeCosmetics: ActiveCosmetics;
}

/** Default consumables (all zero) */
export const DEFAULT_CONSUMABLES: Record<ConsumableKey, number> = {
  focusBoost: 0,
  streakShield: 0,
  taskMultiplier: 0,
  autoPlan: 0,
  goalAccelerator: 0,
};
