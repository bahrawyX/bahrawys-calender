'use client';

/**
 * useIntegrations — handles Google Calendar + Outlook OAuth flows and event fetching.
 *
 * Loads auth libraries lazily from CDN (zero bundle-size cost if unused).
 * Tokens are persisted in localStorage so users stay connected across sessions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CalendarEvent } from '../types';
import type { IntegrationsConfig, IntegrationsContextValue, IntegrationState } from './types';

// ── Storage keys ───────────────────────────────────────────────────────────
const GOOGLE_TOKEN_KEY = 'bahrawy_google_token';
const OUTLOOK_TOKEN_KEY = 'bahrawy_outlook_token';

// ── Script loading ─────────────────────────────────────────────────────────

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// ── Token helpers ──────────────────────────────────────────────────────────

function saveToken(key: string, state: IntegrationState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch { /* quota error */ }
}

function loadToken(key: string): IntegrationState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntegrationState;
    // If expired, clear it
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearToken(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ok */ }
}

// ── Google Calendar event conversion ───────────────────────────────────────

interface GoogleCalendarItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  organizer?: { email?: string };
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ uri?: string; entryPointType?: string }> };
}

function googleEventToCalendar(item: GoogleCalendarItem): CalendarEvent | null {
  if (item.status === 'cancelled') return null;

  const startDt = item.start?.dateTime ?? item.start?.date;
  const endDt = item.end?.dateTime ?? item.end?.date;
  if (!startDt) return null;

  const startDate = new Date(startDt);
  const endDate = endDt ? new Date(endDt) : new Date(startDate.getTime() + 3600000);

  const date = startDate.toISOString().split('T')[0];
  const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  // Find meeting link
  let meetingUrl = item.hangoutLink;
  if (!meetingUrl && item.conferenceData?.entryPoints) {
    const video = item.conferenceData.entryPoints.find((e) => e.entryPointType === 'video');
    meetingUrl = video?.uri;
  }

  return {
    id: `google_${item.id}`,
    title: item.summary ?? '(No title)',
    description: item.description ?? '',
    date,
    startTime,
    endTime,
    timezone: item.start?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: item.location,
    category: 'default',
    color: '#4285F4', // Google blue
    source: 'google',
    provider: 'google',
    editable: false,
    readOnly: true,
    draggable: false,
    meetingLink: meetingUrl ? { url: meetingUrl, provider: 'Meet' } : undefined,
    organizer: item.organizer?.email,
  };
}

// ── Outlook event conversion ───────────────────────────────────────────────

interface OutlookCalendarItem {
  id: string;
  subject?: string;
  body?: { content?: string };
  location?: { displayName?: string };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isCancelled?: boolean;
  organizer?: { emailAddress?: { address?: string } };
  onlineMeeting?: { joinUrl?: string };
  onlineMeetingUrl?: string;
}

function outlookEventToCalendar(item: OutlookCalendarItem): CalendarEvent | null {
  if (item.isCancelled) return null;

  const startDt = item.start?.dateTime;
  if (!startDt) return null;

  // Outlook Graph API returns local time without timezone offset
  const startDate = new Date(startDt + 'Z');
  const endDate = item.end?.dateTime
    ? new Date(item.end.dateTime + 'Z')
    : new Date(startDate.getTime() + 3600000);

  const date = startDate.toISOString().split('T')[0];
  const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  const meetingUrl = item.onlineMeeting?.joinUrl ?? item.onlineMeetingUrl;

  return {
    id: `outlook_${item.id}`,
    title: item.subject ?? '(No title)',
    description: item.body?.content ?? '',
    date,
    startTime,
    endTime,
    timezone: item.start?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: item.location?.displayName,
    category: 'default',
    color: '#0078D4', // Outlook blue
    source: 'outlook',
    provider: 'outlook',
    editable: false,
    readOnly: true,
    draggable: false,
    outlookId: item.id,
    meetingLink: meetingUrl ? { url: meetingUrl, provider: 'Teams' } : undefined,
    organizer: item.organizer?.emailAddress?.address,
  };
}

// ── Date range helpers ─────────────────────────────────────────────────────

function getDateRange(): { timeMin: string; timeMax: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0); // 2 months range
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

// ── Google fetch ───────────────────────────────────────────────────────────

async function fetchGoogleEvents(accessToken: string): Promise<CalendarEvent[]> {
  const { timeMin, timeMax } = getDateRange();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '500',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error('TOKEN_EXPIRED');
    throw new Error(`Google API error: ${res.status}`);
  }

  const data = await res.json();
  const items: GoogleCalendarItem[] = data.items ?? [];
  return items.map(googleEventToCalendar).filter(Boolean) as CalendarEvent[];
}

// ── Outlook fetch ──────────────────────────────────────────────────────────

async function fetchOutlookEvents(accessToken: string): Promise<CalendarEvent[]> {
  const { timeMin, timeMax } = getDateRange();
  const params = new URLSearchParams({
    startDateTime: timeMin,
    endDateTime: timeMax,
    $top: '500',
    $orderby: 'start/dateTime',
    $select: 'id,subject,body,location,start,end,isCancelled,organizer,onlineMeeting,onlineMeetingUrl',
  });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error('TOKEN_EXPIRED');
    throw new Error(`Outlook API error: ${res.status}`);
  }

  const data = await res.json();
  const items: OutlookCalendarItem[] = data.value ?? [];
  return items.map(outlookEventToCalendar).filter(Boolean) as CalendarEvent[];
}

// ── Main hook ──────────────────────────────────────────────────────────────

export function useIntegrations(
  config?: IntegrationsConfig,
): {
  googleEvents: CalendarEvent[];
  outlookEvents: CalendarEvent[];
  integrations: IntegrationsContextValue;
} {
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [outlookEvents, setOutlookEvents] = useState<CalendarEvent[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOutlookLoading, setIsOutlookLoading] = useState(false);

  const googleConfigRef = useRef(config?.google);
  const outlookConfigRef = useRef(config?.outlook);
  googleConfigRef.current = config?.google;
  outlookConfigRef.current = config?.outlook;

  // ── Google: Connect ────────────────────────────────────────────────────

  const connectGoogle = useCallback(async () => {
    const cfg = googleConfigRef.current;
    if (!cfg) return;

    await loadScript('https://accounts.google.com/gsi/client', 'google-gsi');

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      throw new Error('Google Identity Services failed to load');
    }

    return new Promise<void>((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: cfg.clientId,
        scope: (cfg.scopes ?? ['https://www.googleapis.com/auth/calendar.readonly']).join(' '),
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          const tokenState: IntegrationState = {
            accessToken: response.access_token,
            expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          };
          saveToken(GOOGLE_TOKEN_KEY, tokenState);
          setIsGoogleConnected(true);

          // Fetch events immediately
          try {
            setIsGoogleLoading(true);
            const events = await fetchGoogleEvents(tokenState.accessToken);
            setGoogleEvents(events);
          } catch {
            // Will retry on next mount
          } finally {
            setIsGoogleLoading(false);
          }

          resolve();
        },
      });

      client.requestAccessToken();
    });
  }, []);

  const disconnectGoogle = useCallback(() => {
    clearToken(GOOGLE_TOKEN_KEY);
    setGoogleEvents([]);
    setIsGoogleConnected(false);

    // Revoke token if possible
    const google = (window as any).google;
    const saved = loadToken(GOOGLE_TOKEN_KEY);
    if (google?.accounts?.oauth2 && saved?.accessToken) {
      google.accounts.oauth2.revoke(saved.accessToken);
    }
  }, []);

  // ── Outlook: Connect ──────────────────────────────────────────────────

  const connectOutlook = useCallback(async () => {
    const cfg = outlookConfigRef.current;
    if (!cfg) return;

    await loadScript(
      'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js',
      'msal-browser',
    );

    const msal = (window as any).msal;
    if (!msal?.PublicClientApplication) {
      throw new Error('MSAL browser failed to load');
    }

    const msalConfig = {
      auth: {
        clientId: cfg.clientId,
        authority: `https://login.microsoftonline.com/${cfg.tenantId ?? 'common'}`,
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    };

    const msalInstance = new msal.PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    const scopes = cfg.scopes ?? ['Calendars.Read'];

    try {
      const loginResponse = await msalInstance.loginPopup({ scopes });

      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes,
        account: loginResponse.account,
      });

      const tokenState: IntegrationState = {
        accessToken: tokenResponse.accessToken,
        expiresAt: tokenResponse.expiresOn
          ? new Date(tokenResponse.expiresOn).getTime()
          : Date.now() + 3600000,
      };
      saveToken(OUTLOOK_TOKEN_KEY, tokenState);
      setIsOutlookConnected(true);

      // Fetch events immediately
      try {
        setIsOutlookLoading(true);
        const events = await fetchOutlookEvents(tokenState.accessToken);
        setOutlookEvents(events);
      } catch {
        // Will retry on next mount
      } finally {
        setIsOutlookLoading(false);
      }
    } catch (error: any) {
      if (error.errorCode === 'user_cancelled') return;
      throw error;
    }
  }, []);

  const disconnectOutlook = useCallback(() => {
    clearToken(OUTLOOK_TOKEN_KEY);
    setOutlookEvents([]);
    setIsOutlookConnected(false);
  }, []);

  // ── Auto-fetch on mount if tokens exist ───────────────────────────────

  useEffect(() => {
    if (!config?.google) return;

    const token = loadToken(GOOGLE_TOKEN_KEY);
    if (!token) return;

    setIsGoogleConnected(true);
    setIsGoogleLoading(true);

    fetchGoogleEvents(token.accessToken)
      .then(setGoogleEvents)
      .catch(() => {
        // Token expired or invalid — clear it
        clearToken(GOOGLE_TOKEN_KEY);
        setIsGoogleConnected(false);
      })
      .finally(() => setIsGoogleLoading(false));
  }, [config?.google]);

  useEffect(() => {
    if (!config?.outlook) return;

    const token = loadToken(OUTLOOK_TOKEN_KEY);
    if (!token) return;

    setIsOutlookConnected(true);
    setIsOutlookLoading(true);

    fetchOutlookEvents(token.accessToken)
      .then(setOutlookEvents)
      .catch(() => {
        clearToken(OUTLOOK_TOKEN_KEY);
        setIsOutlookConnected(false);
      })
      .finally(() => setIsOutlookLoading(false));
  }, [config?.outlook]);

  // ── Build context value ───────────────────────────────────────────────

  const integrations: IntegrationsContextValue = {
    connectGoogle: config?.google ? connectGoogle : undefined,
    disconnectGoogle: config?.google ? disconnectGoogle : undefined,
    isGoogleConnected,
    isGoogleLoading,

    connectOutlook: config?.outlook ? connectOutlook : undefined,
    disconnectOutlook: config?.outlook ? disconnectOutlook : undefined,
    isOutlookConnected,
    isOutlookLoading,
  };

  return { googleEvents, outlookEvents, integrations };
}
