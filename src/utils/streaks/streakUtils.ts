/**
 * Server-side streak calculation utilities.
 * Called from POST /api/focus-sessions after inserting a session.
 */

const SESSION_STREAK_GAP_MS = 4 * 60 * 60 * 1000; // 4 hours

interface UserStreakFields {
  dailyStreak: number;
  bestDailyStreak: number;
  sessionStreak: number;
  bestSessionStreak: number;
  lastFocusDate: string | null; // YYYY-MM-DD
  lastSessionAt: Date | null;
  coins: number;
}

interface StreakUpdate {
  dailyStreak: number;
  bestDailyStreak: number;
  sessionStreak: number;
  bestSessionStreak: number;
  lastFocusDate: string;
  lastSessionAt: Date;
  coins: number;
}

/**
 * Compute updated streak values after a completed focus session.
 *
 * @param user Current user streak fields from DB
 * @param durationMinutes How many minutes the completed session lasted
 * @param timezone IANA timezone string for the user (default UTC)
 */
export function computeStreakUpdate(
  user: UserStreakFields,
  durationMinutes: number,
  timezone = 'UTC',
): StreakUpdate {
  const now = new Date();

  // Resolve today's date in the user's timezone
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // en-CA gives YYYY-MM-DD

  // ─── Daily streak ──────────────────────────────────────────────────────────
  let { dailyStreak } = user;

  if (user.lastFocusDate === todayStr) {
    // Already counted today — no daily streak change
  } else if (user.lastFocusDate === getYesterday(todayStr)) {
    dailyStreak += 1;
  } else {
    dailyStreak = 1;
  }
  const bestDailyStreak = Math.max(user.bestDailyStreak, dailyStreak);

  // ─── Session streak ────────────────────────────────────────────────────────
  let sessionStreak = user.sessionStreak;
  if (
    user.lastSessionAt &&
    now.getTime() - user.lastSessionAt.getTime() < SESSION_STREAK_GAP_MS
  ) {
    sessionStreak += 1;
  } else {
    sessionStreak = 1;
  }
  const bestSessionStreak = Math.max(user.bestSessionStreak, sessionStreak);

  // ─── Coins ─────────────────────────────────────────────────────────────────
  const coinsEarned = Math.max(1, durationMinutes); // 1 coin per minute, minimum 1
  const coins = user.coins + coinsEarned;

  return {
    dailyStreak,
    bestDailyStreak,
    sessionStreak,
    bestSessionStreak,
    lastFocusDate: todayStr,
    lastSessionAt: now,
    coins,
  };
}

/** Returns the YYYY-MM-DD string for the day before the given date string. */
function getYesterday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
