/**
 * PersistenceAdapter — the interface for swapping storage backends.
 *
 * The default implementation uses localStorage. Users can provide their own
 * adapter (Supabase, Firebase, REST API, etc.) via <BahrawyCalendar persistence={{ adapter }}>
 */

import type { CalendarEvent } from '../../types';

export interface PersistenceAdapter {
  /** Load all events for the current user. Called once on mount. */
  fetchAll(): Promise<CalendarEvent[]>;

  /** Persist a newly created event. Return true on success. */
  create(event: CalendarEvent): Promise<boolean>;

  /** Update an existing event by ID. */
  update(id: string, patch: Partial<CalendarEvent>): Promise<void>;

  /** Delete an event by ID. Optional query string for edit-scope params. */
  delete(id: string, queryString?: string): Promise<void>;
}
