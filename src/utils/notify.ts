/**
 * notify — lightweight notifier utility backed by Sonner.
 *
 * Call this anywhere (components, store actions, services).
 * Uses Sonner's module-level `toast` function — no React hook required.
 *
 * Examples:
 *   notify('Event created: Design Review (3:00–4:00)');
 *   notify('Event deleted.', () => useCalendarStore.getState().undo());
 */
import { toast } from 'sonner';

const notify = (
  message: string,
  undoFn?: () => void,
  duration = 3500
): void => {
  if (undoFn) {
    toast(message, {
      duration,
      action: {
        label: 'Undo',
        onClick: undoFn,
      },
    });
  } else {
    toast(message, { duration });
  }
};

export default notify;
