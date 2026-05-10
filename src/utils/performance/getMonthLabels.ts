import { format } from 'date-fns';
import { ContributionMonthLabel, ContributionWeek } from '../../types/performance';

export function getMonthLabels(weeks: ContributionWeek[]): ContributionMonthLabel[] {
  const labels: ContributionMonthLabel[] = [];
  const seenMonths = new Set<number>();

  weeks.forEach((week, weekIndex) => {
    const firstInYearDay = week.days.find((day) => day != null);
    if (!firstInYearDay) return;
    const month = new Date(`${firstInYearDay.date}T00:00:00`).getMonth();

    if (seenMonths.has(month)) return;
    seenMonths.add(month);

    labels.push({
      label: format(new Date(2000, month, 1), 'MMM'),
      weekIndex,
    });
  });

  return labels;
}
