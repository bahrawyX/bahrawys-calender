# Bahrawy's Calendar

A standalone, feature-rich calendar application built with Next.js, Tailwind CSS, and Framer Motion. Extracted from the [Lumina](https://github.com/bahrawyX/lumina) productivity suite.

## Features

- **Month / Week / Day views** with smooth animated transitions
- **Drag-and-drop** event rescheduling
- **Recurring events** (daily, weekly, monthly, yearly) with full RFC 5545 support
- **Google Calendar, Outlook & Apple Calendar integration** via OAuth 2.0 / CalDAV
- **Calendar filters** to toggle external calendars on/off
- **Mobile-first responsive** design with swipe navigation
- **Dark/Light theme** support
- **Focus mode** to surface only critical events
- **Keyboard shortcuts** (N=new, T=today, M/W/D=views, Ctrl+Z=undo)
- **localStorage persistence** (no backend required for local events)

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript 5
- **Tailwind CSS 3.4**
- **Framer Motion 12**
- **Zustand 5** (state management)
- **Radix UI** (accessible primitives)

## Getting Started

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

Apple Calendar uses CalDAV instead of OAuth -- no API keys needed! To connect:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and navigate to **Sign-In and Security** > **App-Specific Passwords**
3. Generate a new app-specific password (name it "Lumina Calendar" or similar)
4. In the app, click **Apple Calendar** in the sidebar and enter your Apple ID email + the generated password
5. Your iCloud calendars will sync automatically

## License

MIT
