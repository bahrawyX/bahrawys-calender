/**
 * eventsPersistence.ts (standalone)
 *
 * The full Lumina app persists events to a Drizzle/Neon backend through
 * /api/events. This standalone library has no backend — events live in
 * localStorage so the calendar UI behaves identically (events survive
 * reloads, undo/redo + history work, recurring expansion still happens).
 */

import type { CalendarEvent } from '@/types';

const STORAGE_KEY = 'lumina_calendar_events_v1';

function read(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(events: CalendarEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // quota or serialization error — drop silently
  }
}

export interface ApiEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  description?: string;
  location?: string;
  category?: string;
  completed?: boolean;
  isAllDay?: boolean;
  linkedTaskId?: string | null;
  color?: string;
  provider?: string;
  source?: string;
  externalEventId?: string;
}

export async function fetchAllForCurrentUser(): Promise<CalendarEvent[]> {
  return read();
}

export async function createOne(event: CalendarEvent): Promise<boolean> {
  const list = read();
  const next = [...list.filter((e) => e.id !== event.id), event];
  write(next);
  return true;
}

export async function updateOne(id: string, patch: Partial<CalendarEvent>): Promise<void> {
  const list = read();
  const next = list.map((e) => (e.id === id ? { ...e, ...patch } : e));
  write(next);
}

export async function deleteOne(id: string, _queryString?: string): Promise<void> {
  const list = read();
  write(list.filter((e) => e.id !== id));
}

export async function migrateMany(_events: CalendarEvent[]): Promise<void> {
  // no-op
}
