import { NextResponse } from 'next/server';
import { getTokens, setTokens, isConnected } from '@/lib/integrations/tokenStore';
import { fetchGoogleCalendarList, refreshGoogleToken } from '@/lib/integrations/google';
import { fetchMicrosoftCalendarList, refreshMicrosoftToken } from '@/lib/integrations/microsoft';
import { fetchAppleCalendarList, type AppleCredentials } from '@/lib/integrations/apple';
import { cookies } from 'next/headers';

interface CalendarFilter {
  id: string;
  provider: 'google' | 'microsoft' | 'apple';
  name: string;
  color: string;
  enabled: boolean;
  isPrimary: boolean;
}

const FILTERS_COOKIE = 'int_cal_filters';

/** Read the saved filter state from a cookie. */
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

/** Persist filter state to a cookie. */
async function setFiltersState(filters: Record<string, boolean>): Promise<void> {
  const jar = await cookies();
  jar.set(FILTERS_COOKIE, JSON.stringify(filters), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * GET /api/integrations/calendars
 *
 * Returns the list of external calendars across all connected providers,
 * each with an `enabled` boolean the user can toggle.
 */
export async function GET() {
  try {
    const calendars: CalendarFilter[] = [];
    const filtersState = await getFiltersState();

    // Google
    if (await isConnected('google')) {
      const tokens = await getTokens('google');
      if (tokens) {
        let accessToken = tokens.accessToken;
        // Refresh if expired — re-persist the new token so future requests don't re-refresh
        if (tokens.expiresAt < Date.now() && tokens.refreshToken) {
          try {
            const refreshed = await refreshGoogleToken(tokens.refreshToken);
            accessToken = refreshed.access_token;
            await setTokens('google', {
              ...tokens,
              accessToken: refreshed.access_token,
              expiresAt: Date.now() + refreshed.expires_in * 1000,
            });
          } catch {
            // Token refresh failed — skip Google
          }
        }
        try {
          const googleCals = await fetchGoogleCalendarList(accessToken);
          for (const cal of googleCals) {
            const filterId = `google:${cal.id}`;
            calendars.push({
              id: filterId,
              provider: 'google',
              name: cal.name,
              color: cal.color,
              enabled: filtersState[filterId] !== false, // default to enabled
              isPrimary: cal.isPrimary,
            });
          }
        } catch (err) {
          console.error('[calendars] Google calendar list error:', err);
        }
      }
    }

    // Microsoft
    if (await isConnected('microsoft')) {
      const tokens = await getTokens('microsoft');
      if (tokens) {
        let accessToken = tokens.accessToken;
        if (tokens.expiresAt < Date.now() && tokens.refreshToken) {
          try {
            const refreshed = await refreshMicrosoftToken(tokens.refreshToken);
            accessToken = refreshed.access_token;
            await setTokens('microsoft', {
              ...tokens,
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
              expiresAt: Date.now() + refreshed.expires_in * 1000,
            });
          } catch {
            // Token refresh failed — skip Microsoft
          }
        }
        try {
          const msCals = await fetchMicrosoftCalendarList(accessToken);
          for (const cal of msCals) {
            const filterId = `microsoft:${cal.id}`;
            calendars.push({
              id: filterId,
              provider: 'microsoft',
              name: cal.name,
              color: cal.color,
              enabled: filtersState[filterId] !== false,
              isPrimary: cal.isPrimary,
            });
          }
        } catch (err) {
          console.error('[calendars] Microsoft calendar list error:', err);
        }
      }
    }

    // Apple Calendar
    if (await isConnected('apple')) {
      const tokens = await getTokens('apple');
      if (tokens) {
        try {
          const creds = JSON.parse(tokens.accessToken) as AppleCredentials;
          const appleCals = await fetchAppleCalendarList(creds);
          for (const cal of appleCals) {
            const filterId = `apple:${cal.id}`;
            calendars.push({
              id: filterId,
              provider: 'apple',
              name: cal.name,
              color: cal.color,
              enabled: filtersState[filterId] !== false,
              isPrimary: false,
            });
          }
        } catch (err) {
          console.error('[calendars] Apple calendar list error:', err);
        }
      }
    }

    return NextResponse.json(calendars);
  } catch (err: any) {
    console.error('[integrations/calendars] Error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
