'use client';

/**
 * useExternalSync
 *
 * Syncs events from connected external providers (Google Calendar,
 * Outlook, Apple Calendar) into the planner store. Mirrors the original
 * Lumina useOutlookSync hook but works with the standalone cookie-based
 * token store instead of a database backend.
 *
 * - Fetches events on mount and when the visible date range changes
 * - Polls every 10 minutes in the background
 * - Listens for `lumina:external-sync-now` custom events for forced sync
 * - Re-fetches on tab focus (debounced to 30s)
 * - Injects a static demo event so users can see external events before connecting
 */
import { useEffect, useRef, useCallback } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { CalendarEvent } from '@/types';

const POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes
const FOCUS_DEBOUNCE = 30 * 1000; // 30 seconds

/** Compute a padded date range around the current view for prefetching. */
function getDateRange(currentDate: Date): { start: string; end: string } {
  const d = new Date(currentDate);
  // Fetch 2 months around the current date for smooth navigation
  const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 2, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/** Map API response to CalendarEvent format. */
function mapToCalendarEvent(e: any): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: e.date,
    startTime: e.startTime || '',
    endTime: e.endTime || '',
    timezone: e.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: e.location,
    category: 'External',
    color: e.color || '#6D59E0',
    source: e.source,
    provider: e.provider,
    readOnly: true,
    editable: false,
    draggable: false,
    organizer: e.organizer,
  };
}

/** Format YYYY-MM-DD for a date offset (in days) from today. */
function offsetDateStr(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Demo Apple events — one today, plus a second one same day to demo "+N more" overflow. */
function createAppleDemoEvents(): CalendarEvent[] {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = offsetDateStr(0);

  return [
    {
      id: 'demo_apple_event_001',
      title: 'Dummy (Apple) — Team Standup',
      description: 'Daily team sync — imported from Apple Calendar (demo)',
      date: today,
      startTime: '09:00',
      endTime: '09:30',
      timezone: tz,
      location: 'FaceTime',
      category: 'External',
      color: '#A8A9B0',
      source: 'apple',
      provider: 'apple',
      readOnly: true,
      editable: false,
      draggable: false,
      organizer: 'Apple Calendar (Demo)',
    },
    // Second event same day → triggers "+1 more" chip on Month view (which caps at 1 per cell).
    {
      id: 'demo_apple_event_002',
      title: 'Dummy Test Event',
      description: 'Second event on the same day so the +1 more chip appears.',
      date: today,
      startTime: '15:00',
      endTime: '15:45',
      timezone: tz,
      location: 'iCloud',
      category: 'External',
      color: '#A8A9B0',
      source: 'apple',
      provider: 'apple',
      readOnly: true,
      editable: false,
      draggable: false,
      organizer: 'Apple Calendar (Demo)',
    },
  ];
}

/** Demo Google event — tomorrow. */
function createGoogleDemoEvents(): CalendarEvent[] {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [
    {
      id: 'demo_google_event_001',
      title: 'Dummy (Google) — Design Review',
      description: 'Quarterly design review — imported from Google Calendar (demo)',
      date: offsetDateStr(1),
      startTime: '11:00',
      endTime: '12:00',
      timezone: tz,
      location: 'Google Meet',
      category: 'External',
      color: '#34A853',
      source: 'google',
      provider: 'google',
      readOnly: true,
      editable: false,
      draggable: false,
      organizer: 'Google Calendar (Demo)',
    },
  ];
}

/** Demo Outlook event — two days from now. */
function createOutlookDemoEvents(): CalendarEvent[] {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [
    {
      id: 'demo_outlook_event_001',
      title: 'Dummy (Outlook) — Client Sync',
      description: 'Weekly client sync — imported from Outlook (demo)',
      date: offsetDateStr(2),
      startTime: '13:30',
      endTime: '14:30',
      timezone: tz,
      location: 'Microsoft Teams',
      category: 'External',
      color: '#0078D4',
      source: 'outlook',
      provider: 'microsoft',
      readOnly: true,
      editable: false,
      draggable: false,
      organizer: 'Outlook (Demo)',
    },
  ];
}

export function useExternalSync() {
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setGoogleEvents = usePlannerStore((s) => s.setGoogleEvents);
  const setOutlookEvents = usePlannerStore((s) => s.setOutlookEvents);
  const setAppleEvents = usePlannerStore((s) => s.setAppleEvents);
  const setIsSyncing = usePlannerStore((s) => s.setIsSyncing);
  const setSyncError = usePlannerStore((s) => s.setSyncError);
  const setLastSyncedAt = usePlannerStore((s) => s.setLastSyncedAt);

  const lastFocusSyncRef = useRef(0);
  const lastRangeRef = useRef('');

  // Inject one demo event per provider on mount so users can see what external
  // events look like before connecting (and so the "+N more" overflow chip is
  // demonstrable in the Month view).
  useEffect(() => {
    const state = usePlannerStore.getState();
    if (!state.appleConnected) setAppleEvents(createAppleDemoEvents());
    if (!state.googleConnected) setGoogleEvents(createGoogleDemoEvents());
    if (!state.outlookConnected) setOutlookEvents(createOutlookDemoEvents());
  }, [setAppleEvents, setGoogleEvents, setOutlookEvents]);

  const syncEvents = useCallback(async () => {
    const range = getDateRange(currentDate);
    setIsSyncing(true);
    setSyncError(null);

    try {
      // Fetch from all providers in parallel
      const [googleRes, msRes, appleRes] = await Promise.allSettled([
        fetch(`/api/external-events/google?start=${range.start}&end=${range.end}`),
        fetch(`/api/external-events/microsoft?start=${range.start}&end=${range.end}`),
        fetch(`/api/external-events/apple?start=${range.start}&end=${range.end}`),
      ]);

      const state = usePlannerStore.getState();

      // Google
      if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
        const data = await googleRes.value.json();
        if (data.events && data.events.length > 0) {
          setGoogleEvents(data.events.map(mapToCalendarEvent));
        } else if (!state.googleConnected) {
          setGoogleEvents(createGoogleDemoEvents());
        }
      } else if (!state.googleConnected) {
        setGoogleEvents(createGoogleDemoEvents());
      }

      // Microsoft / Outlook
      if (msRes.status === 'fulfilled' && msRes.value.ok) {
        const data = await msRes.value.json();
        if (data.events && data.events.length > 0) {
          setOutlookEvents(data.events.map(mapToCalendarEvent));
        } else if (!state.outlookConnected) {
          setOutlookEvents(createOutlookDemoEvents());
        }
      } else if (!state.outlookConnected) {
        setOutlookEvents(createOutlookDemoEvents());
      }

      // Apple
      if (appleRes.status === 'fulfilled' && appleRes.value.ok) {
        const data = await appleRes.value.json();
        if (data.events && data.events.length > 0) {
          setAppleEvents(data.events.map(mapToCalendarEvent));
        } else if (!state.appleConnected) {
          setAppleEvents(createAppleDemoEvents());
        }
      } else {
        // Keep demo events if Apple not connected
        if (!state.appleConnected) {
          setAppleEvents(createAppleDemoEvents());
        }
      }

      setLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      console.error('[useExternalSync] Sync error:', err);
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [currentDate, setGoogleEvents, setOutlookEvents, setAppleEvents, setIsSyncing, setSyncError, setLastSyncedAt]);

  // Sync on mount and when date range changes
  useEffect(() => {
    const range = getDateRange(currentDate);
    const rangeKey = `${range.start}:${range.end}`;
    if (rangeKey === lastRangeRef.current) return;
    lastRangeRef.current = rangeKey;
    syncEvents();
  }, [currentDate, syncEvents]);

  // Poll every 10 minutes
  useEffect(() => {
    const id = setInterval(syncEvents, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [syncEvents]);

  // Re-sync on tab focus (debounced)
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusSyncRef.current > FOCUS_DEBOUNCE) {
        lastFocusSyncRef.current = now;
        syncEvents();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncEvents]);

  // Listen for forced sync events (dispatched after connect/disconnect)
  useEffect(() => {
    const handler = () => syncEvents();
    window.addEventListener('lumina:external-sync-now', handler);
    return () => window.removeEventListener('lumina:external-sync-now', handler);
  }, [syncEvents]);
}
