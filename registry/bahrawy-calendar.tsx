"use client"

import * as React from "react"
import {
  BahrawyCalendarProvider,
  useCalendarContext,
  ViewType,
  formatDateISO,
  getDaysInMonth,
  getDaysInWeek,
  isSameDay,
  getEventPosition,
  expandRecurrences,
  formatTime,
  HOUR_HEIGHT,
  hourLabel,
  EVENT_COLORS,
  DAYS,
  timeToMinutes,
  minutesToTime,
  uid,
} from "bahrawy-calendar"
import type {
  CalendarEvent,
  EventInstance,
  NotifyFn,
  CalendarLifecycleCallbacks,
  IntegrationsConfig,
} from "bahrawy-calendar"
import type { PersistenceAdapter } from "bahrawy-calendar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  MapPin,
  X,
} from "lucide-react"

// ── Props ───────────────────────────────────────────────────────────────────

export interface BahrawyCalendarProps {
  defaultView?: "month" | "week" | "day"
  initialDate?: Date
  events?: CalendarEvent[]
  externalEvents?: {
    google?: CalendarEvent[]
    outlook?: CalendarEvent[]
    apple?: CalendarEvent[]
  }
  persistence?: PersistenceAdapter
  notify?: NotifyFn
  className?: string
  enableRecurrence?: boolean
  enableDragAndDrop?: boolean
  enableConflictDetection?: boolean
  enableKeyboardShortcuts?: boolean
  callbacks?: CalendarLifecycleCallbacks
  integrations?: IntegrationsConfig
}

const VIEW_ENUM: Record<string, ViewType> = {
  month: ViewType.MONTH,
  week: ViewType.WEEK,
  day: ViewType.DAY,
}

// ── Root ────────────────────────────────────────────────────────────────────

export function BahrawyCalendar({
  defaultView = "month",
  initialDate,
  events,
  externalEvents,
  persistence,
  notify,
  className,
  enableRecurrence = true,
  enableDragAndDrop = true,
  enableConflictDetection = true,
  enableKeyboardShortcuts = true,
  callbacks,
  integrations,
}: BahrawyCalendarProps) {
  return (
    <BahrawyCalendarProvider
      defaultView={VIEW_ENUM[defaultView]}
      initialDate={initialDate}
      externalEvents={externalEvents}
      persistence={persistence}
      notify={notify}
      enableRecurrence={enableRecurrence}
      enableDragAndDrop={enableDragAndDrop}
      enableConflictDetection={enableConflictDetection}
      enableKeyboardShortcuts={enableKeyboardShortcuts}
      callbacks={callbacks}
      integrations={integrations}
    >
      <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border bg-background", className)}>
        <CalendarInner controlledEvents={events} />
      </div>
    </BahrawyCalendarProvider>
  )
}

// ── Inner (context access) ──────────────────────────────────────────────────

function CalendarInner({ controlledEvents }: { controlledEvents?: CalendarEvent[] }) {
  const { useCalendarStore, useEventsStore, externalEvents } = useCalendarContext()
  const view = useCalendarStore((s) => s.view)
  const currentDate = useCalendarStore((s) => s.currentDate)
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate)
  const setView = useCalendarStore((s) => s.setView)
  const openModal = useCalendarStore((s) => s.openModal)
  const isModalOpen = useCalendarStore((s) => s.isModalOpen)
  const selectedEventId = useCalendarStore((s) => s.selectedEventId)
  const closeModal = useCalendarStore((s) => s.closeModal)
  const addEvent = useEventsStore((s) => s.addEvent)
  const updateEvent = useEventsStore((s) => s.updateEvent)
  const deleteEvent = useEventsStore((s) => s.deleteEvent)
  const storeEvents = useEventsStore((s) => s.events)
  const initialDate = useCalendarStore((s) => s.initialDateForNewEvent)
  const initialTime = useCalendarStore((s) => s.initialTimeForNewEvent)

  const localEvents = controlledEvents ?? storeEvents

  const allEvents = React.useMemo(() => {
    const ext = [
      ...(externalEvents?.google ?? []),
      ...(externalEvents?.outlook ?? []),
      ...(externalEvents?.apple ?? []),
    ]
    return [...localEvents, ...ext]
  }, [localEvents, externalEvents])

  const visibleInstances = React.useMemo(() => {
    const d = new Date(currentDate)
    d.setHours(0, 0, 0, 0)
    let start: Date, end: Date
    if (view === ViewType.MONTH) {
      start = new Date(d.getFullYear(), d.getMonth(), 1 - 7)
      end = new Date(d.getFullYear(), d.getMonth() + 1, 7)
    } else if (view === ViewType.WEEK) {
      start = new Date(d)
      start.setDate(d.getDate() - d.getDay())
      end = new Date(start)
      end.setDate(start.getDate() + 7)
    } else {
      start = new Date(d)
      end = new Date(d)
      end.setDate(end.getDate() + 1)
    }
    return expandRecurrences(allEvents, start, end)
  }, [allEvents, currentDate, view])

  const selectedEvent = React.useMemo(
    () => (selectedEventId ? allEvents.find((e) => e.id === selectedEventId) : undefined),
    [selectedEventId, allEvents],
  )

  const handleEventClick = React.useCallback(
    (ev: EventInstance) => {
      if (ev.readOnly) return
      openModal(ev.id)
    },
    [openModal],
  )

  const handleSlotClick = React.useCallback(
    (date: string, time?: string) => openModal(undefined, date, time),
    [openModal],
  )

  const handleDayClick = React.useCallback(
    (day: Date) => {
      setCurrentDate(day)
      setView(ViewType.DAY)
    },
    [setCurrentDate, setView],
  )

  return (
    <>
      <Header />
      <div className="flex-1 overflow-hidden">
        {view === ViewType.MONTH && (
          <MonthView currentDate={currentDate} events={visibleInstances} onEventClick={handleEventClick} onDayClick={handleDayClick} />
        )}
        {view === ViewType.WEEK && (
          <WeekView currentDate={currentDate} events={visibleInstances} onEventClick={handleEventClick} onSlotClick={handleSlotClick} />
        )}
        {view === ViewType.DAY && (
          <DayView currentDate={currentDate} events={visibleInstances} onEventClick={handleEventClick} onSlotClick={handleSlotClick} />
        )}
      </div>
      <EventModal
        open={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
        initialDate={initialDate}
        initialTime={initialTime}
        onSave={(ev) => {
          if (selectedEventId) updateEvent(ev)
          else addEvent(ev)
          closeModal()
        }}
        onDelete={(id) => {
          deleteEvent(id)
          closeModal()
        }}
      />
    </>
  )
}

// ── Header ──────────────────────────────────────────────────────────────────

function Header() {
  const { useCalendarStore } = useCalendarContext()
  const view = useCalendarStore((s) => s.view)
  const currentDate = useCalendarStore((s) => s.currentDate)
  const setView = useCalendarStore((s) => s.setView)
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate)
  const openModal = useCalendarStore((s) => s.openModal)

  const label = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })

  const nav = (offset: number) => {
    const d = new Date(currentDate)
    if (view === ViewType.MONTH) d.setMonth(d.getMonth() + offset)
    else if (view === ViewType.WEEK) d.setDate(d.getDate() + offset * 7)
    else d.setDate(d.getDate() + offset)
    setCurrentDate(d)
  }

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="min-w-[160px] text-center text-sm font-semibold">{label}</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" className="ml-1 h-7 text-xs" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-lg bg-muted p-0.5">
          {(["month", "week", "day"] as const).map((v) => (
            <Button
              key={v}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 rounded-md px-3 text-xs font-medium",
                view === VIEW_ENUM[v] ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-transparent",
              )}
              onClick={() => setView(VIEW_ENUM[v])}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
        <Button size="sm" className="ml-2 h-7 gap-1 text-xs" onClick={() => openModal()}>
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
      </div>
    </div>
  )
}

// ── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
}: {
  currentDate: Date
  events: EventInstance[]
  onEventClick: (ev: EventInstance) => void
  onDayClick: (day: Date) => void
}) {
  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
  const today = new Date()
  const month = currentDate.getMonth()

  const byDate = React.useMemo(() => {
    const m = new Map<string, EventInstance[]>()
    for (const e of events) {
      const k = e.instanceDate ?? e.date
      m.set(k, [...(m.get(k) ?? []), e])
    }
    return m
  }, [events])

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b">
        {DAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const iso = formatDateISO(day)
          const isToday = isSameDay(day, today)
          const isCurMonth = day.getMonth() === month
          const evs = byDate.get(iso) ?? []

          return (
            <div
              key={i}
              className={cn(
                "cursor-pointer overflow-hidden border-b border-r p-1 transition-colors hover:bg-accent/30",
                !isCurMonth && "opacity-40",
                isToday && "bg-primary/[0.03]",
              )}
              onClick={() => onDayClick(day)}
            >
              <div
                className={cn(
                  "mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday && "bg-primary font-bold text-primary-foreground",
                )}
              >
                {day.getDate()}
              </div>
              {evs.slice(0, 3).map((ev) => (
                <div
                  key={ev.id + (ev.instanceDate ?? "")}
                  className="mb-px cursor-pointer truncate rounded-sm border-l-2 px-1 text-[10px] font-medium leading-4"
                  style={{ borderColor: evColor(ev), color: evColor(ev), background: evColor(ev) + "14" }}
                  title={`${ev.title} (${formatTime(ev.startTime)} - ${formatTime(ev.endTime)})`}
                  onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                >
                  {ev.title}
                </div>
              ))}
              {evs.length > 3 && (
                <div className="pl-1 text-[10px] text-muted-foreground">+{evs.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week View ───────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function WeekView({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
}: {
  currentDate: Date
  events: EventInstance[]
  onEventClick: (ev: EventInstance) => void
  onSlotClick: (date: string, time?: string) => void
}) {
  const weekDays = getDaysInWeek(currentDate)
  const today = new Date()

  const byDay = React.useMemo(() => {
    const m = new Map<string, EventInstance[]>()
    for (const e of events) {
      const k = e.instanceDate ?? e.date
      m.set(k, [...(m.get(k) ?? []), e])
    }
    return m
  }, [events])

  return (
    <div className="flex h-full flex-col">
      {/* Day header */}
      <div className="grid shrink-0 grid-cols-[56px_repeat(7,1fr)] border-b">
        <div />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className="border-l py-2 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{DAYS[day.getDay()]}</div>
              <div className={cn(
                "mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-xl",
                isToday ? "bg-primary font-bold text-primary-foreground" : "font-normal",
              )}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="relative flex h-[var(--bc-hour-height,80px)] items-start justify-end pr-2" style={{ height: HOUR_HEIGHT }}>
                <span className="-translate-y-1.5 text-[10px] text-muted-foreground">{h === 0 ? "" : hourLabel(h)}</span>
              </div>
            ))}
          </div>
          {weekDays.map((day, di) => {
            const iso = formatDateISO(day)
            const dayEvs = byDay.get(iso) ?? []
            return (
              <div key={di} className="relative border-l">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="cursor-pointer border-b transition-colors hover:bg-accent/20"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(iso, minutesToTime(h * 60))}
                  />
                ))}
                {isSameDay(day, today) && <NowLine />}
                {dayEvs.map((ev) => (
                  <EventCard key={ev.id + (ev.instanceDate ?? "")} ev={ev} onClick={onEventClick} />
                ))}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// ── Day View ────────────────────────────────────────────────────────────────

function DayView({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
}: {
  currentDate: Date
  events: EventInstance[]
  onEventClick: (ev: EventInstance) => void
  onSlotClick: (date: string, time?: string) => void
}) {
  const today = new Date()
  const isToday = isSameDay(currentDate, today)
  const iso = formatDateISO(currentDate)

  const dayEvs = React.useMemo(
    () => events.filter((e) => (e.instanceDate ?? e.date) === iso),
    [events, iso],
  )

  const positioned = React.useMemo(() => {
    const sorted = [...dayEvs].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    const cols: number[] = []
    const pos: { ev: EventInstance; col: number; total: number }[] = []
    for (const ev of sorted) {
      const s = timeToMinutes(ev.startTime)
      let placed = false
      for (let c = 0; c < cols.length; c++) {
        if (s >= cols[c]) {
          cols[c] = timeToMinutes(ev.endTime)
          pos.push({ ev, col: c, total: 0 })
          placed = true
          break
        }
      }
      if (!placed) {
        cols.push(timeToMinutes(ev.endTime))
        pos.push({ ev, col: cols.length - 1, total: 0 })
      }
    }
    const t = cols.length || 1
    return pos.map((p) => ({ ...p, total: t }))
  }, [dayEvs])

  const dayLabel = currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{dayLabel}</span>
        {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Today</span>}
      </div>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[56px_1fr]">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="flex items-start justify-end pr-2" style={{ height: HOUR_HEIGHT }}>
                <span className="-translate-y-1.5 text-[10px] text-muted-foreground">{h === 0 ? "" : hourLabel(h)}</span>
              </div>
            ))}
          </div>
          <div className="relative border-l">
            {HOURS.map((h) => (
              <div
                key={h}
                className="cursor-pointer border-b transition-colors hover:bg-accent/20"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => onSlotClick(iso, minutesToTime(h * 60))}
              />
            ))}
            {isToday && <NowLine />}
            {positioned.map(({ ev, col, total }) => {
              const p = getEventPosition(ev.startTime, ev.endTime)
              const w = 100 / total
              return (
                <div
                  key={ev.id + (ev.instanceDate ?? "")}
                  className="absolute cursor-pointer overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 transition-shadow hover:shadow-md"
                  style={{
                    top: p.top, height: p.height,
                    left: `calc(${col * w}% + 2px)`, width: `calc(${w}% - 4px)`,
                    borderColor: evColor(ev), background: evColor(ev) + "18",
                  }}
                  title={`${ev.title}\n${formatTime(ev.startTime)} - ${formatTime(ev.endTime)}`}
                  onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                >
                  <div className="truncate text-xs font-semibold" style={{ color: evColor(ev) }}>{ev.title}</div>
                  {p.height > 36 && (
                    <div className="text-[10px] text-muted-foreground">{formatTime(ev.startTime)} - {formatTime(ev.endTime)}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ── Event Card (Week view) ──────────────────────────────────────────────────

function EventCard({ ev, onClick }: { ev: EventInstance; onClick: (ev: EventInstance) => void }) {
  const p = getEventPosition(ev.startTime, ev.endTime)
  return (
    <div
      className="absolute cursor-pointer overflow-hidden rounded border-l-[3px] px-1 py-0.5 transition-shadow hover:shadow-md"
      style={{
        top: p.top, height: p.height, left: 2, right: 2,
        borderColor: evColor(ev), background: evColor(ev) + "18",
      }}
      title={`${ev.title}\n${formatTime(ev.startTime)} - ${formatTime(ev.endTime)}`}
      onClick={(e) => { e.stopPropagation(); onClick(ev) }}
    >
      <div className="truncate text-[11px] font-semibold leading-[14px]" style={{ color: evColor(ev) }}>{ev.title}</div>
      {p.height > 36 && (
        <div className="text-[10px] text-muted-foreground">{formatTime(ev.startTime)} - {formatTime(ev.endTime)}</div>
      )}
    </div>
  )
}

// ── Event Modal ─────────────────────────────────────────────────────────────

function EventModal({
  open,
  onClose,
  event,
  initialDate,
  initialTime,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  event?: CalendarEvent
  initialDate?: string
  initialTime?: string
  onSave: (ev: CalendarEvent) => void
  onDelete: (id: string) => void
}) {
  const isEdit = !!event
  const [title, setTitle] = React.useState("")
  const [date, setDate] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [location, setLocation] = React.useState("")

  React.useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title)
        setDate(event.date)
        setStartTime(event.startTime)
        setEndTime(event.endTime)
        setDescription(event.description ?? "")
        setLocation(event.location ?? "")
      } else {
        setTitle("")
        setDate(initialDate ?? formatDateISO(new Date()))
        setStartTime(initialTime ?? "09:00")
        setEndTime(initialTime ? minutesToTime(timeToMinutes(initialTime) + 60) : "10:00")
        setDescription("")
        setLocation("")
      }
    }
  }, [open, event, initialDate, initialTime])

  const handleSave = () => {
    if (!title.trim()) return
    const ev: CalendarEvent = {
      id: event?.id ?? uid(),
      title: title.trim(),
      date,
      startTime,
      endTime,
      description,
      location: location || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      category: event?.category ?? "Personal",
      color: event?.color ?? EVENT_COLORS["Personal"] ?? "#10B981",
      source: "local",
      provider: "local",
      recurrence: event?.recurrence,
    }
    onSave(ev)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input id="ev-title" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date
              </Label>
              <Input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-start" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Start
              </Label>
              <Input id="ev-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-end">End</Label>
              <Input id="ev-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-loc" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location
            </Label>
            <Input id="ev-loc" placeholder="Optional" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-desc">Description</Label>
            <Input id="ev-desc" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(event!.id)}>
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function NowLine() {
  const now = new Date()
  const top = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ top }}>
      <div className="h-0.5 w-full bg-primary" />
      <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-primary" />
    </div>
  )
}

const evColor = (e: EventInstance) => e.color || EVENT_COLORS[e.category] || "#6D59E0"
