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

/** Create a static demo Apple Calendar event for today. */
function createDemoEvent(): CalendarEvent {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return {
    id: 'demo_apple_event_001',
    title: 'Team Standup',
    description: 'Daily team sync — imported from Apple Calendar (demo)',
    date: dateStr,
    startTime: '14:00',
    endTime: '14:45',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: 'FaceTime',
    category: 'External',
    color: '#A2845E', // Apple champagne-titanium
    source: 'apple',
    provider: 'apple',
    readOnly: true,
    editable: false,
    draggable: false,
    organizer: 'Apple Calendar (Demo)',
  };
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

  // Inject demo event on mount
  useEffect(() => {
    const appleConnected = usePlannerStore.getState().appleConnected;
    if (!appleConnected) {
      // Show a demo Apple Calendar event so users can see what external events look like
      setAppleEvents([createDemoEvent()]);
    }
  }, [setAppleEvents]);

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

      // Google
      if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
        const data = await googleRes.value.json();
        if (data.events) {
          setGoogleEvents(data.events.map(mapToCalendarEvent));
        }
      }

      // Microsoft
      if (msRes.status === 'fulfilled' && msRes.value.ok) {
        const data = await msRes.value.json();
        if (data.events) {
          setOutlookEvents(data.events.map(mapToCalendarEvent));
        }
      }

      // Apple
      if (appleRes.status === 'fulfilled' && appleRes.value.ok) {
        const data = await appleRes.value.json();
        if (data.events && data.events.length > 0) {
          setAppleEvents(data.events.map(mapToCalendarEvent));
        }
      } else {
        // Keep demo event if Apple not connected
        const appleConnected = usePlannerStore.getState().appleConnected;
        if (!appleConnected) {
          setAppleEvents([createDemoEvent()]);
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
