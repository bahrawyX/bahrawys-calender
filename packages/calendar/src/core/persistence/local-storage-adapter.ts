/**
 * Default persistence adapter — localStorage.
 * Events survive page reloads in a single browser.
 */

import type { CalendarEvent } from '../../types';
import type { PersistenceAdapter } from './types';

const DEFAULT_KEY = 'bahrawy_calendar_events_v1';

export class LocalStorageAdapter implements PersistenceAdapter {
  private key: string;

  constructor(storageKey?: string) {
    this.key = storageKey ?? DEFAULT_KEY;
  }

  private read(): CalendarEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(events: CalendarEvent[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(events));
    } catch {
      // quota or serialization error — drop silently
    }
  }

  async fetchAll(): Promise<CalendarEvent[]> {
    return this.read();
  }

  async create(event: CalendarEvent): Promise<boolean> {
    const list = this.read();
    const next = [...list.filter((e) => e.id !== event.id), event];
    this.write(next);
    return true;
  }

  async update(id: string, patch: Partial<CalendarEvent>): Promise<void> {
    const list = this.read();
    const next = list.map((e) => (e.id === id ? { ...e, ...patch } : e));
    this.write(next);
  }

  async delete(id: string): Promise<void> {
    const list = this.read();
    this.write(list.filter((e) => e.id !== id));
  }
}
