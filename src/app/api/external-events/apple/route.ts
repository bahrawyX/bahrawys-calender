import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/integrations/tokenStore';
import {
  fetchAppleCalendarList,
  fetchAppleEvents,
  mapAppleEvents,
  type AppleCredentials,
} from '@/lib/integrations/apple';
import { cookies } from 'next/headers';

const FILTERS_COOKIE = 'int_cal_filters';

async function getFiltersState(): Promise<Record<string, boolean>> {
  const jar = await cookies();
  const raw = jar.get(FILTERS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * GET /api/external-events/apple?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Fetches events from Apple Calendar (iCloud) via CalDAV.
 */
export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start/end query params' }, { status: 400 });
  }

  try {
    const tokens = await getTokens('apple');
    if (!tokens) {
      return NextResponse.json({ events: [], error: 'Not connected' }, { status: 401 });
    }

    let creds: AppleCredentials;
    try {
      creds = JSON.parse(tokens.accessToken) as AppleCredentials;
    } catch {
      return NextResponse.json({ events: [], error: 'Invalid stored credentials' }, { status: 401 });
    }

    const filtersState = await getFiltersState();
    const calendars = await fetchAppleCalendarList(creds);

    const allEvents: ReturnType<typeof mapAppleEvents> = [];

    for (const cal of calendars) {
      const filterId = `apple:${cal.id}`;
      if (filtersState[filterId] === false) continue;

      try {
        const events = await fetchAppleEvents(creds, cal.url, start, end);
        const mapped = mapAppleEvents(events, cal.color);
        allEvents.push(...mapped);
      } catch (err) {
        console.error(`[external-events/apple] Error fetching from ${cal.name}:`, err);
      }
    }

    return NextResponse.json({ events: allEvents });
  } catch (err: any) {
    console.error('[external-events/apple] Error:', err);
    return NextResponse.json({ events: [], error: err.message }, { status: 500 });
  }
}
