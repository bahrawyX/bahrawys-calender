import { create } from 'zustand';
import type { DragState } from '../types';
import { useCalendarEventsStore } from './useCalendarEventsStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DragStoreState {
  dragState: DragState;
  startDrag: (
    eventId: string,
    pointerId: number | null,
    offsetYPx: number,
    origin: NonNullable<DragState['origin']>,
  ) => void;
  updateDragPreview: (preview: NonNullable<DragState['preview']>) => void;
  commitDrag: (flipOrigin?: { top: number; left: number; width: number }) => void;
  finalizeCommitAnimation: () => void;
  cancelDrag: () => void;
}

const EMPTY_DRAG: DragState = {
  isDragging: false,
  draggedEventId: null,
  origin: null,
  preview: null,
  pointer: null,
  commit: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────
//
// Keeping drag state isolated here means only DayView, WeekView, and DragGhost
// subscribe to this store. The rest of the app (Sidebar, MonthView, etc.) is
// completely unaffected by pointer-move updates during a drag.

export const useDragStore = create<DragStoreState>((set, get) => ({
  dragState: { ...EMPTY_DRAG },

  startDrag: (eventId, pointerId, offsetYPx, origin) =>
    set((state) => {
      if (state.dragState.isDragging) return state;

      return {
        dragState: {
          isDragging: true,
          draggedEventId: eventId,
          origin,
          preview: {
            // Initial preview matches the event's current position exactly
            dayKey: origin.dayKey,
            startMin: origin.startMin,
            endMin: origin.endMin,
            topPx: (origin.startMin / 60) * 80, // 80 = HOUR_HEIGHT
            heightPx: (origin.durationMin / 60) * 80,
            columnIndex: 0,
            columnCount: 1,
          },
          pointer: { pointerId, offsetYWithinEventPx: offsetYPx },
          commit: null,
        },
      };
    }),

  updateDragPreview: (preview) =>
    set((state) => {
      if (!state.dragState.isDragging) return state;

      const startMin = Math.max(0, Math.min(preview.startMin, 1439));
      const endMin = Math.max(startMin + 1, Math.min(preview.endMin, 1440));

      return {
        dragState: {
          ...state.dragState,
          preview: {
            ...preview,
            startMin,
            endMin,
          },
        },
      };
    }),

  commitDrag: (flipOrigin) => {
    const { dragState } = get();
    if (!dragState.isDragging || !dragState.preview || !dragState.draggedEventId) return;
    if (dragState.commit?.isCommitting) return;

    const clampMin = (v: number) => Math.max(0, Math.min(v, 1439));
    const previewStart = clampMin(dragState.preview.startMin);
    const previewEnd = Math.max(previewStart + 1, Math.min(dragState.preview.endMin, 1440));

    const pad = (n: number) => String(n).padStart(2, '0');
    const startH = Math.floor(previewStart / 60);
    const startM = previewStart % 60;
    const endH = Math.floor(previewEnd / 60);
    const endM = previewEnd % 60;
    const newStart = `${pad(startH)}:${pad(startM)}`;
    const newEnd = `${pad(endH)}:${pad(endM)}`;

    // Enter commit animation phase BEFORE mutating the event so the ghost
    // stays visible during the FLIP transition.
    set((state) => ({
      dragState: {
        ...state.dragState,
        isDragging: false,
        commit: {
          isCommitting: true,
          fromTopPx: flipOrigin?.top ?? state.dragState.preview?.topPx,
          fromLeftPx: flipOrigin?.left,
          fromWidthPx: flipOrigin?.width,
        },
      },
    }));

    useCalendarEventsStore.getState().moveEvent(
      dragState.draggedEventId,
      dragState.preview.dayKey,
      newStart,
      newEnd,
    );
  },

  finalizeCommitAnimation: () => set({ dragState: { ...EMPTY_DRAG } }),
  cancelDrag: () => set({ dragState: { ...EMPTY_DRAG } }),
}));
