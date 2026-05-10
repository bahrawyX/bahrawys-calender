import type { MoodLog, MoodValue } from '@/types';

export async function logMood(_data: {
  focusSessionId?: string;
  mood: MoodValue;
  note?: string;
}): Promise<{ id: string } | null> {
  return null;
}

export async function fetchMoodLogs(_limit = 30): Promise<MoodLog[]> {
  return [];
}
