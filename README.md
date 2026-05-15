# Bahrawy's Calendar

A keyboard-first, beautifully animated calendar for React. Three views (Month / Week / Day), drag-and-drop, recurring events (RFC 5545), Google / Outlook / Apple Calendar overlays, conflict detection, and localStorage persistence — all in one package.

## Use as an npm package

```bash
npm install bahrawy-calendar zustand date-fns
```

```tsx
import { BahrawyCalendarProvider, useCalendarContext } from 'bahrawy-calendar';

function App() {
  return (
    <BahrawyCalendarProvider>
      <MyCalendar />
    </BahrawyCalendarProvider>
  );
}
```

Scaffold the UI components (shadcn-style, fully customizable):

```bash
npx bahrawy-calendar-cli init
```

See the full docs in [`packages/calendar/README.md`](./packages/calendar/README.md).

---

## Features

- **Month / Week / Day views** with smooth animated transitions
- **Drag-and-drop** event rescheduling with FLIP animations
- **Recurring events** (daily, weekly, monthly, yearly) with full RFC 5545 support
- **Google Calendar, Outlook & Apple Calendar integration** via OAuth 2.0 / CalDAV
- **Conflict detection** with visual indicators and detail sheets
- **Keyboard shortcuts** (N=new, T=today, M/W/D=views, Ctrl+Z=undo)
- **Pluggable persistence** — localStorage default, bring your own Supabase/Firebase adapter
- **Theme system** — CSS variables (`--bc-*`) and Tailwind class tokens
- **Dark/Light theme** support
- **TypeScript-first** — full type exports for all APIs

## Tech Stack

- **React 18/19** + TypeScript 5
- **Zustand 4/5** (state management)
- **date-fns 3/4** (date utilities)
- **Tailwind CSS** + **shadcn/ui** (UI primitives)
- **Framer Motion** (animations)
- **rrule** (optional — recurrence engine)

## Monorepo Structure

```
packages/calendar/    → bahrawy-calendar (npm package — core logic)
packages/cli/         → bahrawy-calendar-cli (scaffolding CLI)
templates/            → UI component templates (copied by CLI)
```

## Running the Demo App

This repo also contains a full Next.js demo app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000/calendar](http://localhost:3000/calendar).

## External Calendar Integrations

To connect Google Calendar or Outlook, copy `.env.example` to `.env.local` and fill in your OAuth credentials:

```bash
cp .env.example .env.local
```

Then set:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` from [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
- `INTEGRATION_SECRET` (run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `NEXT_PUBLIC_APP_URL` (your deployment URL)

### Apple Calendar (iCloud)

Apple Calendar uses CalDAV instead of OAuth — no API keys needed! To connect:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and navigate to **Sign-In and Security** > **App-Specific Passwords**
3. Generate a new app-specific password
4. In the app, click **Apple Calendar** in the sidebar and enter your Apple ID email + the generated password
5. Your iCloud calendars will sync automatically

## License

MIT
