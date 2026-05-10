'use client';

import React from 'react';
import { useCalendarEventsStore } from '../store/useCalendarEventsStore';
import { useDragStore } from '../store/useDragStore';
import { EVENT_COLORS } from '../constants';
import { formatTime } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface DragGhostProps {
    dayKeys: string[]; // e.g. ["2026-02-15"] for DayView or 7 days for WeekView
}

const DragGhost: React.FC<DragGhostProps> = ({ dayKeys }) => {
    const { dragState, finalizeCommitAnimation } = useDragStore();
    const events = useCalendarEventsStore(s => s.events);

    // Unmount if totally inactive
    if (!dragState.isDragging && !dragState.commit) return null;

    const eventId = dragState.draggedEventId;
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const color = EVENT_COLORS[event.category] || '#7C5CFC';

    const isCommitting = dragState.commit?.isCommitting ?? false;
    const activeState = dragState.preview || dragState.origin;
    if (!activeState) return null;

    const dayIndex = dayKeys.indexOf(activeState.dayKey);
    // If dragged outside visible range, still render it tracking the pointer purely by topPx,
    // but we can just cap it or fade it out. For simplicity, hide it if completely off-grid.
    const isVisibleDay = dayIndex !== -1;

    if (!isVisibleDay && !isCommitting) return null;

    const numCols = Math.max(1, dayKeys.length);
    const baseLeftPct = isVisibleDay ? (dayIndex / numCols) * 100 : 0;

    const colIndex = (activeState as any).columnIndex ?? 0;
    const colCount = (activeState as any).columnCount ?? 1;

    const widthPctWithinDay = 100 / colCount;
    const leftPctWithinDay = (colIndex / colCount) * 100;

    const finalWidthPct = widthPctWithinDay / numCols;
    const finalLeftPct = baseLeftPct + (leftPctWithinDay / numCols);

    // Pointer's raw CSS position during drag, or snapped grid position during commit
    const currentTop = isCommitting
        ? ((activeState.startMin / 60) * 80) // snapped destination
        : (dragState.preview?.topPx ?? ((activeState.startMin / 60) * 80)); // raw pointer

    const currentLeft = isCommitting && dragState.commit?.fromLeftPx !== undefined
        ? `calc(${finalLeftPct}% + 3px)` // snapped dest (we use finalLeftPct directly)
        : `calc(${finalLeftPct}% + 3px)`; // width/left transition is usually fine via CSS

    const currentWidth = `calc(${finalWidthPct}% - 6px)`;
    const durationMin = (activeState as any).durationMin ?? (activeState.endMin - activeState.startMin);
    const heightPx = (durationMin / 60) * 80;

    // The 'from' values for the FLIP animation
    const initialTop = dragState.commit?.fromTopPx ?? currentTop;

    const animationVariants = {
        dragging: {
            top: initialTop,
            left: currentLeft,
            width: currentWidth,
            height: heightPx,
            opacity: 0.9,
            scale: 1.02,
            boxShadow: '0 20px 48px -12px rgba(0,0,0,0.15), 0 8px 16px -8px rgba(0,0,0,0.08)',
            transition: {
                duration: 0,
                scale: { duration: 0.15, ease: 'easeOut' },
                opacity: { duration: 0.15 }
            }
        },
        committing: {
            top: ((activeState.startMin / 60) * 80), // snapped top
            left: currentLeft,
            width: currentWidth,
            height: heightPx,
            opacity: 0,
            scale: 1.0,
            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
            transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
        }
    };

    const pad = (n: number) => String(n).padStart(2, '0');
    const startH = Math.floor(activeState.startMin / 60);
    const startM = activeState.startMin % 60;
    const endH = Math.floor(activeState.endMin / 60);
    const endM = activeState.endMin % 60;
    const timeLabel = `${formatTime(`${pad(startH)}:${pad(startM)}`)} – ${formatTime(`${pad(endH)}:${pad(endM)}`)}`;

    return (
        <motion.div
            initial="dragging"
            animate={isCommitting ? "committing" : "dragging"}
            variants={animationVariants}
            onAnimationComplete={(definition) => {
                if (definition === "committing") {
                    finalizeCommitAnimation();
                }
            }}
            className="absolute rounded-xl overflow-hidden pointer-events-none z-[100] flex flex-col gap-0.5"
            style={{
                backgroundColor: `${color}f0`, // solid, heavily opaque glass
                borderLeft: `3px solid ${color}`,
                borderTop: `1px solid ${color}40`,
                borderRight: `1px solid ${color}40`,
                borderBottom: `1px solid ${color}40`,
                padding: '6px 8px',
                willChange: 'transform, top, left',
            }}
        >
            <div className="flex items-start justify-between gap-1 overflow-hidden">
                <h4 className="font-bold text-white drop-shadow-sm leading-tight break-words text-[11px] overflow-hidden">
                    {event.title}
                </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
                    {timeLabel}
                </span>
            </div>
        </motion.div>
    );
};

export default DragGhost;
