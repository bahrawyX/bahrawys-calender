export type IntelligenceProvider = 'local' | 'google' | 'microsoft';

export interface IntelligenceCalendarEvent {
  id: string;
  title: string;
  provider: IntelligenceProvider;
  startIso: string;
  endIso: string;
  isAllDay: boolean;
  timezone: string;
  category?: string;
}

export interface IntelligenceTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDateIso: string | null;
  estimatedMinutes: number;
  context?: string | null;
}

export interface IntelligenceFocusSession {
  id: string;
  startIso: string;
  endIso: string;
  durationMinutes: number;
}

export interface IntelligencePlannedItem {
  taskId: string;
  taskTitle: string;
  startIso: string;
  endIso: string;
}

export interface IntelligenceInput {
  userId: string;
  timezone: string;
  rangeStartIso: string;
  rangeEndIso: string;
  minFocusWindowMinutes: number;
  calendarEvents: IntelligenceCalendarEvent[];
  tasks: IntelligenceTask[];
  focusSessions: IntelligenceFocusSession[];
  plannedItems?: IntelligencePlannedItem[];
}

export interface FocusWindow {
  start: string;
  end: string;
  durationMinutes: number;
  score: number;
  reason: string;
}

export type ConflictType = 'overlap' | 'task_due_conflict' | 'impossible_day_load';
export type Severity = 'low' | 'medium' | 'high';

export interface Conflict {
  type: ConflictType;
  severity: Severity;
  start: string;
  end: string;
  relatedEventIds: string[];
  relatedTaskIds?: string[];
  reason: string;
}

export interface Overload {
  date: string;
  severity: Severity;
  reason: string;
  score: number;
  meetingMinutes: number;
  focusMinutes: number;
  urgentTaskMinutes: number;
}

export interface TaskSuggestion {
  taskId: string;
  suggestedStart: string;
  suggestedEnd: string;
  confidence: number;
  reason: string;
}

export interface Recommendation {
  id: string;
  type: 'focus_window' | 'conflict' | 'overload' | 'task_plan';
  priority: Severity;
  explanation: string;
  evidence: Record<string, unknown>;
  relatedIds?: string[];
}

export interface IntelligenceMetrics {
  totalEvents: number;
  localEvents: number;
  googleEvents: number;
  microsoftEvents: number;
  totalTasks: number;
  openTasks: number;
  focusSessionsCount: number;
  scheduledMinutes: number;
  meetingMinutes: number;
  totalFocusWindowMinutes: number;
}

export interface IntelligenceSummary {
  rangeStart: string;
  rangeEnd: string;
  timezone: string;
  topFocusWindow: FocusWindow | null;
  topRecommendation: Recommendation | null;
}

export interface IntelligenceOutput {
  summary: IntelligenceSummary;
  focusWindows: FocusWindow[];
  conflicts: Conflict[];
  overloads: Overload[];
  recommendations: Recommendation[];
  taskSuggestions: TaskSuggestion[];
  metrics: IntelligenceMetrics;
}
