# bahrawy-calendar

A keyboard-first, beautifully animated calendar component for React. Month / Week / Day views, drag-and-drop, recurring events (RFC 5545), Google / Outlook / Apple Calendar overlays, conflict detection, and localStorage persistence — all in one package.

Built with **React 18/19**, **Zustand**, **date-fns**, **Tailwind CSS**, and **Framer Motion**.

---

## Installation

```bash
npm install bahrawy-calendar
```

### Peer dependencies

```bash
npm install react react-dom zustand date-fns
# Optional — only needed if you enable recurrence
npm install rrule
```

| Peer | Versions |
|------|----------|
| react / react-dom | ^18.0.0 \|\| ^19.0.0 |
| zustand | ^4.5.0 \|\| ^5.0.0 |
| date-fns | ^3.0.0 \|\| ^4.0.0 |
| rrule *(optional)* | ^2.7.0 |

---

## Quick Start

```tsx
import { BahrawyCalendarProvider, useCalendarContext } from 'bahrawy-calendar';

export default function App() {
  return (
    <BahrawyCalendarProvider>
      <MyCalendar />
    </BahrawyCalendarProvider>
  );
}

function MyCalendar() {
  const { useCalendarStore, useEventsStore } = useCalendarContext();
  const view = useCalendarStore((s) => s.view);
  const events = useEventsStore((s) => s.events);

  return (
    <div>
      <p>Current view: {view}</p>
      <p>Events: {events.length}</p>
    </div>
  );
}
```

That's it — the provider creates the Zustand stores, hydrates events from `localStorage`, and exposes everything via context.

---

## Architecture

```
bahrawy-calendar         → Types, context, stores, engines, utils
bahrawy-calendar/compat  → Compat layer for UI template components
bahrawy-calendar/theme   → CSS variable tokens and Tailwind classes
```

The package ships the **core logic** (stores, engines, persistence, recurrence). The **UI components** (MonthView, WeekView, DayView, EventModal, etc.) are copied into your project using the CLI — shadcn/ui style. This gives you full control over markup and styling.

---

## Scaffolding UI Components (CLI)

UI view components are not bundled in the npm package. Instead, use the CLI to copy them into your project:

```bash
# Scaffold everything at once
npx bahrawy-calendar-cli init

# Or add individual components
npx bahrawy-calendar-cli add week-view
npx bahrawy-calendar-cli add month-view
npx bahrawy-calendar-cli add day-view
npx bahrawy-calendar-cli add event-modal

# See all available components
npx bahrawy-calendar-cli list
```

### CLI Options

```bash
npx bahrawy-calendar-cli init --dest src/components/calendar
npx bahrawy-calendar-cli add week-view --dest src/components/calendar --overwrite
```

| Flag | Default | Description |
|------|---------|-------------|
| `-d, --dest <path>` | `components/bahrawy-calendar` | Where to copy component files |
| `--overwrite` | `false` | Replace existing files |

### Available Components

| Component | Description |
|-----------|-------------|
| `bahrawy-calendar` | Root `<BahrawyCalendar />` wrapper |
| `week-view` | 7-day time grid with drag-and-drop |
| `month-view` | 6-week grid with overflow popovers |
| `day-view` | Single-day time grid with timeline |
| `event-modal` | Create/edit dialog with recurrence and categories |
| `time-grid-event` | Positioned event card for Week/Day views |
| `event-item` | Event pill for Month view |
| `drag-ghost` | Drag preview overlay with FLIP animation |
| `hover-indicator` | Time hover line indicator |
| `time-slot-cell` | Clickable hour-slot cell |
| `calendar-shared` | Shared CSS token classes |
| `conflict-dialog` | Conflict detection prompt dialog |
| `conflict-sheet` | Conflict detail sheet with event list |
| `conflict-hook` | Timeline conflict detection hook |
| `visible-events` | Virtualized event filtering utility |
| `virtualization` | Virtual time range + density overflow |
| `recurrence-selector` | Recurrence rule builder UI |
| `edit-recurrence-dialog` | Edit/delete scope dialog for recurring events |
| `date-picker` | Date picker |
| `time-picker` | Time picker with hour/minute selectors |
| `day-timeline` | Shared scrollable day timeline |
| `event-provider-badge` | Provider brand badge (Google/Outlook/Apple) |
| `icons` | All calendar icon components |

The CLI resolves transitive dependencies automatically — adding `week-view` also copies `time-grid-event`, `drag-ghost`, `hover-indicator`, `calendar-shared`, `conflict-hook`, `conflict-dialog`, `conflict-sheet`, `virtualization`, `visible-events`, and `icons`.

---

## Provider Props

```tsx
<BahrawyCalendarProvider
  // Persistence adapter (default: LocalStorageAdapter)
  persistence={myAdapter}

  // Toast function — e.g. Sonner's toast()
  notify={(msg, undoFn) => toast(msg, { action: { label: 'Undo', onClick: undoFn } })}

  // Default view on mount
  defaultView="week"          // 'month' | 'week' | 'day'

  // Initial date
  initialDate={new Date()}

  // External calendar overlays (read-only)
  externalEvents={{
    google: googleEvents,
    outlook: outlookEvents,
    apple: appleEvents,
  }}

  // Feature flags (all true by default)
  enableRecurrence={true}
  enableDragAndDrop={true}
  enableConflictDetection={true}
  enableKeyboardShortcuts={true}

  // Lifecycle callbacks
  callbacks={{
    onEventDeleted: (event) => { /* sync with your backend */ },
    onEventCompleted: (event) => { /* mark task done */ },
    onCategoryRenamed: (oldName, newName) => { /* update references */ },
    onCategoryDeleted: (name) => { /* cleanup */ },
  }}
>
  {children}
</BahrawyCalendarProvider>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `persistence` | `PersistenceAdapter` | `LocalStorageAdapter` | Storage backend |
| `notify` | `(msg, undoFn?, duration?) => void` | no-op | Toast/notification function |
| `defaultView` | `ViewType` | `'month'` | Initial view |
| `initialDate` | `Date` | `new Date()` | Initial date |
| `externalEvents` | `{ google?, outlook?, apple? }` | `{}` | Read-only provider overlays |
| `enableRecurrence` | `boolean` | `true` | Enable recurring events |
| `enableDragAndDrop` | `boolean` | `true` | Enable drag-and-drop |
| `enableConflictDetection` | `boolean` | `true` | Enable conflict detection |
| `enableKeyboardShortcuts` | `boolean` | `true` | Enable keyboard shortcuts |
| `callbacks` | `CalendarLifecycleCallbacks` | `undefined` | Cross-feature hooks |

---

## Accessing Stores

Inside any component wrapped by the provider:

```tsx
import { useCalendarContext } from 'bahrawy-calendar';

function MyComponent() {
  const { useCalendarStore, useEventsStore, useDragStore, config, externalEvents } =
    useCalendarContext();

  // Calendar UI state
  const view = useCalendarStore((s) => s.view);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setView = useCalendarStore((s) => s.setView);
  const openModal = useCalendarStore((s) => s.openModal);

  // Events
  const events = useEventsStore((s) => s.events);
  const addEvent = useEventsStore((s) => s.addEvent);
  const deleteEvent = useEventsStore((s) => s.deleteEvent);
  const moveEvent = useEventsStore((s) => s.moveEvent);
  const undo = useEventsStore((s) => s.undo);

  // Drag state
  const isDragging = useDragStore((s) => s.dragState.isDragging);
}
```

### Events Store API

| Method | Signature | Description |
|--------|-----------|-------------|
| `addEvent` | `(event: CalendarEvent) => void` | Create a new event (persisted) |
| `addEventOptimistic` | `(event: CalendarEvent) => void` | Add without waiting for persistence |
| `updateEvent` | `(event, editScope?) => void` | Update event (supports recurrence scope) |
| `deleteEvent` | `(id, editScope?) => void` | Delete event |
| `moveEvent` | `(id, newDate, startTime?, endTime?) => void` | Reschedule event |
| `toggleEventCompletion` | `(id) => void` | Toggle completed state |
| `undo` | `() => void` | Undo last action |
| `redo` | `() => void` | Redo last undone action |

### Calendar UI Store API

| Method | Signature | Description |
|--------|-----------|-------------|
| `setView` | `(view: ViewType) => void` | Switch view |
| `setCurrentDate` | `(date: Date) => void` | Navigate to date |
| `setSearchQuery` | `(query: string) => void` | Filter events by search |
| `toggleFilter` | `(category: string) => void` | Toggle category filter |
| `openModal` | `(eventId?, date?, time?) => void` | Open event modal |
| `closeModal` | `() => void` | Close event modal |
| `addCustomCategory` | `(name, color) => boolean` | Add custom category |
| `removeCustomCategory` | `(name) => void` | Remove custom category |

---

## Persistence

By default, events are stored in `localStorage`. To use your own backend, implement the `PersistenceAdapter` interface:

```tsx
import type { PersistenceAdapter, CalendarEvent } from 'bahrawy-calendar';

class SupabaseAdapter implements PersistenceAdapter {
  async fetchAll(): Promise<CalendarEvent[]> {
    const { data } = await supabase.from('events').select('*');
    return data ?? [];
  }

  async create(event: CalendarEvent): Promise<boolean> {
    const { error } = await supabase.from('events').insert(event);
    return !error;
  }

  async update(id: string, patch: Partial<CalendarEvent>): Promise<void> {
    await supabase.from('events').update(patch).eq('id', id);
  }

  async delete(id: string): Promise<void> {
    await supabase.from('events').delete().eq('id', id);
  }
}

// Pass it to the provider
<BahrawyCalendarProvider persistence={new SupabaseAdapter()}>
```

### Built-in Adapters

| Adapter | Import | Description |
|---------|--------|-------------|
| `LocalStorageAdapter` | `bahrawy-calendar` | Stores events in `localStorage` (default) |
| `NoopAdapter` | `bahrawy-calendar` | Does nothing — for testing or fully controlled state |

```tsx
import { LocalStorageAdapter } from 'bahrawy-calendar';

// Custom storage key
const adapter = new LocalStorageAdapter('my_app_events');
```

---

## External Calendar Providers

Overlay read-only events from Google Calendar, Outlook, or Apple Calendar:

```tsx
<BahrawyCalendarProvider
  externalEvents={{
    google: googleCalendarEvents,   // CalendarEvent[] from your OAuth sync
    outlook: outlookEvents,          // CalendarEvent[] from MS Graph
    apple: appleEvents,              // CalendarEvent[] from CalDAV
  }}
>
```

External events render alongside local events but cannot be edited or dragged. They display with provider badges (Google blue, Outlook teal, Apple gray).

To fetch these events, implement your own OAuth / CalDAV integration and pass the normalized `CalendarEvent[]` arrays.

---

## Theme Customization

### CSS Variables

Override design tokens using CSS variables with the `--bc-` prefix:

```css
.bahrawy-calendar {
  --bc-primary: #6D59E0;
  --bc-primary-hover: #5B4AC5;
  --bc-surface: hsl(0 0% 100%);
  --bc-border: hsl(220 13% 91%);
  --bc-text: hsl(224 71% 4%);
  --bc-text-muted: hsl(220 9% 46%);
  --bc-radius: 12px;
  --bc-hour-height: 80px;
  --bc-shadow-card: 0 1px 2px rgba(17,17,28,0.03);
  --bc-shadow-card-hover: 0 6px 16px -4px rgba(17,17,28,0.07);
  --bc-hover-line-bg: rgba(109,89,224,0.60);
  --bc-today-badge-bg: #6D59E0;
}
```

### Programmatic Theming

```tsx
import { themeTokensToCSS } from 'bahrawy-calendar';

const styles = themeTokensToCSS({
  primary: '#FF6B35',
  radius: '8px',
  hourHeight: '60px',
});

<div style={styles}>
  <BahrawyCalendarProvider>...</BahrawyCalendarProvider>
</div>
```

### Tailwind Class Tokens

```tsx
import { cal } from 'bahrawy-calendar/theme';

<div className={cal.container}>
  <div className={cal.header}>...</div>
</div>
```

Available tokens: `container`, `header`, `weekdayLabel`, `timeLabel`, `timeSidebar`, `colDivider`, `hourLine`, `quarterLine`, `todayBadge`, `dayNumber`, `dayNumberMuted`, `todayRing`, `cellTransition`, `monthCellActive`, `slotHoverBg`, `monthGridBg`.

---

## Recurrence Engine

Full RFC 5545 RRULE support (requires the optional `rrule` peer dependency):

```tsx
import {
  expandRecurrence,
  buildRRule,
  describeRRule,
  parseRRule,
  getNextOccurrences,
} from 'bahrawy-calendar';

// Build an RRULE string
const rrule = buildRRule({
  frequency: 'WEEKLY',
  interval: 1,
  daysOfWeek: [1, 3, 5],  // Mon, Wed, Fri
  endCondition: { type: 'COUNT', count: 10 },
});

// Human-readable description
describeRRule(rrule); // "Every week on Mon, Wed, Fri, 10 times"

// Expand occurrences in a date range
const instances = expandRecurrence(event, '2025-01-01', '2025-03-31');

// Get next 5 occurrences from today
const upcoming = getNextOccurrences(event, 5);
```

---

## Slot & Overlap Engines

Utilities for building custom views:

```tsx
import {
  makeSlotKey,
  parseSlotKey,
  hourLabel,
  calculateOverlaps,
  getEventsForSlot,
  buildHourOccupancyMap,
  getFreeGapsForDay,
  calculateDragCollision,
} from 'bahrawy-calendar';

// Time slot identifiers
const key = makeSlotKey('2025-06-15', 9, 30); // "2025-06-15_09:30"
const { date, hour, minute } = parseSlotKey(key);

// Overlap detection for column layout
const overlapMap = calculateOverlaps(events);
// overlapMap.get(eventId) -> { column: 0, totalColumns: 3 }

// Hour occupancy map
const occupancy = buildHourOccupancyMap(events, '2025-06-15');

// Find free time gaps
const gaps = getFreeGapsForDay(events, '2025-06-15', 9, 17);
// [{ startMin: 600, endMin: 660 }, { startMin: 780, endMin: 900 }]
```

---

## Utility Functions

```tsx
import {
  formatDateISO,
  getDaysInMonth,
  getDaysInWeek,
  isSameDay,
  getEventPosition,
  expandRecurrences,
  formatTime,
  timeToMinutes,
  minutesToTime,
  uid,
  HOUR_HEIGHT,
} from 'bahrawy-calendar';

// Date formatting
formatDateISO(new Date()); // "2025-06-15"

// Time conversion
timeToMinutes('14:30'); // 870
minutesToTime(870);     // "14:30"

// Generate unique IDs
const eventId = uid(); // "a1b2c3d4e5..."

// Pixel height of each hour row
HOUR_HEIGHT; // 80
```

---

## Types Reference

```tsx
import type {
  CalendarEvent,
  EventInstance,
  ViewType,
  RecurrenceRule,
  EditScope,
  EventCategory,
  CustomCategory,
  OverlapGroup,
  DragState,
  EventSource,
  EventProvider,
  MeetingLink,
  NotifyFn,
  CalendarLifecycleCallbacks,
  PersistenceAdapter,
  CalendarThemeTokens,
  BahrawyCalendarProviderProps,
  CalendarConfig,
  CalendarContextValue,
  CalendarEventsState,
  CalendarUIState,
  DragStoreState,
} from 'bahrawy-calendar';
```

### CalendarEvent

```tsx
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;            // "YYYY-MM-DD"
  startTime: string;       // "HH:mm"
  endTime: string;         // "HH:mm"
  timezone: string;
  location?: string;
  category: string;
  color: string;
  recurrence?: RecurrenceRule | null;
  meetingLink?: MeetingLink | null;
  completed?: boolean;
  source?: 'local' | 'google' | 'microsoft' | 'outlook' | 'apple';
  provider?: 'local' | 'google' | 'microsoft' | 'outlook' | 'apple';
  editable?: boolean;
  readOnly?: boolean;
  draggable?: boolean;
}
```

### RecurrenceRule

```tsx
interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  daysOfWeek?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
  endCondition:
    | { type: 'NEVER' }
    | { type: 'UNTIL'; untilDate: string }
    | { type: 'COUNT'; count: number };
  rrule?: string;  // Raw RFC 5545 RRULE string
}
```

### EditScope

```tsx
type EditScope = 'this' | 'this_and_following' | 'all';
```

Used when editing or deleting recurring events to specify whether the change applies to a single instance, this and future instances, or the entire series.

---

## Keyboard Shortcuts

When `enableKeyboardShortcuts` is `true` (default):

| Shortcut | Action |
|----------|--------|
| `N` | New event |
| `T` | Jump to today |
| `M` | Switch to month view |
| `W` | Switch to week view |
| `D` | Switch to day view |
| `←` / `→` | Navigate prev/next |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Escape` | Close modal / cancel drag |

---

## Constants

```tsx
import {
  CATEGORIES,       // Built-in category list
  EVENT_COLORS,     // Category -> hex color mapping
  PROVIDER_COLORS,  // Provider -> brand color mapping
  PROVIDER_LABELS,  // Provider -> display label mapping
  DAYS,             // ['Sun', 'Mon', ...]
  MONTHS,           // ['January', 'February', ...]
} from 'bahrawy-calendar';
```

---

## Advanced: Factory Stores

For multi-instance calendars or custom architectures, create stores directly:

```tsx
import {
  createEventsStore,
  createCalendarStore,
  createDragStore,
  LocalStorageAdapter,
} from 'bahrawy-calendar';

const eventsStore = createEventsStore({
  persistence: new LocalStorageAdapter('calendar_a'),
  notify: (msg) => console.log(msg),
  callbacks: {
    onEventDeleted: (e) => console.log('Deleted:', e.id),
  },
});

const calendarStore = createCalendarStore({
  defaultView: 'week',
  initialDate: new Date(),
});

const dragStore = createDragStore(() => eventsStore.getState());
```

---

## Template Components (Compat Layer)

The scaffolded UI templates import from `bahrawy-calendar/compat` — a convenience re-export that maps all stores, utils, engines, and constants under a single import:

```tsx
// Inside a scaffolded template component
import { useCalendarStore, useCalendarEventsStore, useDragStore } from 'bahrawy-calendar/compat';
import { timeToMinutes, HOUR_HEIGHT, hourLabel, makeSlotKey } from 'bahrawy-calendar/compat';
import { EVENT_COLORS, CATEGORIES } from 'bahrawy-calendar/compat';
```

You don't need to use the compat layer in your own code — it exists to keep the template components concise. For new code, prefer importing directly from `bahrawy-calendar`.

---

## Performance

- **Virtualized time ranges**: Only visible hours are rendered in Week/Day views
- **Density guards**: When event count exceeds 200, compact mode activates automatically (column capping, overflow indicators)
- **Memoized overlap calculations**: `calculateOverlaps` is cached per render cycle
- **Debug overlay**: Enable `window.__BAHRAWY_PERF_DEBUG__ = true` in console to see real-time render stats, FPS, and DOM node counts

---

## shadcn/ui Dependencies

The scaffolded UI components use these shadcn/ui primitives. Install them before using the templates:

```bash
npx shadcn@latest add dialog button input textarea label select separator popover scroll-area tooltip sheet calendar
```

Required per component:

| Component | shadcn deps |
|-----------|-------------|
| `week-view` | scroll-area, tooltip |
| `month-view` | popover, scroll-area |
| `day-view` | scroll-area, tooltip |
| `event-modal` | dialog, input, textarea, label, select, button, separator |
| `time-grid-event` | tooltip |
| `conflict-dialog` | dialog, button |
| `conflict-sheet` | sheet, scroll-area, button |
| `virtualization` | popover, scroll-area |
| `recurrence-selector` | select, input, label |
| `date-picker` | popover, calendar, button |
| `time-picker` | select |

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

---

## License

MIT
