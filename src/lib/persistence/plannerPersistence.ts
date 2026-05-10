/**
 * plannerPersistence.ts (standalone stub)
 */
import type { PlannedTaskItem } from '@/store/useDailyPlanStore';

export async function fetchAllForCurrentUser(): Promise<PlannedTaskItem[]> {
  return [];
}

export async function createOne(_item: PlannedTaskItem): Promise<string> {
  return _item.id;
}

export async function updateOne(_id: string, _patch: Partial<PlannedTaskItem>, _prev?: PlannedTaskItem): Promise<void> {}

export async function deleteOne(_id: string): Promise<void> {}

export async function createMany(items: PlannedTaskItem[]): Promise<Map<string, string>> {
  // In standalone mode every item keeps its client-generated ID.
  return new Map(items.map((i) => [i.id, i.id]));
}

export async function migrateMany(_items: PlannedTaskItem[]): Promise<void> {}
