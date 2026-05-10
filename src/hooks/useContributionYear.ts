'use client';

import { useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useCalendarEventsStore } from '../store/useCalendarEventsStore';
import { useTaskBoardStore } from '../store/useTaskBoardStore';
import { useFocusStore } from '../store/useFocusStore';
import { useDailyPlanStore } from '../store/useDailyPlanStore';
import { useContributionSettingsStore, selectEffectiveWeights } from '../store/useContributionSettingsStore';
import { buildContributionCalendar } from '../utils/performance/buildContributionCalendar';
import { DailyContributionInputs } from '../types/performance';

interface ContributionYearResult {
  contributionYear: ReturnType<typeof buildContributionCalendar>;
  availableYears: number[];
}

function toDateKey(input: string): string | null {
  try {
    const parsed = parseISO(input);
    if (!isValid(parsed)) return null;
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return null;
  }
}

function ensureBucket(
  map: Map<string, DailyContributionInputs>,
  dateKey: string,
): DailyContributionInputs {
  const existing = map.get(dateKey);
  if (existing) return existing;
  const fresh: DailyContributionInputs = {
    completedTasks: 0,
    focusSessions: 0,
    focusMinutes: 0,
    completedEvents: 0,
    completedPlannerItems: 0,
    scheduledEvents: 0,
  };
  map.set(dateKey, fresh);
  return fresh;
}

export function useContributionYear(selectedYear: number): ContributionYearResult {
  const tasks = useTaskBoardStore((state) => state.tasks);
  const events = useCalendarEventsStore((state) => state.events);
  const focusHistory = useFocusStore((state) => state.sessionHistory);
  const plansByDate = useDailyPlanStore((state) => state.plansByDate);
  const enabled = useContributionSettingsStore((s) => s.enabled);
  const weights = useMemo(
    () => selectEffectiveWeights({ enabled }),
    [enabled],
  );

  const { dayInputMap, availableYears } = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const years = new Set<number>([nowYear]);
    const map = new Map<string, DailyContributionInputs>();

    const doneTaskIds = new Set<string>();
    tasks.forEach((task) => {
      if (task.status !== 'done') return;
      doneTaskIds.add(task.id);

      const dateKey = toDateKey(task.updatedAt);
      if (!dateKey) return;
      years.add(Number(dateKey.slice(0, 4)));
      ensureBucket(map, dateKey).completedTasks += 1;
    });

    events.forEach((event) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return;
      const yearNum = Number(event.date.slice(0, 4));
      years.add(yearNum);
      const bucket = ensureBucket(map, event.date);
      bucket.scheduledEvents += 1;
      if (event.completed) bucket.completedEvents += 1;
    });

    focusHistory.forEach((session) => {
      if (!session.completed) return;
      const dateKey = toDateKey(session.startTime);
      if (!dateKey) return;
      years.add(Number(dateKey.slice(0, 4)));
      const bucket = ensureBucket(map, dateKey);
      bucket.focusSessions += 1;
      bucket.focusMinutes += Math.max(0, Math.round(session.duration / 60));
    });

    Object.entries(plansByDate).forEach(([planDate, items]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(planDate)) return;
      const completedPlannerItems = items.filter((item) => doneTaskIds.has(item.taskId)).length;
      if (completedPlannerItems === 0) return;
      years.add(Number(planDate.slice(0, 4)));
      ensureBucket(map, planDate).completedPlannerItems += completedPlannerItems;
    });

    return {
      dayInputMap: map,
      availableYears: Array.from(years).sort((a, b) => b - a),
    };
  }, [tasks, events, focusHistory, plansByDate]);

  const contributionYear = useMemo(
    () => buildContributionCalendar(selectedYear, dayInputMap, weights),
    [selectedYear, dayInputMap, weights]
  );

  return { contributionYear, availableYears };
}
