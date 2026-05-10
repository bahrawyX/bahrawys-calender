import { create } from 'zustand';
import type { CoinTransaction, ConsumableKey, ActiveCosmetics } from '@/types/coins';
import { DEFAULT_CONSUMABLES } from '@/types/coins';
import * as coinsPersistence from '@/lib/persistence/coinsPersistence';
import { SHOP_ITEM_MAP } from '@/config/shopItems';

interface CoinsState {
  balance: number;
  transactions: CoinTransaction[];
  consumables: Record<ConsumableKey, number>;
  ownedItems: string[];
  activeCosmetics: ActiveCosmetics;
  dbHydrated: boolean;
  isLoading: boolean;

  // Hydration
  hydrateFromDb: (data: {
    balance: number;
    transactions: CoinTransaction[];
    consumables: Record<ConsumableKey, number>;
    ownedItems: string[];
    activeCosmetics: ActiveCosmetics;
  }) => void;
  hydrateFromDbFailed: () => void;

  // Actions
  purchaseItem: (itemId: string) => Promise<boolean>;
  activateCosmetic: (patch: Partial<ActiveCosmetics>) => Promise<boolean>;
  /**
   * Re-pull the canonical coin balance + transactions from GET /api/coins.
   * Called after a focus session finishes so the UI reflects the DB-side
   * total (streakUpdate.coins + any async awardCoinsBatch bonuses) instead
   * of a best-guess delta. useCoinsStore is the single source of truth —
   * useStreakStore no longer tracks `coins`.
   */
  refetchBalance: () => Promise<void>;
  /**
   * Mark the current balance as potentially stale and schedule a debounced
   * refetch (300ms). Call this after any client action that the server may
   * answer with a coin award — task complete, planner add, doc create, AI
   * use, goal create/complete, brief read, etc. The debounce coalesces
   * bursts (e.g. multi-task drag-completion) into a single GET /api/coins.
   */
  invalidateBalance: () => void;
  /**
   * Push a server-supplied balance into the store directly. Use when an
   * API response carries `newBalance` so the badge updates synchronously
   * with the toast — no race against an in-flight DB transaction.
   *
   * Ignores values that are negative or non-finite to defend against
   * corrupted server responses.
   */
  setBalance: (newBalance: number) => void;

  // Selectors
  ownsItem: (itemId: string) => boolean;
  getConsumable: (key: ConsumableKey) => number;
}

export const useCoinsStore = create<CoinsState>((set, get) => ({
  balance: 0,
  transactions: [],
  consumables: DEFAULT_CONSUMABLES,
  ownedItems: [],
  activeCosmetics: {},
  dbHydrated: false,
  isLoading: false,

  hydrateFromDb: (data) => {
    if (get().dbHydrated) return;
    set({
      dbHydrated: true,
      balance: data.balance,
      transactions: data.transactions,
      consumables: data.consumables,
      ownedItems: data.ownedItems,
      activeCosmetics: data.activeCosmetics,
    });
  },

  hydrateFromDbFailed: () => {
    if (get().dbHydrated) return;
    set({ dbHydrated: true });
  },

  purchaseItem: async (itemId) => {
    const item = SHOP_ITEM_MAP.get(itemId);
    if (!item) return false;
    if (get().balance < item.cost) return false;

    // Optimistic deduct
    set(s => ({ balance: s.balance - item.cost, isLoading: true }));

    const result = await coinsPersistence.purchaseItem(itemId);
    if (result.success) {
      set(s => {
        const next: Partial<CoinsState> = {
          balance: result.newBalance ?? s.balance,
          isLoading: false,
        };
        if (item.consumable && item.consumableKey) {
          next.consumables = {
            ...s.consumables,
            [item.consumableKey]: (s.consumables[item.consumableKey] ?? 0) + 1,
          };
        } else {
          next.ownedItems = [...s.ownedItems, itemId];
        }
        return next;
      });
      return true;
    } else {
      // Rollback
      set(s => ({ balance: s.balance + item.cost, isLoading: false }));
      return false;
    }
  },

  activateCosmetic: async (patch) => {
    const prev = get().activeCosmetics;
    // Optimistic update
    set(s => ({ activeCosmetics: { ...s.activeCosmetics, ...patch } }));

    const success = await coinsPersistence.activateCosmetic(patch);
    if (!success) {
      // Rollback
      set({ activeCosmetics: prev });
    }
    return success;
  },

  refetchBalance: async () => {
    try {
      const data = await coinsPersistence.fetchCoinsData();
      set({
        balance: data.balance,
        transactions: data.transactions,
        consumables: data.consumables,
        ownedItems: data.ownedItems,
        activeCosmetics: data.activeCosmetics,
      });
    } catch {
      // Swallow — keep prior state if the refetch fails. The next bootstrap
      // cycle or invalidateBalance() call will retry.
    }
  },

  invalidateBalance: () => {
    scheduleInvalidate(() => {
      void useCoinsStore.getState().refetchBalance();
    });
  },

  setBalance: (newBalance) => {
    if (typeof newBalance !== 'number' || !Number.isFinite(newBalance) || newBalance < 0) return;
    set({ balance: Math.floor(newBalance) });
  },

  ownsItem: (itemId) => get().ownedItems.includes(itemId),
  getConsumable: (key) => get().consumables[key] ?? 0,
}));

// ── Module-level debounce so simultaneous invalidateBalance() calls collapse
//    into a single GET /api/coins. Lives outside the store because it is
//    pure scheduling state with no UI consumers.
let pendingInvalidateTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleInvalidate(run: () => void): void {
  if (pendingInvalidateTimer) clearTimeout(pendingInvalidateTimer);
  pendingInvalidateTimer = setTimeout(() => {
    pendingInvalidateTimer = null;
    run();
  }, 300);
}

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectCoinBalance = (state: CoinsState) => state.balance;
export const selectActiveCosmetics = (state: CoinsState) => state.activeCosmetics;
export const selectOwnedItems = (state: CoinsState) => state.ownedItems;
export const selectConsumables = (state: CoinsState) => state.consumables;
