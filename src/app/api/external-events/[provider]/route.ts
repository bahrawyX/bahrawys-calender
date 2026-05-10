import { NextRequest, NextResponse } from 'next/server';
import { getTokens, setTokens } from '@/lib/integrations/tokenStore';
import {
  fetchGoogleEvents,
  fetchGoogleCalendarList,
  refreshGoogleToken,
} from '@/lib/integrations/google';
import {
  fetchMicrosoftEvents,
  fetchMicrosoftCalendarList,
  refreshMicrosoftToken,
} from '@/lib/integrations/microsoft';
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

interface ExternalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  color: string;
  source: 'google' | 'microsoft';
  provider: 'google' | 'microsoft';
  readOnly: boolean;
  organizer?: string;
}

/**
 * GET /api/external-events/[provider]?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Fetches events from the specified provider within the date range.
 * Automatically refreshes expired access tokens.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start/end query params' }, { status: 400 });
  }

  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  try {
    const tokens = await getTokens(provider);
    if (!tokens) {
      return NextResponse.json({ events: [], error: 'Not connected' }, { status: 401 });
    }

    let accessToken = tokens.accessToken;

    // Refresh if expired
    if (tokens.expiresAt < Date.now() && tokens.refreshToken) {
      try {
        if (provider === 'google') {
          const refreshed = await refreshGoogleToken(tokens.refreshToken);
          accessToken = refreshed.access_token;
          await setTokens('google', {
            ...tokens,
            accessToken: refreshed.access_token,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
          });
        } else {
          const refreshed = await refreshMicrosoftToken(tokens.refreshToken);
          accessToken = refreshed.access_token;
          await setTokens('microsoft', {
            ...tokens,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
          });
        }
      } catch (err) {
        console.error(`[external-events/${provider}] Token refresh failed:`, err);
        return NextResponse.json({ events: [], error: 'Token refresh failed' }, { status: 401 });
      }
    }

    const filtersState = await getFiltersState();
    const events: ExternalEvent[] = [];

    if (provider === 'google') {
      const calendars = await fetchGoogleCalendarList(accessToken);
      for (const cal of calendars) {
        const filterId = `google:${cal.id}`;
        if (filtersState[filterId] === false) continue;

        const googleEvents = await fetchGoogleEvents(accessToken, cal.id, start, end);
        for (const ge of googleEvents) {
          if (ge.status === 'cancelled') continue;
          const startDt = ge.start.dateTime || ge.start.date || '';
          const endDt = ge.end.dateTime || ge.end.date || '';
          const dateObj = new Date(startDt);
          const endObj = new Date(endDt);

          events.push({
            id: `google_${ge.id}`,
            title: ge.summary || '(No title)',
            description: ge.description || '',
            date: dateObj.toISOString().split('T')[0],
            startTime: ge.start.dateTime
              ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
              : '',
            endTime: ge.end.dateTime
              ? `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`
              : '',
            timezone: ge.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            location: ge.location,
            color: cal.color,
            source: 'google',
            provider: 'google',
            readOnly: true,
            organizer: ge.organizer?.displayName || ge.organizer?.email,
          });
        }
      }
    } else {
      // Microsoft
      const calendars = await fetchMicrosoftCalendarList(accessToken);
      for (const cal of calendars) {
        const filterId = `microsoft:${cal.id}`;
        if (filtersState[filterId] === false) continue;

        const msEvents = await fetchMicrosoftEvents(accessToken, cal.id, start, end);
        for (const me of msEvents) {
          const startDt = new Date(me.start.dateTime + 'Z');
          const endDt = new Date(me.end.dateTime + 'Z');

          events.push({
            id: `ms_${me.id}`,
            title: me.subject || '(No title)',
            description: me.bodyPreview || '',
            date: startDt.toISOString().split('T')[0],
            startTime: me.isAllDay
              ? ''
              : `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`,
            endTime: me.isAllDay
              ? ''
              : `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`,
            timezone: me.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            location: me.location?.displayName,
            color: cal.color,
            source: 'microsoft',
            provider: 'microsoft',
            readOnly: true,
            organizer: me.organizer?.emailAddress?.name || me.organizer?.emailAddress?.address,
          });
        }
      }
    }

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error(`[external-events/${provider}] Error:`, err);
    return NextResponse.json({ events: [], error: err.message }, { status: 500 });
  }
}
