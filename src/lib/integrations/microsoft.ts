/**
 * Microsoft Graph (Outlook) OAuth + API helpers.
 *
 * Uses the standard OAuth 2.0 authorization code flow with the
 * Microsoft identity platform (v2.0). Credentials come from env:
 * OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET.
 */

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';
const SCOPES = 'Calendars.Read offline_access';

function getCallbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/api/integrations/microsoft/callback`;
}

/** Build the Microsoft OAuth authorization URL. */
export function getMicrosoftAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID!,
    redirect_uri: getCallbackUrl(),
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    ...(state ? { state } : {}),
  });
  return `${MS_AUTH_URL}?${params.toString()}`;
}

/** Exchange an authorization code for tokens. */
export async function exchangeMicrosoftCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getCallbackUrl(),
      scope: SCOPES,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft token exchange failed: ${err}`);
  }
  return res.json();
}

/** Refresh an expired access token using a refresh token. */
export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft token refresh failed: ${err}`);
  }
  return res.json();
}

/** Fetch the list of calendars from Microsoft Graph. */
export async function fetchMicrosoftCalendarList(accessToken: string) {
  const res = await fetch(`${GRAPH_API}/me/calendars`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Microsoft calendar list failed: ${res.status}`);
  const data = await res.json();
  return (data.value || []).map((cal: any) => ({
    id: cal.id,
    name: cal.name || 'Calendar',
    color: microsoftColorToHex(cal.color) || '#0078D4',
    isPrimary: cal.isDefaultCalendar === true,
  }));
}

export interface MicrosoftCalendarEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName?: string };
  isAllDay?: boolean;
  organizer?: { emailAddress?: { address?: string; name?: string } };
}

/** Fetch events from a specific Microsoft calendar within a date range. */
export async function fetchMicrosoftEvents(
  accessToken: string,
  calendarId: string,
  startDate: string,
  endDate: string,
): Promise<MicrosoftCalendarEvent[]> {
  // Graph API requires RFC 3339 datetime literals with a timezone suffix in $filter.
  // Without 'Z' some tenants reject the query with HTTP 400.
  const filter = `start/dateTime ge '${startDate}T00:00:00Z' and end/dateTime le '${endDate}T23:59:59Z'`;
  const params = new URLSearchParams({
    $filter: filter,
    $orderby: 'start/dateTime',
    $top: '250',
    $select: 'id,subject,bodyPreview,start,end,location,isAllDay,organizer',
  });
  const res = await fetch(
    `${GRAPH_API}/me/calendars/${calendarId}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Microsoft events fetch failed: ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

/** Map Microsoft Graph calendar color names to hex values. */
function microsoftColorToHex(color?: string): string | null {
  const map: Record<string, string> = {
    auto: '#0078D4',
    lightBlue: '#71AFE5',
    lightGreen: '#7BD148',
    lightOrange: '#FFB878',
    lightGray: '#B3B3B3',
    lightYellow: '#FBD75B',
    lightTeal: '#46D6DB',
    lightPink: '#E1A4C1',
    lightBrown: '#C2A07C',
    lightRed: '#FF887C',
    maxColor: '#0078D4',
  };
  return color ? map[color] ?? null : null;
}
