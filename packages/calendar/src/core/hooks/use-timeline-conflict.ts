/**
 * useTimelineConflict — hook for managing the conflict detection flow.
 * Handles the dialog → sheet transition and event list management.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import type { EventInstance } from '../../types';
import { timeToMinutes } from '../utils/time-utils';
import { minutesToHHMM } from '../engine/slot-engine';

export interface TimelineConflictSelection {
  dateISO: string;
  clickedMinute: number;
}

interface StartConflictOptions {
  dateISO: string;
  clickedMinute: number;
  overlappingEvents: EventInstance[];
}

export function useTimelineConflict() {
  const [selectedTime, setSelectedTime] = useState<TimelineConflictSelection | null>(null);
  const [conflictEvents, setConflictEvents] = useState<EventInstance[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const startConflictFlow = useCallback((options: StartConflictOptions) => {
    const sorted = [...options.overlappingEvents].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );

    setSelectedTime({
      dateISO: options.dateISO,
      clickedMinute: options.clickedMinute,
    });
    setConflictEvents(sorted);
    setIsSheetOpen(false);
    setIsDialogOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsDialogOpen(false);
    setIsSheetOpen(false);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const openSheetFromDialog = useCallback(() => {
    setIsDialogOpen(false);
    setIsSheetOpen(true);
  }, []);

  const removeConflictEvent = useCallback((eventId: string) => {
    setConflictEvents((prev) => {
      const next = prev.filter((event) => event.id !== eventId);
      if (next.length === 0) {
        setIsDialogOpen(false);
        setIsSheetOpen(false);
      }
      return next;
    });
  }, []);

  const selectedTimeLabel = useMemo(() => {
    if (!selectedTime) return '';
    const date = new Date(`${selectedTime.dateISO}T00:00:00`);
    const weekday = date.toLocaleDateString([], { weekday: 'long' });
    return `${weekday} • ${minutesToHHMM(selectedTime.clickedMinute)}`;
  }, [selectedTime]);

  return {
    selectedTime,
    selectedTimeLabel,
    conflictEvents,
    isDialogOpen,
    isSheetOpen,
    setIsDialogOpen,
    setIsSheetOpen,
    startConflictFlow,
    closeDialog,
    openSheetFromDialog,
    closeAll,
    removeConflictEvent,
  };
}
