/**
 * bahrawy-calendar/apple — Server-side CalDAV utilities for Apple Calendar.
 *
 * Apple Calendar uses CalDAV which can't be called from the browser (CORS).
 * Use these utilities in your server route (Next.js API route, Express, etc.)
 * to proxy CalDAV requests.
 *
 * Quick setup (Next.js App Router):
 *
 *   // app/api/apple-calendar/route.ts
 *   import { handleAppleCalendarRequest } from 'bahrawy-calendar/apple';
 *
 *   export async function POST(req: Request) {
 *     return handleAppleCalendarRequest(req);
 *   }
 *
 * That's it! Then pass `integrations.apple.proxyUrl = '/api/apple-calendar'`
 * to the BahrawyCalendarProvider.
 */

export {
  handleAppleCalendarRequest,
  validateAppleCredentials,
  fetchAppleCalendarList,
  fetchAppleEvents,
  mapAppleEvents,
} from './caldav';

export type { AppleCredentials, AppleCalendar, AppleEvent } from './caldav';
