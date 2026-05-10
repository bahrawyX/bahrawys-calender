export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  score: number;
  level: ContributionLevel;
  completedTasks: number;
  focusSessions: number;
  focusMinutes: number;
  completedEvents: number;
  completedPlannerItems: number;
  scheduledEvents: number;
}

export interface ContributionWeek {
  index: number;
  days: Array<ContributionDay | null>; // Sunday -> Saturday rows
}

export interface ContributionMonthLabel {
  label: string;
  weekIndex: number;
}

export interface ContributionYear {
  year: number;
  totalScore: number;
  days: ContributionDay[];
  weeks: ContributionWeek[];
  monthLabels: ContributionMonthLabel[];
  bestStreak: number;
  mostActiveMonth: string | null;
}

export interface DailyContributionInputs {
  completedTasks: number;
  focusSessions: number;
  /** Total minutes of focus on this day, for tooltip duration display */
  focusMinutes: number;
  completedEvents: number;
  completedPlannerItems: number;
  /** All calendar events on this day (scheduled meetings count as activity) */
  scheduledEvents: number;
}

export interface ContributionWeights {
  completedTasks: number;
  focusSessions: number;
  scheduledEvents: number;
  completedEvents: number;
  completedPlannerItems: number;
}

export const DEFAULT_CONTRIBUTION_WEIGHTS: ContributionWeights = {
  completedTasks: 1,
  focusSessions: 2,
  scheduledEvents: 1,
  completedEvents: 1,
  completedPlannerItems: 1,
};

export interface WeekdayLabel {
  label: string;
  rowIndex: number;
}
