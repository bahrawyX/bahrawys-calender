import { DEFAULT_TASK_DURATION_MINS, addMinsToTime } from '../dailyPlanUtils';

const BUFFER_MINUTES = 15;

export interface SchedulableTask {
  id: string;
  estimatedMinutes?: number;
  durationMinutes?: number;
}

export interface ScheduledTask extends SchedulableTask {
  startTime: string;
  endTime: string;
}

function normalizeDurationMinutes(task: SchedulableTask): number {
  const raw = task.estimatedMinutes ?? task.durationMinutes ?? DEFAULT_TASK_DURATION_MINS;
  if (!Number.isFinite(raw)) return DEFAULT_TASK_DURATION_MINS;
  return Math.max(5, Math.round(raw));
}

/**
 * Sequentially schedules tasks from a given start time and inserts a 15-minute
 * buffer between each task.
 */
export function autoScheduleTasks<T extends SchedulableTask>(
  tasks: readonly T[],
  dayStartTime: string,
): Array<T & { startTime: string; endTime: string }> {
  let cursor = dayStartTime;

  return tasks.map((task) => {
    const durationMinutes = normalizeDurationMinutes(task);
    const startTime = cursor;
    const endTime = addMinsToTime(startTime, durationMinutes);

    // Advance cursor by task duration plus mandatory 15-minute transition gap.
    cursor = addMinsToTime(endTime, BUFFER_MINUTES);

    return {
      ...task,
      startTime,
      endTime,
    };
  });
}
