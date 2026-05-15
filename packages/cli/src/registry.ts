/**
 * Component registry — maps component names to their source files
 * and any dependencies they require.
 */

export interface RegistryEntry {
  name: string;
  description: string;
  /** Source files to copy, relative to the app's src/components/ */
  files: string[];
  /** Other registry entries this component depends on */
  dependencies: string[];
  /** npm packages this component requires */
  packages: string[];
  /** shadcn/ui components this component uses */
  shadcnDeps: string[];
}

export const REGISTRY: Record<string, RegistryEntry> = {
  'bahrawy-calendar': {
    name: 'bahrawy-calendar',
    description: 'Root <BahrawyCalendar /> wrapper component',
    files: ['BahrawyCalendar.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'week-view': {
    name: 'week-view',
    description: 'Week view — 7-day time grid with drag-and-drop',
    files: ['WeekView.tsx'],
    dependencies: ['time-grid-event', 'time-slot-cell', 'drag-ghost', 'hover-indicator', 'calendar-shared', 'conflict-hook', 'conflict-dialog', 'conflict-sheet', 'virtualization', 'visible-events', 'icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['scroll-area', 'tooltip'],
  },
  'month-view': {
    name: 'month-view',
    description: 'Month view — 6-week grid with overflow popovers',
    files: ['MonthView.tsx'],
    dependencies: ['event-item', 'event-provider-badge', 'calendar-shared', 'icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['popover', 'scroll-area'],
  },
  'day-view': {
    name: 'day-view',
    description: 'Day view — single-day time grid with timeline',
    files: ['DayView.tsx'],
    dependencies: ['time-grid-event', 'time-slot-cell', 'drag-ghost', 'hover-indicator', 'calendar-shared', 'day-timeline', 'conflict-hook', 'conflict-dialog', 'conflict-sheet', 'visible-events', 'icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['scroll-area', 'tooltip'],
  },
  'time-grid-event': {
    name: 'time-grid-event',
    description: 'Positioned event card for time grids (Week/Day)',
    files: ['TimeGridEvent.tsx'],
    dependencies: ['icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['tooltip'],
  },
  'event-item': {
    name: 'event-item',
    description: 'Event pill for Month view and popovers',
    files: ['EventItem.tsx'],
    dependencies: ['icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'event-modal': {
    name: 'event-modal',
    description: 'Create/Edit event dialog with recurrence and categories',
    files: ['EventModal.tsx'],
    dependencies: ['recurrence-selector', 'edit-recurrence-dialog', 'date-picker', 'time-picker', 'icons'],
    packages: ['bahrawy-calendar', 'zod'],
    shadcnDeps: ['dialog', 'input', 'textarea', 'label', 'select', 'button', 'separator'],
  },
  'event-provider-badge': {
    name: 'event-provider-badge',
    description: 'Provider brand badge (Google/Outlook/Apple/local)',
    files: ['EventProviderBadge.tsx'],
    dependencies: ['icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'time-slot-cell': {
    name: 'time-slot-cell',
    description: 'Clickable hour-slot cell with hover state',
    files: ['TimeSlotCell.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'drag-ghost': {
    name: 'drag-ghost',
    description: 'Drag preview overlay with FLIP animation',
    files: ['DragGhost.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar', 'framer-motion'],
    shadcnDeps: [],
  },
  'hover-indicator': {
    name: 'hover-indicator',
    description: 'Time hover line indicator',
    files: ['HoverTimeIndicator.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'calendar-shared': {
    name: 'calendar-shared',
    description: 'Shared calendar surface and CSS token classes',
    files: ['ui/CalendarShared.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'conflict-hook': {
    name: 'conflict-hook',
    description: 'Timeline conflict detection hook',
    files: ['calendar/interaction/useTimelineConflict.ts'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'conflict-dialog': {
    name: 'conflict-dialog',
    description: 'Conflict detection prompt dialog',
    files: ['calendar/interaction/TimelineConflictDialog.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['dialog', 'button'],
  },
  'conflict-sheet': {
    name: 'conflict-sheet',
    description: 'Conflict detail sheet with event list',
    files: ['calendar/interaction/TimelineConflictSheet.tsx'],
    dependencies: ['icons'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['sheet', 'scroll-area', 'button'],
  },
  'visible-events': {
    name: 'visible-events',
    description: 'Virtualized event filtering utility',
    files: ['calendar/getVisibleEvents.ts'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'edit-recurrence-dialog': {
    name: 'edit-recurrence-dialog',
    description: 'Edit/delete scope dialog for recurring events',
    files: ['EditRecurrenceDialog.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['dialog', 'button'],
  },
  'day-timeline': {
    name: 'day-timeline',
    description: 'Shared scrollable day timeline component',
    files: ['calendar/DayCalendarTimeline.tsx'],
    dependencies: ['time-grid-event', 'calendar-shared', 'virtualization', 'visible-events'],
    packages: ['bahrawy-calendar'],
    shadcnDeps: [],
  },
  'virtualization': {
    name: 'virtualization',
    description: 'Virtual time range and density overflow components',
    files: [
      'calendar/virtualization/index.ts',
      'calendar/virtualization/useVisibleTimeRange.ts',
      'calendar/virtualization/useDensityGuard.ts',
      'calendar/virtualization/usePerfDebug.ts',
      'calendar/virtualization/DensityOverflowIndicator.tsx',
    ],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['popover', 'scroll-area'],
  },
  'recurrence-selector': {
    name: 'recurrence-selector',
    description: 'Recurrence rule builder UI',
    files: ['RecurrenceSelector.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['select', 'input', 'label'],
  },
  'date-picker': {
    name: 'date-picker',
    description: 'Date picker component',
    files: ['DatePicker.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar', 'react-day-picker'],
    shadcnDeps: ['popover', 'calendar', 'button'],
  },
  'time-picker': {
    name: 'time-picker',
    description: 'Time picker with minute/hour selectors',
    files: ['TimePicker.tsx'],
    dependencies: [],
    packages: ['bahrawy-calendar'],
    shadcnDeps: ['select'],
  },
  'icons': {
    name: 'icons',
    description: 'All calendar icon components',
    files: ['icons/index.ts', 'icons/IconBase.tsx', 'icons/ProviderIcons.tsx'],
    dependencies: [],
    packages: [],
    shadcnDeps: [],
  },
};

/** Get all unique npm packages required by a set of components */
export function getRequiredPackages(components: string[]): string[] {
  const pkgs = new Set<string>();
  for (const comp of components) {
    const entry = REGISTRY[comp];
    if (!entry) continue;
    for (const pkg of entry.packages) pkgs.add(pkg);
    // Recursively get dependency packages
    const depPkgs = getRequiredPackages(entry.dependencies);
    for (const p of depPkgs) pkgs.add(p);
  }
  return [...pkgs];
}

/** Get all unique shadcn components required */
export function getRequiredShadcn(components: string[]): string[] {
  const shadcn = new Set<string>();
  for (const comp of components) {
    const entry = REGISTRY[comp];
    if (!entry) continue;
    for (const s of entry.shadcnDeps) shadcn.add(s);
    const depShadcn = getRequiredShadcn(entry.dependencies);
    for (const s of depShadcn) shadcn.add(s);
  }
  return [...shadcn].sort();
}

/** Resolve all transitive dependencies for a set of components */
export function resolveAllDependencies(components: string[]): string[] {
  const resolved = new Set<string>();
  const queue = [...components];
  while (queue.length > 0) {
    const comp = queue.pop()!;
    if (resolved.has(comp)) continue;
    resolved.add(comp);
    const entry = REGISTRY[comp];
    if (entry) {
      for (const dep of entry.dependencies) {
        if (!resolved.has(dep)) queue.push(dep);
      }
    }
  }
  return [...resolved];
}
