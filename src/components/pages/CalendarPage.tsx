'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { ViewType } from '@/types';
import { MONTHS } from '@/constants';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useCalendarEventsStore } from '@/store/useCalendarEventsStore';
import { useCalendar } from '@/hooks/useCalendar';
import MonthView from '@/components/MonthView';
import WeekView from '@/components/WeekView';
import DayView from '@/components/DayView';
import MobileCalendar from '@/components/calendar/mobile/MobileCalendar';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { DailyBriefStrip } from '@/components/dashboard/DailyBriefStrip';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  ChevronLeftIcon, ChevronRightIcon, UndoIcon, RedoIcon,
  SearchIcon, SparkIcon as ZapIcon, MonthIcon as LayoutGridIcon,
  WeekIcon as CalendarRangeIcon, DayIcon as CalendarDaysIcon
} from '@/components/icons';

const CalendarPage: React.FC = () => {
  // Per-field selectors to avoid re-rendering on every store update.
  const storedView      = useCalendarStore((s) => s.view);
  const setView         = useCalendarStore((s) => s.setView);
  const currentDate     = useCalendarStore((s) => s.currentDate);
  const setCurrentDate  = useCalendarStore((s) => s.setCurrentDate);
  const isFocusMode     = useCalendarStore((s) => s.isFocusMode);
  const setFocusMode    = useCalendarStore((s) => s.setFocusMode);
  const searchQuery     = useCalendarStore((s) => s.searchQuery);
  const setSearchQuery  = useCalendarStore((s) => s.setSearchQuery);
  const undo = useCalendarEventsStore((s) => s.undo);
  const redo = useCalendarEventsStore((s) => s.redo);

  const { filteredInstances } = useCalendar();
  const [navDirection, setNavDirection] = useState<number>(0);

  // Week-view 7-column grid is unreadable at ~58px/col on a 412px mobile
  // viewport. On mobile we transparently render Day view while keeping the
  // user's stored preference intact. The view-switcher tabs are also hidden
  // on mobile — day nav is the only affordance on that breakpoint.
  const isMobile = useIsMobile();
  const view = isMobile && storedView === ViewType.WEEK ? ViewType.DAY : storedView;

  const navigate = useCallback((dir: number) => {
    setNavDirection(dir);
    const next = new Date(currentDate);
    if (view === ViewType.MONTH) next.setMonth(next.getMonth() + dir);
    else if (view === ViewType.WEEK) next.setDate(next.getDate() + (dir * 7));
    else next.setDate(next.getDate() + dir);
    setCurrentDate(next);
  }, [view, currentDate, setCurrentDate]);

  // Animation variants for both view changes and date navigation
  const getAnimationVariants = () => {
    // When navigating dates within the same view
    if (navDirection !== 0) {
      return {
        initial: { opacity: 0, x: navDirection > 0 ? 30 : -30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: navDirection > 0 ? -30 : 30 },
      };
    }
    // When changing views
    return {
      initial: { opacity: 0, y: 10, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.98 },
    };
  };

  const animationVariants = getAnimationVariants();

  // Reset navDirection when view changes
  useEffect(() => {
    setNavDirection(0);
  }, [view]);

  // Mobile: render the native-iOS-style two-panel layout instead of the
  // desktop header + view stack. Desktop markup below is untouched.
  if (isMobile) {
    return <MobileCalendar />;
  }

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-1.5 md:mb-2 lg:mb-2 gap-2 md:gap-3 lg:gap-4 px-2 lg:px-4 py-1 md:py-1.5 flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-6 lg:gap-5 flex-wrap">
          {/* View-switcher — hidden on mobile where Day view is forced */}
          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="hidden md:block">
            <TabsList className="h-9" data-tutorial="cal-view-tabs">
              <TabsTrigger value={ViewType.MONTH} className="text-xs gap-1.5">
                <LayoutGridIcon size={14} className="opacity-70" />
                Month
              </TabsTrigger>
              <TabsTrigger value={ViewType.WEEK} className="text-xs gap-1.5">
                <CalendarRangeIcon size={14} className="opacity-70" />
                Week
              </TabsTrigger>
              <TabsTrigger value={ViewType.DAY} className="text-xs gap-1.5">
                <CalendarDaysIcon size={14} className="opacity-70" />
                Day
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <motion.h2
            key={`${view}-${currentDate.getTime()}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-display text-xl md:text-3xl font-medium tracking-[-0.035em] text-foreground leading-none"
          >
            {view === ViewType.DAY ? (
              <> {MONTHS[currentDate.getMonth()]} <span className="text-muted-foreground/40 font-light">{currentDate.getDate()}</span> </>
            ) : (
              <> {MONTHS[currentDate.getMonth()]} <span className="text-muted-foreground/40 font-light">{currentDate.getFullYear()}</span> </>
            )}
          </motion.h2>
        </div>

        <div className="flex items-center gap-2 md:gap-3 lg:gap-2 flex-wrap justify-end">
          <div className="relative hidden sm:flex items-center">
            <SearchIcon size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-36 focus:w-52 transition-all duration-200 text-xs"
            />
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isFocusMode ? 'default' : 'outline'}
                size="icon"
                onClick={() => setFocusMode(!isFocusMode)}
                aria-label="Toggle Focus Mode (F)"
                className={isFocusMode ? 'bg-primary hover:bg-primary/90' : ''}
              >
                <ZapIcon size={16} className={isFocusMode ? 'text-white' : ''} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Focus Mode (F)</TooltipContent>
          </Tooltip>

          <ThemeToggle />
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={undo} aria-label="Undo (Ctrl+Z)">
                  <UndoIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={redo} aria-label="Redo (Ctrl+Shift+Z)">
                  <RedoIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="rounded-none border-r border-border h-9" 
              aria-label="Previous"
            >
              <ChevronLeftIcon size={16} />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setNavDirection(0);
                setCurrentDate(new Date());
              }} 
              className="rounded-none h-9 px-3 text-xs font-semibold"
            >
              Today
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(1)} 
              className="rounded-none border-l border-border h-9" 
              aria-label="Next"
            >
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* Daily brief strip removed in standalone calendar */}

      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/*
          View-switching used to live inside <AnimatePresence mode="wait"> with
          a 0.3s transition, meaning the outgoing grid had to finish its exit
          animation before the incoming grid even mounted. Together with the
          synchronous per-day useMemo work in WeekView (eventsByDay /
          overlapMaps / hourOccupancyMaps / dayDensityMap) this added up to a
          visible 1–3s blank after clicking Week or Day. We now animate only
          date navigation — view-switch swaps the grid immediately so the
          shell appears in the same frame the tab is clicked.
        */}
        {navDirection === 0 ? (
          <div className="h-full w-full">
            {view === ViewType.MONTH && <MonthView events={filteredInstances} />}
            {view === ViewType.WEEK && <WeekView events={filteredInstances} />}
            {view === ViewType.DAY && <DayView events={filteredInstances} />}
          </div>
        ) : (
          <AnimatePresence custom={navDirection}>
            <motion.div
              key={`${view}-${currentDate.toISOString()}`}
              custom={navDirection}
              initial={animationVariants.initial}
              animate={animationVariants.animate}
              exit={animationVariants.exit}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="h-full w-full"
              onAnimationComplete={() => setNavDirection(0)}
            >
              {view === ViewType.MONTH && <MonthView events={filteredInstances} />}
              {view === ViewType.WEEK && <WeekView events={filteredInstances} />}
              {view === ViewType.DAY && <DayView events={filteredInstances} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default CalendarPage;
