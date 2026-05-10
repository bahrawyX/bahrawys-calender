import React from 'react';
import type { Task, TaskDifficulty } from '../../types/task';
import type { PlannedTaskItem } from '../../store/useDailyPlanStore';
import { formatTimeRange, durationMinutes, formatMinutes } from '../../utils/dailyPlanUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface PlannedTaskCardProps {
  planItem: PlannedTaskItem;
  task: Task | undefined;
  onRemove: (planItemId: string) => void;
  onMarkDone?: (taskId: string) => void;
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
  isDragging?: boolean;
  /** Number of subtasks (shown as badge) */
  subtaskCount?: number;
}

const DIFF_STYLE: Record<TaskDifficulty, string> = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  hard: 'text-destructive bg-destructive/10',
};
const DIFF_LABEL: Record<TaskDifficulty, string> = { easy: 'E', medium: 'M', hard: 'H' };

const GripIcon: React.FC = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30">
    <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const PlannedTaskCard: React.FC<PlannedTaskCardProps> = React.memo(({ planItem, task, onRemove, onMarkDone, onDragHandlePointerDown, isDragging, subtaskCount }) => {
  const durmins = durationMinutes(planItem.startTime, planItem.endTime);
  const timeLabel = formatTimeRange(planItem.startTime, planItem.endTime);
  const isDone = task?.status === 'done';

  // Compact mode for short slots (< 45 min)
  const isCompact = durmins < 45;

  return (
    <div
      onPointerDown={onDragHandlePointerDown}
      className={`group relative flex items-stretch rounded-xl select-none h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isDragging
          ? 'shadow-card-lift scale-[1.02] ring-1 ring-primary/25 bg-card'
          : 'shadow-card hover:-translate-y-[1px] hover:shadow-card-hover bg-card'
        }
        ${isDone ? 'opacity-60' : ''}`}
    >
      {/* Left accent bar */}
      <div className={`w-[3px] flex-shrink-0 rounded-l-xl transition-colors ${
        isDone ? 'bg-emerald-500' : 'bg-primary/60'
      }`} />

      {/* Content area */}
      <div className="flex items-start gap-1.5 px-2 py-1.5 flex-1 min-w-0">
        {/* Checkbox */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { if (task?.id) onMarkDone?.(task.id); }}
          disabled={!task?.id}
          className={`mt-[2px] flex-shrink-0 w-[14px] h-[14px] rounded-[4px] border transition-colors flex items-center justify-center ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-border hover:border-primary/50 hover:bg-primary/5 text-transparent hover:text-primary/40'
          }`}
          aria-label={isDone ? 'Mark task as not done' : 'Mark task as done'}
        >
          <CheckIcon />
        </button>

        {/* Grip */}
        <div className="mt-[3px] flex-shrink-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <GripIcon />
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          {isCompact ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className={`text-[11px] font-medium leading-tight truncate cursor-default ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {task?.title ?? <span className="text-muted-foreground/40 italic">Deleted task</span>}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {task?.title ?? 'Deleted task'} &middot; {timeLabel} ({formatMinutes(durmins)})
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              <p className={`text-[12px] font-medium leading-tight truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {task?.title ?? <span className="text-muted-foreground/40 italic">Deleted task</span>}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">{timeLabel}</span>
                <span className="text-[10px] text-muted-foreground/30">&middot;</span>
                <span className="text-[10px] text-muted-foreground/50">{formatMinutes(durmins)}</span>
                {task?.difficulty && (
                  <>
                    <span className="text-[10px] text-muted-foreground/30">&middot;</span>
                    <span className={`text-[9px] font-semibold px-1 py-px rounded ${DIFF_STYLE[task.difficulty]}`}>
                      {DIFF_LABEL[task.difficulty]}
                    </span>
                  </>
                )}
                {subtaskCount != null && subtaskCount > 0 && (
                  <>
                    <span className="text-[10px] text-muted-foreground/30">&middot;</span>
                    <span className="text-[9px] text-muted-foreground/50 bg-muted/60 px-1 py-px rounded">
                      {subtaskCount} sub
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(planItem.id)}
          className="mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Remove from plan"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
});

PlannedTaskCard.displayName = 'PlannedTaskCard';
