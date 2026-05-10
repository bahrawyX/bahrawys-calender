/**
 * focusPersistence.ts (standalone stub)
 */
import type { FocusSession } from '@/store/useFocusStore';
import type { FocusSessionResult } from '@/types';

export async function fetchAllForCurrentUser(): Promise<FocusSession[]> {
  return [];
}

export async function createOne(_session: FocusSession): Promise<FocusSessionResult | null> {
  return null;
}

export async function deleteOne(_id: string): Promise<void> {}

export async function migrateMany(_sessions: FocusSession[]): Promise<void> {}
