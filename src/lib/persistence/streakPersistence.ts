/**
 * streakPersistence.ts (standalone stub)
 */
export interface StreakData {
  coins: number;
  dailyStreak: number;
  bestDailyStreak: number;
  sessionStreak: number;
  bestSessionStreak: number;
}

export async function fetchStreakData(): Promise<StreakData | null> {
  return null;
}

export async function requestStreakRecovery(): Promise<{ ok: boolean; reason?: string }> {
  return { ok: false, reason: 'standalone-mode' };
}
