/**
 * Apple Calendar CalDAV utilities — server-side only.
 *
 * Handles the full CalDAV protocol for iCloud Calendar:
 * - Credential validation via PROPFIND
 * - Calendar discovery
 * - Event fetching with time-range filtering
 * - iCalendar → CalendarEvent conversion
 */

const CALDAV_BASE = 'https://caldav.icloud.com';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AppleCredentials {
  email: string;
  appPassword: string;
}

export interface AppleCalendar {
  id: string;
  name: string;
  color: string;
  url: string;
}

export interface AppleEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  location?: string;
  allDay: boolean;
}

// ── XML parsing helpers ────────────────────────────────────────────────────

function authHeader(creds: AppleCredentials): string {
  const encoded = Buffer.from(`${creds.email}:${creds.appPassword}`).toString('base64');
  return `Basic ${encoded}`;
}

function xmlVal(xml: string, tag: string): string | null {
  const patterns = [
    new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
  ];
  for (const re of patterns) {
    const m = xml.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function extractResponses(xml: string): string[] {
  const re = /<(?:\w+:)?response\b[^>]*>([\s\S]*?)<\/(?:\w+:)?response>/gi;
  const results: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1]);
  }
  return results;
}

function unfoldICS(icsData: string): string {
  return icsData.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function icsDateToISO(icsDate: string): string {
  if (icsDate.length === 8) {
    return `${icsDate.slice(0, 4)}-${icsDate.slice(4, 6)}-${icsDate.slice(6, 8)}`;
  }
  const d = icsDate.replace('Z', '');
  if (d.length >= 15) {
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const time = `${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}`;
    return `${date}T${time}${icsDate.endsWith('Z') ? 'Z' : ''}`;
  }
  return icsDate;
}

function parseVEvents(icsData: string): AppleEvent[] {
  const events: AppleEvent[] = [];
  const unfolded = unfoldICS(icsData);
  const veventBlocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) || [];

  for (const block of veventBlocks) {
    const getField = (name: string): string => {
      const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'mi');
      const m = block.match(re);
      return m ? m[1].trim() : '';
    };

    const uid = getField('UID');
    const summary = getField('SUMMARY');
    const description = getField('DESCRIPTION');
    const dtstart = getField('DTSTART');
    const dtend = getField('DTEND');
    const location = getField('LOCATION');

    if (!uid || !dtstart) continue;

    const allDay = !dtstart.includes('T');

    events.push({
      uid,
      summary: summary || '(No title)',
      description: description || undefined,
      dtstart,
      dtend: dtend || dtstart,
      location: location || undefined,
      allDay,
    });
  }

  return events;
}

// ── Core CalDAV functions ──────────────────────────────────────────────────

/**
 * Validate Apple credentials by making a PROPFIND request.
 * Returns the principal URL if valid.
 */
export async function validateAppleCredentials(creds: AppleCredentials): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`;

  const res = await fetch(CALDAV_BASE, {
    method: 'PROPFIND',
    headers: {
      Authorization: authHeader(creds),
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '0',
    },
    body,
  });

  if (res.status === 401) {
    throw new Error('Invalid Apple ID or app-specific password');
  }
  if (!res.ok && res.status !== 207) {
    throw new Error(`CalDAV discovery failed: ${res.status}`);
  }

  const xml = await res.text();
  const principalBlock = xmlVal(xml, 'current-user-principal');
  const principal = principalBlock ? xmlVal(principalBlock, 'href') : null;
  if (!principal) {
    throw new Error('Could not discover CalDAV principal URL');
  }
  return principal;
}

async function discoverCalendarHome(
  creds: AppleCredentials,
  principalUrl: string,
): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set/>
  </D:prop>
</D:propfind>`;

  const url = principalUrl.startsWith('http') ? principalUrl : `${CALDAV_BASE}${principalUrl}`;

  const res = await fetch(url, {
    method: 'PROPFIND',
    headers: {
      Authorization: authHeader(creds),
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '0',
    },
    body,
  });

  if (!res.ok && res.status !== 207) {
    throw new Error(`Calendar home discovery failed: ${res.status}`);
  }

  const xml = await res.text();
  const homeSet = xmlVal(xml, 'calendar-home-set');
  if (!homeSet) throw new Error('Could not discover calendar-home-set');
  const href = xmlVal(homeSet, 'href');
  return href || homeSet;
}

/**
 * Fetch the list of calendars from iCloud.
 */
export async function fetchAppleCalendarList(
  creds: AppleCredentials,
): Promise<AppleCalendar[]> {
  const principalUrl = await validateAppleCredentials(creds);
  const homeUrl = await discoverCalendarHome(creds, principalUrl);

  const body = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:A="http://apple.com/ns/ical/" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <A:calendar-color/>
    <CS:getctag/>
  </D:prop>
</D:propfind>`;

  const url = homeUrl.startsWith('http') ? homeUrl : `${CALDAV_BASE}${homeUrl}`;

  const res = await fetch(url, {
    method: 'PROPFIND',
    headers: {
      Authorization: authHeader(creds),
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1',
    },
    body,
  });

  if (!res.ok && res.status !== 207) {
    throw new Error(`Calendar list fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const responses = extractResponses(xml);
  const calendars: AppleCalendar[] = [];

  for (const resp of responses) {
    if (!resp.match(/<(?:\w+:)?calendar\s*\/>/i)) continue;

    const href = xmlVal(resp, 'href') || '';
    const name = xmlVal(resp, 'displayname') || 'Calendar';
    let color = xmlVal(resp, 'calendar-color') || '#FF3B30';

    // Apple returns #RRGGBBAA — strip alpha
    if (color.length === 9 && color.startsWith('#')) {
      color = color.substring(0, 7);
    }

    calendars.push({
      id: href,
      name,
      color,
      url: href.startsWith('http') ? href : `${CALDAV_BASE}${href}`,
    });
  }

  return calendars;
}

/**
 * Fetch events from an Apple Calendar within a date range.
 */
export async function fetchAppleEvents(
  creds: AppleCredentials,
  calendarUrl: string,
  startDate: string,
  endDate: string,
): Promise<AppleEvent[]> {
  const start = startDate.replace(/-/g, '') + 'T000000Z';
  const end = endDate.replace(/-/g, '') + 'T235959Z';

  const body = `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${start}" end="${end}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  const url = calendarUrl.startsWith('http') ? calendarUrl : `${CALDAV_BASE}${calendarUrl}`;

  const res = await fetch(url, {
    method: 'REPORT',
    headers: {
      Authorization: authHeader(creds),
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1',
    },
    body,
  });

  if (!res.ok && res.status !== 207) {
    throw new Error(`CalDAV event fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const responses = extractResponses(xml);
  const allEvents: AppleEvent[] = [];

  for (const resp of responses) {
    const calData = xmlVal(resp, 'calendar-data');
    if (!calData) continue;
    allEvents.push(...parseVEvents(calData));
  }

  return allEvents;
}

/**
 * Convert raw Apple CalDAV events to the CalendarEvent format.
 */
export function mapAppleEvents(
  events: AppleEvent[],
  calendarColor = '#FF3B30',
): Array<{
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  color: string;
  category: string;
  source: 'apple';
  provider: 'apple';
  readOnly: boolean;
  editable: boolean;
  draggable: boolean;
}> {
  return events.map((e) => {
    const startISO = icsDateToISO(e.dtstart);
    const endISO = icsDateToISO(e.dtend);

    const startDate = new Date(startISO);
    const endDate = new Date(endISO);

    const datePart = startISO.split('T')[0] || startISO;

    return {
      id: `apple_${e.uid}`,
      title: e.summary,
      description: e.description || '',
      date: datePart,
      startTime: e.allDay
        ? '00:00'
        : `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      endTime: e.allDay
        ? '23:59'
        : `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: e.location,
      color: calendarColor,
      category: 'default',
      source: 'apple' as const,
      provider: 'apple' as const,
      readOnly: true,
      editable: false,
      draggable: false,
    };
  });
}

// ── All-in-one request handler ─────────────────────────────────────────────

/**
 * Drop-in request handler for your API route. Handles connect + fetch-events.
 *
 * Usage (Next.js App Router):
 *   import { handleAppleCalendarRequest } from 'bahrawy-calendar/apple';
 *   export async function POST(req: Request) {
 *     return handleAppleCalendarRequest(req);
 *   }
 *
 * Usage (Express):
 *   import { handleAppleCalendarRequest } from 'bahrawy-calendar/apple';
 *   app.post('/api/apple-calendar', (req, res) => {
 *     // Convert Express req to a standard Request
 *     handleAppleCalendarRequest(new Request(url, { method: 'POST', body: JSON.stringify(req.body) }))
 *       .then(response => response.json().then(data => res.json(data)));
 *   });
 */
export async function handleAppleCalendarRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { action, email, appPassword, startDate, endDate } = body;

    if (!email || !appPassword) {
      return Response.json({ error: 'Missing email or appPassword' }, { status: 400 });
    }

    const creds: AppleCredentials = { email, appPassword };

    if (action === 'connect') {
      // Validate credentials
      await validateAppleCredentials(creds);
      return Response.json({ success: true });
    }

    if (action === 'fetch-events') {
      if (!startDate || !endDate) {
        return Response.json({ error: 'Missing startDate or endDate' }, { status: 400 });
      }

      // Discover calendars and fetch events from all of them
      const calendars = await fetchAppleCalendarList(creds);
      const allEvents: ReturnType<typeof mapAppleEvents> = [];

      for (const cal of calendars) {
        const rawEvents = await fetchAppleEvents(creds, cal.url, startDate, endDate);
        const mapped = mapAppleEvents(rawEvents, cal.color);
        allEvents.push(...mapped);
      }

      return Response.json({ events: allEvents, calendars });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    const status = err.message?.includes('Invalid Apple') ? 401 : 500;
    return Response.json({ error: err.message ?? 'Internal error' }, { status });
  }
}
