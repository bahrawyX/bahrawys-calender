/**
 * Apple Calendar (iCloud) CalDAV helpers.
 *
 * Uses CalDAV protocol with Basic authentication.
 * Users must generate an app-specific password at
 * https://appleid.apple.com → Sign-In and Security → App-Specific Passwords.
 *
 * No OAuth — credentials (Apple ID email + app-specific password) are
 * stored in the same encrypted cookie system as other providers.
 */

const CALDAV_BASE = 'https://caldav.icloud.com';

export interface AppleCredentials {
  email: string;
  appPassword: string;
}

/** Build a Basic auth header from Apple credentials. */
function authHeader(creds: AppleCredentials): string {
  const encoded = Buffer.from(`${creds.email}:${creds.appPassword}`).toString('base64');
  return `Basic ${encoded}`;
}

/** Extract a simple value from an XML tag (non-greedy). */
function xmlVal(xml: string, tag: string): string | null {
  // Handle namespaced tags like D:href, C:calendar-data
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

/** Extract all occurrences of a value from XML. */
function xmlValAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'gi');
  const results: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

/** Extract all <response> blocks from a multistatus response. */
function extractResponses(xml: string): string[] {
  const re = /<(?:\w+:)?response\b[^>]*>([\s\S]*?)<\/(?:\w+:)?response>/gi;
  const results: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1]);
  }
  return results;
}

/**
 * Validate credentials by making a PROPFIND request to iCloud CalDAV.
 * Returns the principal URL if valid, throws on failure.
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
  // iCloud's multistatus has multiple <href> tags; the first is the request path ("/").
  // We must extract the href that is *inside* <current-user-principal>, not the first one.
  const principalBlock = xmlVal(xml, 'current-user-principal');
  const principal = principalBlock ? xmlVal(principalBlock, 'href') : null;
  if (!principal) {
    throw new Error('Could not discover CalDAV principal URL');
  }
  return principal;
}

/**
 * Discover the calendar home URL from the principal URL.
 */
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

  const url = principalUrl.startsWith('http')
    ? principalUrl
    : `${CALDAV_BASE}${principalUrl}`;

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
  // Find the calendar-home-set href
  const homeSet = xmlVal(xml, 'calendar-home-set');
  if (!homeSet) {
    throw new Error('Could not discover calendar-home-set');
  }
  const href = xmlVal(homeSet, 'href');
  return href || homeSet;
}

export interface AppleCalendar {
  id: string;
  name: string;
  color: string;
  url: string;
}

/**
 * Fetch the list of calendars from iCloud CalDAV.
 */
export async function fetchAppleCalendarList(
  creds: AppleCredentials,
): Promise<AppleCalendar[]> {
  try {
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

    const url = homeUrl.startsWith('http')
      ? homeUrl
      : `${CALDAV_BASE}${homeUrl}`;

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
      // Only include calendar resources (has <calendar/> in resourcetype)
      if (!resp.match(/<(?:\w+:)?calendar\s*\/>/i)) continue;

      const href = xmlVal(resp, 'href') || '';
      const name = xmlVal(resp, 'displayname') || 'Calendar';
      let color = xmlVal(resp, 'calendar-color') || '#FF3B30';

      // Apple returns colors as #RRGGBBAA — strip alpha
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
  } catch (err) {
    console.error('[apple] Calendar list error:', err);
    return [];
  }
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

/**
 * Unfold iCalendar line continuations per RFC 5545 §3.1.
 * Lines longer than 75 octets are folded with CRLF + SPACE/TAB.
 * Without unfolding, long SUMMARY/UID/DESCRIPTION values get silently truncated.
 */
function unfoldICS(icsData: string): string {
  return icsData.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

/**
 * Parse VEVENT components from iCalendar data.
 */
function parseVEvents(icsData: string): AppleEvent[] {
  const events: AppleEvent[] = [];
  const unfolded = unfoldICS(icsData);
  const veventBlocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) || [];

  for (const block of veventBlocks) {
    const getField = (name: string): string => {
      // Matches: NAME:value  OR  NAME;PARAM=x;...:value
      // The colon that precedes the value may come after any number of ;PARAM=x segments.
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

    // Detect all-day events (DATE format: YYYYMMDD vs DATETIME: YYYYMMDDTHHmmss)
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

/**
 * Convert iCalendar datetime string to ISO string.
 * Handles: 20260510T140000, 20260510T140000Z, 20260510
 */
function icsDateToISO(icsDate: string): string {
  // All-day: YYYYMMDD
  if (icsDate.length === 8) {
    return `${icsDate.slice(0, 4)}-${icsDate.slice(4, 6)}-${icsDate.slice(6, 8)}`;
  }
  // DateTime: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const d = icsDate.replace('Z', '');
  if (d.length >= 15) {
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const time = `${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}`;
    return `${date}T${time}${icsDate.endsWith('Z') ? 'Z' : ''}`;
  }
  return icsDate;
}

/**
 * Fetch events from an Apple Calendar within a date range using CalDAV REPORT.
 */
export async function fetchAppleEvents(
  creds: AppleCredentials,
  calendarUrl: string,
  startDate: string,
  endDate: string,
): Promise<AppleEvent[]> {
  // Format dates for CalDAV (YYYYMMDDTHHMMSSZ)
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

  const url = calendarUrl.startsWith('http')
    ? calendarUrl
    : `${CALDAV_BASE}${calendarUrl}`;

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
    const events = parseVEvents(calData);
    allEvents.push(...events);
  }

  return allEvents;
}

/**
 * Convert raw Apple events to the common external event format
 * used by the external-events API.
 */
export function mapAppleEvents(
  events: AppleEvent[],
  calendarColor: string,
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
  source: 'apple';
  provider: 'apple';
  readOnly: boolean;
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
        ? ''
        : `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      endTime: e.allDay
        ? ''
        : `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: e.location,
      color: calendarColor,
      source: 'apple' as const,
      provider: 'apple' as const,
      readOnly: true,
    };
  });
}
