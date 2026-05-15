# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start Next.js dev server (turbopack)
npm run build        # Production build (ignoreBuildErrors: true in next.config)
npm run lint         # ESLint
npx tsc --noEmit     # Type-check (expect some errors in non-calendar stores)
```

No test runner is configured.

## Architecture

**Next.js 16 App Router** with React 19, fully client-rendered calendar app. Path alias `@/*` → `./src/*`.

### Core Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| State | `src/store/` (~20 Zustand stores) | All runtime state; `useCalendarStore` (view/date nav), `useCalendarEventsStore` (CRUD + recurrence expansion) |
| Persistence | `src/lib/persistence/eventsPersistence.ts` | localStorage under key `lumina_calendar_events_v1` |
| Types | `src/types.ts` | `CalendarEvent`, `EventInstance`, `ViewType`, `RecurrenceRule`, `EventSource`, `EventProvider` |
| Constants | `src/constants.tsx` | `CATEGORIES`, `EVENT_COLORS`, `DAYS`, `MONTHS` |
| Recurrence | `src/lib/recurrence/rruleEngine.ts` | RFC 5545 RRULE via `rrule` library |
| Integrations | `src/lib/integrations/` | Google, Outlook, Apple OAuth + token management |
| Theme | `src/styles/calendarTheme.ts` | Design token system for calendar views |

### View Components

- `src/components/WeekView.tsx` — primary time-grid view
- `src/components/MonthView.tsx` — month grid with overflow popovers
- `src/components/DayView.tsx` — single-day time grid
- `src/components/TimeGridEvent.tsx` — positioned event card (shared by Week/Day)
- `src/components/EventItem.tsx` — event pill for all views (month cells, popovers, lists)

### Provider System

External calendar providers (Google, Outlook, Apple) have brand theming:
- Google: `rgb(52,168,83)` / `#34A853`
- Microsoft: `rgb(0,120,212)` / `#0078D4`
- Apple: `rgb(168,169,176)` / `#A8A9B0`

Provider icons live in `src/components/icons/ProviderIcons.tsx`. Google/Outlook use `<img>` loading from `/svgs/providers/`. Apple is inline SVG with `currentColor`.

**Rule:** External events are read-only — no drag, no edit, no delete. Local events are fully interactive.

### App Shell & Providers

- `src/app/providers.tsx` — wraps app with ThemeProvider, LuminaAuthProvider, CosmeticsProvider, PersistenceBootstrap. Contains a fetch interceptor that stubs `/api/*` calls (except integration routes) for standalone mode.
- `src/app/AppShell.tsx` — layout shell with sidebar, keyboard shortcuts (all Ctrl+key), and view routing.
- `src/components/theme-provider.tsx` — custom theme provider (NOT next-themes). `useTheme()` returns `{ theme, resolvedTheme, setTheme }`.

### Keyboard Shortcuts (all require Ctrl/⌘)

`Ctrl+N` new event, `Ctrl+T` today, `Ctrl+F` find, `Ctrl+M` month, `Ctrl+W` week, `Ctrl+D` day, `Ctrl+Z` undo, `Ctrl+Y` redo, `←/→` prev/next, `↑/↓` scroll, `Esc` close, `Delete` delete event.

### Landing Page

`src/components/landing/` — marketing page with `--lp-*` CSS variable namespace for theming. Uses ClashDisplay font and Reveal animation wrapper.

### Key Conventions

- Event colors: `{ Critical: '#EF4444', Focus: '#6D59E0', Work: '#475569', Social: '#F59E0B', Personal: '#10B981', Health: '#EC4899' }`
- UI primitives: shadcn/ui components in `src/components/ui/` (Radix-based)
- Animations: Framer Motion for page transitions and complex interactions, CSS transitions for event cards
- `TimeGridEvent` uses `contain: layout style paint` for render isolation
- `EventContent` is a separate `React.memo` component with custom equality check
- `next.config.mjs` has `ignoreBuildErrors: true` — some non-calendar stores have type mismatches

### Deployment

Vercel at `bahrawys-calender.vercel.app`. GitHub: `github.com/bahrawyX/bahrawys-calender`.
