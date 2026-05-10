/**
 * goalsPersistence.ts (standalone stub)
 */
import type { Goal, GoalTarget } from '@/types/goal';

export async function fetchAllForCurrentUser(): Promise<Goal[]> {
  return [];
}

export async function createOne(_input: Partial<Goal>): Promise<{ goalId?: string; targetIds?: string[] } | null> {
  return null;
}

export async function updateOne(_id: string, _patch: Partial<Goal>): Promise<boolean> {
  return true;
}

export async function deleteOne(_id: string, _hard = false): Promise<void> {}

export async function addTarget(
  _goalId: string,
  _target: Partial<GoalTarget> & { title: string; type: string },
): Promise<{ id?: string } | null> {
  return null;
}

export async function updateTarget(
  _goalId: string,
  _targetId: string,
  _patch: Partial<GoalTarget>,
): Promise<void> {}

export async function deleteTarget(_goalId: string, _targetId: string): Promise<void> {}

export async function migrateMany(_goals: Goal[]): Promise<void> {}
