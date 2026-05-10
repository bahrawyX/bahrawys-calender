'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, isToday } from 'date-fns';
import Link from 'next/link';
import { useTaskBoardStore } from '@/store/useTaskBoardStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useDailyBriefStore } from '@/store/useDailyBriefStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { CoinsBadge } from '@/components/coins/CoinsBadge';

// ── Tiny inline icons (12px) ──────────────────────────────────────────────

const CalIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="2" x2="9" y2="6" /><line x1="15" y1="2" x2="15" y2="6" />
  </svg>
);

const TargetIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const FlameIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c1 4-2 7-2 10a4 4 0 0 0 8 0c0-3-1-4-2-6-1 2-3 3-4 3s1-4 0-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const ClockIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Chip ───────────────────────────────────────────────────────────────────

interface ChipProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent?: string; // tailwind text color for icon
  href?: string;
}

const Chip: React.FC<ChipProps> = ({ icon, value, label, accent = 'text-muted-foreground', href }) => {
  const inner = (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`opacity-70 ${accent}`}>{icon}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-muted-foreground/70">{label}</span>
    </span>
  );
  if (href) {
    return (
      <Link href={href} className="hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.05] px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-md transition-colors">
        {inner}
      </Link>
    );
  }
  return inner;
};

// ── Strip ──────────────────────────────────────────────────────────────────

export const DailyBriefStrip: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Tasks
  const tasks = useTaskBoardStore(s => s.tasks);
  const focusSessions = useFocusStore(s => s.sessionHistory);

  // Goals
  const goals = useGoalsStore(s => s.goals);
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active').length, [goals]);

  // Streak
  const dailyStreak = useStreakStore(s => s.dailyStreak);

  // Brief (meetings + focus window)
  const brief = useDailyBriefStore(s => s.brief);
  const fetchBrief = useDailyBriefStore(s => s.fetchBrief);
  const timezone = useCalendarStore(s => s.timezone);

  useEffect(() => {
    const lastFetched = useDailyBriefStore.getState().lastFetched;
    const today = format(new Date(), 'yyyy-MM-dd');
    if ((!lastFetched || !lastFetched.startsWith(today)) && !useDailyBriefStore.getState().isLoading) {
      fetchBrief(timezone);
    }
  }, [timezone, fetchBrief]);

  const stats = useMemo(() => {
    const root = tasks.filter(t => !t.parentTaskId);
    const dueToday = root.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'done').length;
    const completedToday = root.filter(t => t.status === 'done' && isToday(new Date(t.updatedAt))).length;
    const focusMin = focusSessions
      .filter(s => isToday(new Date(s.startTime)))
      .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
    return { dueToday, completedToday, focusMin };
  }, [tasks, focusSessions]);

  const meetingText = brief
    ? (brief.eventCount === 0 ? 'No meetings' : `${brief.eventCount} meeting${brief.eventCount !== 1 ? 's' : ''}`)
    : null;
  const focusText = brief?.bestFocusWindow
    ? `${brief.bestFocusWindow.startTime}–${brief.bestFocusWindow.endTime}`
    : null;

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-3 mb-1 flex-shrink-0 px-4 py-1.5 overflow-x-auto no-scrollbar text-[11px] rounded-2xl border border-border/60 bg-card shadow-card">
      {/* Greeting + date */}
      <span className="font-semibold text-foreground whitespace-nowrap">
        {getGreeting()}
        <span className="font-normal text-muted-foreground"> · {format(new Date(), 'EEE, MMM d')}</span>
      </span>

      <span className="w-px h-4 bg-border/60 flex-shrink-0" />

      {/* Key numbers */}
      {meetingText && <Chip icon={<CalIcon />} value={brief!.eventCount} label={brief!.eventCount === 0 ? 'meetings' : `meeting${brief!.eventCount !== 1 ? 's' : ''}`} />}

      {focusText && <Chip icon={<ClockIcon />} value={focusText} label="focus" accent="text-primary" />}

      {stats.dueToday > 0 && <Chip icon={<CheckIcon />} value={stats.dueToday} label="due" href="/tasks" />}

      <CoinsBadge variant="chip" />

      {activeGoals > 0 && <Chip icon={<TargetIcon />} value={activeGoals} label={activeGoals === 1 ? 'goal' : 'goals'} accent="text-emerald-500" href="/goals" />}

      {dailyStreak > 0 && <Chip icon={<FlameIcon />} value={dailyStreak} label="streak" accent="text-amber-500" />}

      {stats.completedToday > 0 && <Chip icon={<CheckIcon />} value={stats.completedToday} label="done today" accent="text-emerald-500" />}
    </div>
  );
};
