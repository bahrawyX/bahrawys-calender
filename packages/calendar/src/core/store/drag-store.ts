/**
 * Drag Store — isolated state for pointer-move drag-and-drop.
 *
 * Keeping drag state separate means only the active views subscribe to
 * pointer-move updates. The rest of the app is unaffected.
 */

import { create } from 'zustand';
import type { DragState } from '../../types';
import type { DragStoreState, CalendarEventsState } from './types';

const HOUR_HEIGHT = 80;

const EMPTY_DRAG: DragState = {
  isDragging: false,
  draggedEventId: null,
  origin: null,
  preview: null,
  pointer: null,
  commit: null,
};

/**
 * Create a drag store that commits moves to the given events store.
 */
export function createDragStore(
  getEventsStore: () => CalendarEventsState,
) {
  return create<DragStoreState>((set, get) => ({
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
              dayKey: origin.dayKey,
              startMin: origin.startMin,
              endMin: origin.endMin,
              topPx: (origin.startMin / 60) * HOUR_HEIGHT,
              heightPx: (origin.durationMin / 60) * HOUR_HEIGHT,
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
            preview: { ...preview, startMin, endMin },
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

      getEventsStore().moveEvent(
        dragState.draggedEventId,
        dragState.preview.dayKey,
        newStart,
        newEnd,
      );
    },

    finalizeCommitAnimation: () => set({ dragState: { ...EMPTY_DRAG } }),
    cancelDrag: () => set({ dragState: { ...EMPTY_DRAG } }),
  }));
}
