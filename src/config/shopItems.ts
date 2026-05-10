import type { ConsumableKey } from '@/types/coins';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'powerup' | 'cosmetic' | 'unlock';
  cost: number;
  emoji: string;
  consumable: boolean;
  consumableKey?: ConsumableKey;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Power-Ups (consumable) ──────────────────────────────────────────────
  {
    id: 'focus_boost',
    name: 'Focus Boost',
    description: 'Next focus session earns 2x coins',
    category: 'powerup',
    cost: 50,
    emoji: '⚡',
    consumable: true,
    consumableKey: 'focusBoost',
  },
  {
    id: 'task_multiplier',
    name: 'Task Multiplier',
    description: 'Next 5 task completions earn 2x coins',
    category: 'powerup',
    cost: 75,
    emoji: '✨',
    consumable: true,
    consumableKey: 'taskMultiplier',
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'Protects daily streak once if you miss a day',
    category: 'powerup',
    cost: 100,
    emoji: '🛡️',
    consumable: true,
    consumableKey: 'streakShield',
  },
  {
    id: 'goal_accelerator',
    name: 'Goal Accelerator',
    description: 'Instantly adds +10% to a goal target',
    category: 'powerup',
    cost: 80,
    emoji: '🚀',
    consumable: true,
    consumableKey: 'goalAccelerator',
  },
  {
    id: 'auto_plan',
    name: 'Auto-Plan Day',
    description: 'AI schedules your day without quota limit',
    category: 'powerup',
    cost: 60,
    emoji: '🤖',
    consumable: true,
    consumableKey: 'autoPlan',
  },

  // ── Cosmetics (permanent) ───────────────────────────────────────────────
  {
    id: 'accent_purple',
    name: 'Purple Theme',
    description: 'Changes app accent to purple',
    category: 'cosmetic',
    cost: 200,
    emoji: '💜',
    consumable: false,
  },
  {
    id: 'accent_rose',
    name: 'Rose Theme',
    description: 'Changes app accent to rose',
    category: 'cosmetic',
    cost: 200,
    emoji: '🌹',
    consumable: false,
  },
  {
    id: 'accent_cyan',
    name: 'Cyan Theme',
    description: 'Changes app accent to cyan',
    category: 'cosmetic',
    cost: 200,
    emoji: '💎',
    consumable: false,
  },
  {
    id: 'accent_amber',
    name: 'Amber Theme',
    description: 'Changes app accent to amber',
    category: 'cosmetic',
    cost: 200,
    emoji: '🔶',
    consumable: false,
  },
  {
    id: 'confetti_unlock',
    name: 'Confetti Celebrations',
    description: 'Confetti burst on task complete',
    category: 'cosmetic',
    cost: 150,
    emoji: '🎉',
    consumable: false,
  },
  {
    id: 'badge_deep_worker',
    name: 'Deep Worker Badge',
    description: 'Profile badge for focus champions',
    category: 'cosmetic',
    cost: 100,
    emoji: '🧑‍💻',
    consumable: false,
  },
  {
    id: 'badge_streak_master',
    name: 'Streak Master Badge',
    description: 'Profile badge for streak legends',
    category: 'cosmetic',
    cost: 100,
    emoji: '🔥',
    consumable: false,
  },
  {
    id: 'badge_goal_crusher',
    name: 'Goal Crusher Badge',
    description: 'Profile badge for goal achievers',
    category: 'cosmetic',
    cost: 100,
    emoji: '🏆',
    consumable: false,
  },

  // ── Feature Unlocks (permanent) ─────────────────────────────────────────
  {
    id: 'extended_history',
    name: 'Extended Focus History',
    description: '30 days to 90 days focus history',
    category: 'unlock',
    cost: 300,
    emoji: '📊',
    consumable: false,
  },
  {
    id: 'custom_categories',
    name: 'Custom Task Categories',
    description: 'Create custom category colors and labels',
    category: 'unlock',
    cost: 350,
    emoji: '🏷️',
    consumable: false,
  },
  {
    id: 'extra_templates',
    name: 'Extra Doc Templates',
    description: '6 additional document templates',
    category: 'unlock',
    cost: 400,
    emoji: '📋',
    consumable: false,
  },
];

export const SHOP_ITEM_MAP = new Map(SHOP_ITEMS.map(item => [item.id, item]));

/** Accent color HSL values for cosmetic themes */
export const ACCENT_COLORS: Record<string, string> = {
  purple: '262 83% 58%',
  rose: '346 77% 49%',
  cyan: '189 94% 43%',
  amber: '38 92% 50%',
};
