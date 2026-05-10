/**
 * Slot Engine
 * -----------
 * Defines the identity model for time-grid slot cells.
 * Every cell in the Day/Week grid is a first-class entity identified
 * by a deterministic, stable key derived purely from date + time range.
 *
 * No global state. No side effects. Pure functions only.
 */

export type SlotGranularity = 'HOUR';

/** The canonical identity of a single slot cell */
export interface TimeSlotId {
  /** ISO date string e.g. "2026-02-15" */
  dateISO: string;
  /** Minutes from 00:00, e.g. 780 for 13:00 */
  startMinute: number;
  /** Slot duration in minutes — 60 for hour-granularity slots */
  durationMinutes: number;
}

/**
 * Build a deterministic, stable key for a slot.
 * Safe to use as a React `key`, Map key, or store identifier.
 */
export const makeSlotKey = (
  dateISO: string,
  startMinute: number,
  durationMinutes = 60
): string => `${dateISO}|${startMinute}|${durationMinutes}`;

/** Decode a slot key back into its three parts */
export const parseSlotKey = (key: string): TimeSlotId => {
  const [dateISO, sm, dm] = key.split('|');
  return {
    dateISO,
    startMinute: Number(sm),
    durationMinutes: Number(dm),
  };
};

/** Convert total minutes from midnight to an HH:mm string */
export const minutesToHHMM = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Return the slot's start time as HH:mm */
export const slotStartTime = (startMinute: number): string =>
  minutesToHHMM(startMinute);

/**
 * Half-open interval overlap test.
 * Returns true when an event's time range intersects a slot's time range.
 *
 *   eventStart < slotEnd  &&  eventEnd > slotStart
 */
export const eventOverlapsSlot = (
  eventStartMinute: number,
  eventEndMinute: number,
  slotStartMinute: number,
  slotEndMinute: number
): boolean =>
  eventStartMinute < slotEndMinute && eventEndMinute > slotStartMinute;

/** Human-readable hour label for aria / tooltip use */
export const hourLabel = (hour: number): string =>
  hour === 0
    ? '12:00 AM'
    : hour < 12
    ? `${hour}:00 AM`
    : hour === 12
    ? '12:00 PM'
    : `${hour - 12}:00 PM`;
