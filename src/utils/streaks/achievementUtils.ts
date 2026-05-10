/**
 * Achievement checking and granting utilities.
 * Called server-side after streak + coin updates.
 */

interface UserAchievementFields {
  sessionStreak: number;
  dailyStreak: number;
  coins: number;
}

export interface AchievementRule {
  type: string;
  label: string;
  /** Icon key used in the UI to render an animated icon (e.g. 'medal', 'trophy', 'fire', 'star', 'coin'). */
  icon: string;
  message: string;
  check: (current: UserAchievementFields, previousCoins: number) => boolean;
}

export const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    type: 'session_milestone_5',
    label: '5-session streak',
    icon: 'medal',
    message: '5-session streak! Keep it up.',
    check: (s) => s.sessionStreak >= 5 && s.sessionStreak % 5 === 0,
  },
  {
    type: 'session_milestone_10',
    label: '10-session streak',
    icon: 'trophy',
    message: '10 sessions in a row! You\'re on fire.',
    check: (s) => s.sessionStreak >= 10 && s.sessionStreak % 10 === 0,
  },
  {
    type: 'daily_streak_7',
    label: '7-day streak',
    icon: 'fire',
    message: '7-day streak! You\'re building real consistency.',
    check: (s) => s.dailyStreak === 7,
  },
  {
    type: 'daily_streak_30',
    label: '30-day streak',
    icon: 'star',
    message: '30-day streak! Incredible discipline.',
    check: (s) => s.dailyStreak === 30,
  },
  {
    type: 'coins_100',
    label: '100 coins earned',
    icon: 'coin',
    message: 'You\'ve earned 100 coins!',
    check: (s, prevCoins) => s.coins >= 100 && prevCoins < 100,
  },
  {
    type: 'coins_500',
    label: '500 coins earned',
    icon: 'coin',
    message: 'You\'ve earned 500 coins! Focus master.',
    check: (s, prevCoins) => s.coins >= 500 && prevCoins < 500,
  },
];

/**
 * Check which achievements should be granted given the updated user state.
 * Returns only NEW achievements (not already in existingTypes).
 */
export function checkNewAchievements(
  current: UserAchievementFields,
  previousCoins: number,
  existingTypes: Set<string>,
): string[] {
  const newTypes: string[] = [];
  for (const rule of ACHIEVEMENT_RULES) {
    if (existingTypes.has(rule.type)) continue;
    if (rule.check(current, previousCoins)) {
      newTypes.push(rule.type);
    }
  }
  return newTypes;
}

/** Get achievement display info by type. */
export function getAchievementInfo(type: string): AchievementRule | undefined {
  return ACHIEVEMENT_RULES.find((r) => r.type === type);
}
