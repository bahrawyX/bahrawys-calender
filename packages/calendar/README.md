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

> **Note:** The built-in `<BahrawyCalendar />` component uses inline styles and has zero additional dependencies beyond the peer deps above. If you build custom views with the headless stores, you can style them however you want.

---

## Quick Start

### Option 1: Drop-in Component

The simplest way — renders a full calendar with Month/Week/Day views out of the box:

```tsx
import { BahrawyCalendar } from 'bahrawy-calendar';

export default function App() {
  return (
    <BahrawyCalendar
      defaultView="week"
      enableRecurrence
      callbacks={{
        onEventDeleted: (event) => console.log('Deleted:', event.id),
      }}
    />
  );
}
```

### Option 2: Provider + Custom UI

For full control, use the provider and build your own views with the stores:

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

Both options create Zustand stores, hydrate events from `localStorage`, and expose everything via context.

---

## Architecture

```
bahrawy-calendar         → Types, context, stores, engines, utils
bahrawy-calendar/compat  → Compat layer for UI template components
bahrawy-calendar/theme   → CSS variable tokens and Tailwind classes
bahrawy-calendar/apple   → Server-side Apple CalDAV utilities (Node.js only)
```

The package ships **everything you need out of the box**: built-in Month/Week/Day views via `<BahrawyCalendar />`, plus the core logic (stores, engines, persistence, recurrence) as headless building blocks if you want full control over the UI.

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

  // Built-in integrations — just provide your API credentials
  integrations={{
    google: {
      clientId: 'your-id.apps.googleusercontent.com',
      apiKey: 'AIza...',  // optional
    },
    outlook: {
      clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      tenantId: 'common',  // optional, defaults to 'common'
    },
    apple: {
      proxyUrl: '/api/apple-calendar',  // your server route
    },
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
| `integrations` | `IntegrationsConfig` | `undefined` | Google/Outlook/Apple calendar config |

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

## Built-in Integrations (Google, Outlook, Apple)

Provide your API credentials and the package handles OAuth + event fetching automatically.

```tsx
<BahrawyCalendarProvider
  integrations={{
    google: {
      clientId: 'your-id.apps.googleusercontent.com',
      apiKey: 'AIza...',  // optional
    },
    outlook: {
      clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      tenantId: 'common',
    },
    apple: {
      proxyUrl: '/api/apple-calendar',  // your server route
    },
  }}
>
```

### Setup

**Google Calendar** (client-side, no backend):
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application type)
3. Add your domain to **Authorized JavaScript origins**
4. Enable the **Google Calendar API** in your project
5. Pass the `clientId` (and optionally `apiKey`) to the integration config

**Outlook Calendar** (client-side, no backend):
1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Register a new application (Single-page application)
3. Add your domain as a **Redirect URI**
4. Under API permissions, add **Microsoft Graph → Calendars.Read**
5. Pass the `clientId` and optionally the `tenantId`

**Apple Calendar** (needs a small server route — CalDAV can't run in the browser):
1. Go to [appleid.apple.com](https://appleid.apple.com) → **Sign-In and Security** → **App-Specific Passwords**
2. Users generate an app-specific password (no API keys for you to manage)
3. Create a server route using the provided utility (see below)
4. Pass the `proxyUrl` to the integration config

#### Apple Calendar Server Route

The package provides a drop-in request handler. Just create one API route:

**Next.js App Router:**
```ts
// app/api/apple-calendar/route.ts
import { handleAppleCalendarRequest } from 'bahrawy-calendar/apple';

export async function POST(req: Request) {
  return handleAppleCalendarRequest(req);
}
```

**Express:**
```ts
import { handleAppleCalendarRequest } from 'bahrawy-calendar/apple';

app.post('/api/apple-calendar', async (req, res) => {
  const request = new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  const response = await handleAppleCalendarRequest(request);
  const data = await response.json();
  res.status(response.status).json(data);
});
```

That's it — the handler validates credentials, discovers calendars, and fetches events automatically.

### Connect / Disconnect

The provider exposes methods via context:

```tsx
import { useCalendarContext } from 'bahrawy-calendar';

function IntegrationButtons() {
  const { integrations } = useCalendarContext();

  return (
    <div>
      {integrations.connectGoogle && (
        <button onClick={integrations.connectGoogle} disabled={integrations.isGoogleConnected}>
          {integrations.isGoogleConnected ? 'Google Connected' : 'Connect Google Calendar'}
        </button>
      )}

      {integrations.connectOutlook && (
        <button onClick={integrations.connectOutlook} disabled={integrations.isOutlookConnected}>
          {integrations.isOutlookConnected ? 'Outlook Connected' : 'Connect Outlook'}
        </button>
      )}

      {integrations.isGoogleConnected && (
        <button onClick={integrations.disconnectGoogle}>Disconnect Google</button>
      )}

      {integrations.isOutlookConnected && (
        <button onClick={integrations.disconnectOutlook}>Disconnect Outlook</button>
      )}

      {/* Apple uses email + app-specific password instead of OAuth */}
      {integrations.connectApple && !integrations.isAppleConnected && (
        <button onClick={() => {
          const email = prompt('Apple ID email:');
          const password = prompt('App-specific password:');
          if (email && password) integrations.connectApple!(email, password);
        }}>
          Connect Apple Calendar
        </button>
      )}

      {integrations.isAppleConnected && (
        <button onClick={integrations.disconnectApple}>Disconnect Apple</button>
      )}
    </div>
  );
}
```

### How It Works

**Google & Outlook (client-side OAuth):**
1. User clicks "Connect" → OAuth popup opens
2. User grants calendar read access
3. Token is stored in `localStorage` (persists across sessions)
4. Events are fetched from Google Calendar API / Microsoft Graph

**Apple Calendar (CalDAV via proxy):**
1. User enters Apple ID email + app-specific password
2. Credentials are validated via your server proxy → iCloud CalDAV
3. Credentials stored in `localStorage` (persists across sessions)
4. Events fetched from all iCloud calendars via the proxy

**All providers:** Events appear as read-only overlays alongside local events. On next page load, events auto-refresh if credentials are still valid.

### Integration Config

| Provider | Field | Required | Description |
|----------|-------|----------|-------------|
| **Google** | `clientId` | Yes | OAuth 2.0 Client ID |
| **Google** | `apiKey` | No | API key (optional, OAuth alone is sufficient) |
| **Google** | `scopes` | No | Custom scopes (default: `calendar.readonly`) |
| **Outlook** | `clientId` | Yes | Application (client) ID |
| **Outlook** | `tenantId` | No | Tenant ID (default: `common` — any account) |
| **Outlook** | `scopes` | No | Custom scopes (default: `Calendars.Read`) |
| **Apple** | `proxyUrl` | Yes | Your server API route that proxies CalDAV requests |

### Manual External Events

You can still pass pre-fetched events manually alongside the built-in integrations:

```tsx
<BahrawyCalendarProvider
  externalEvents={{
    apple: appleEvents,       // CalendarEvent[] you fetched yourself
    google: extraGoogleEvents, // merged with integration-fetched events
  }}
>
```

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

```bash
npm install rrule
```

The rrule library is loaded asynchronously. If you use `<BahrawyCalendarProvider>` or `<BahrawyCalendar>`, it's initialized automatically when `enableRecurrence` is `true` (the default). For standalone usage, call `initRecurrence()` first:

```tsx
import {
  initRecurrence,
  expandRecurrence,
  buildRRule,
  describeRRule,
  parseRRule,
  getNextOccurrences,
} from 'bahrawy-calendar';

// Initialize once at app startup
await initRecurrence();

// Build an RRULE string
const rule = buildRRule({
  freq: 'weekly',
  byDay: ['MO', 'WE', 'FR'],
  count: 10,
});

// Human-readable description
describeRRule(rule, new Date()); // "every week on Monday, Wednesday, Friday, 10 times"

// Expand occurrences in a date range
const instances = expandRecurrence(input, rangeStart, rangeEnd, durationMs);

// Get next 5 occurrences from today
const upcoming = getNextOccurrences(input, new Date(), 5, durationMs);
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

## Compat Layer

The `bahrawy-calendar/compat` entry point provides convenience re-exports for migration scenarios or custom view components:

```tsx
import { useCalendarStore, useCalendarEventsStore, useDragStore } from 'bahrawy-calendar/compat';
import { timeToMinutes, HOUR_HEIGHT, hourLabel, makeSlotKey } from 'bahrawy-calendar/compat';
import { EVENT_COLORS, CATEGORIES } from 'bahrawy-calendar/compat';
```

For new code, prefer importing directly from `bahrawy-calendar`.

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
