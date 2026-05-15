/**
 * Default notify implementation backed by Sonner.
 * Can be overridden via CalendarConfig.notify.
 */

import type { NotifyFn } from '../../types';

let _notifyFn: NotifyFn | null = null;

/**
 * Set the notification function. Called by BahrawyCalendarProvider on mount.
 * If not called, notifications are no-ops (silent mode).
 */
export function setNotifyFn(fn: NotifyFn): void {
  _notifyFn = fn;
}

/**
 * Get the current notify function. Returns a no-op if not configured.
 */
export function getNotifyFn(): NotifyFn {
  return _notifyFn ?? (() => {});
}

/**
 * Notify shorthand — calls the configured notification function.
 */
const notify: NotifyFn = (message, undoFn?, duration?) => {
  const fn = getNotifyFn();
  fn(message, undoFn, duration);
};

export default notify;
