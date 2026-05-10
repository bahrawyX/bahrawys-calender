import { WeekdayLabel } from '../../types/performance';

export function getWeekdayLabels(): WeekdayLabel[] {
  return [
    { label: 'Mon', rowIndex: 1 },
    { label: 'Wed', rowIndex: 3 },
    { label: 'Fri', rowIndex: 5 },
  ];
}
