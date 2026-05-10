/**
 * tasksPersistence.ts (standalone stub)
 * Tasks aren't part of the calendar surface but useTaskBoardStore is
 * imported transitively. Return empty data so the store hydrates cleanly.
 */
import type { Task } from '@/types/task';

export async function fetchAllForCurrentUser(): Promise<Task[]> {
  return [];
}

export async function createOne(_task: Task): Promise<string | null> {
  return null;
}

export async function updateOne(_id: string, _patch: Partial<Task>): Promise<void> {}

export async function deleteOne(_id: string): Promise<void> {}

export async function migrateMany(_tasks: Task[]): Promise<void> {}
