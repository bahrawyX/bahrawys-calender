/**
 * linkPersistence.ts (standalone stub)
 */
export async function linkTaskEvent(_taskId: string, _eventId: string): Promise<boolean> {
  return true;
}

export async function createLinkedEvent(payload: {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  isAllDay?: boolean;
  category?: string;
  color?: string;
  timezone?: string;
  recurrence?: { rrule: string; exdates?: string[]; until?: string };
  taskId: string;
}): Promise<{ eventId: string; recurrenceId: string | null; taskId: string; linkedAt: string } | null> {
  return {
    eventId: `local-${Date.now()}`,
    recurrenceId: null,
    taskId: payload.taskId,
    linkedAt: new Date().toISOString(),
  };
}

export async function unlinkTaskEvent(_taskId: string, _eventId: string): Promise<boolean> {
  return true;
}
