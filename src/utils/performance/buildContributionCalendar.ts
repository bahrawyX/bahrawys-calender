import {
  eachDayOfInterval,
  endOfWeek,
  endOfYear,
  format,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import {
  ContributionDay,
  ContributionWeek,
  ContributionWeights,
  ContributionYear,
  DailyContributionInputs,
  DEFAULT_CONTRIBUTION_WEIGHTS,
} from '../../types/performance';
import { computeContributionScoreForDay } from './computeContributionScoreForDay';
import { getContributionLevel } from './getContributionLevel';
import { getMonthLabels } from './getMonthLabels';

const EMPTY_COUNTS: DailyContributionInputs = {
  completedTasks: 0,
  focusSessions: 0,
  focusMinutes: 0,
  completedEvents: 0,
  completedPlannerItems: 0,
  scheduledEvents: 0,
};

export function buildContributionCalendar(
  year: number,
  dayInputMap: Map<string, DailyContributionInputs>,
  weights: ContributionWeights = DEFAULT_CONTRIBUTION_WEIGHTS,
): ContributionYear {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const gridStart = startOfWeek(yearStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(yearEnd, { weekStartsOn: 0 });

  const allGridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const days: ContributionDay[] = [];
  const weeks: ContributionWeek[] = [];

  let totalScore = 0;
  let runningStreak = 0;
  let bestStreak = 0;
  const monthScoreMap = new Map<number, number>();

  for (let i = 0; i < allGridDays.length; i += 7) {
    const weekSlice = allGridDays.slice(i, i + 7);
    const weekDays: Array<ContributionDay | null> = weekSlice.map((date) => {
      const inYear = date.getFullYear() === year;
      if (!inYear) return null;

      const dateKey = format(date, 'yyyy-MM-dd');
      const input = dayInputMap.get(dateKey) ?? EMPTY_COUNTS;
      const score = computeContributionScoreForDay(input, weights);
      const level = getContributionLevel(score);

      const day: ContributionDay = {
        date: dateKey,
        score,
        level,
        completedTasks: input.completedTasks,
        focusSessions: input.focusSessions,
        focusMinutes: input.focusMinutes ?? 0,
        completedEvents: input.completedEvents,
        completedPlannerItems: input.completedPlannerItems,
        scheduledEvents: input.scheduledEvents ?? 0,
      };

      days.push(day);
      totalScore += score;

      if (score > 0) {
        runningStreak += 1;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }

      const month = date.getMonth();
      monthScoreMap.set(month, (monthScoreMap.get(month) ?? 0) + score);

      return day;
    });

    weeks.push({
      index: weeks.length,
      days: weekDays,
    });
  }

  let mostActiveMonth: string | null = null;
  let maxMonthScore = 0;
  monthScoreMap.forEach((score, month) => {
    if (score <= maxMonthScore) return;
    maxMonthScore = score;
    mostActiveMonth = format(new Date(year, month, 1), 'LLLL');
  });

  return {
    year,
    totalScore,
    days,
    weeks,
    monthLabels: getMonthLabels(weeks),
    bestStreak,
    mostActiveMonth,
  };
}
