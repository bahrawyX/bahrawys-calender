/**
 * No-op persistence adapter — for SSR or when the user manages state externally.
 * All operations resolve immediately with no side effects.
 */

import type { CalendarEvent } from '../../types';
import type { PersistenceAdapter } from './types';

export class NoopAdapter implements PersistenceAdapter {
  async fetchAll(): Promise<CalendarEvent[]> {
    return [];
  }

  async create(): Promise<boolean> {
    return true;
  }

  async update(): Promise<void> {}

  async delete(): Promise<void> {}
}
