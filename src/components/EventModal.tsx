'use client';

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useCalendarStore } from "../store/useCalendarStore";
import { useCalendarEventsStore } from "../store/useCalendarEventsStore";
import { usePlannerStore } from "../store/usePlannerStore";
import { CalendarEvent, EventCategory, RecurrenceRule, EditScope } from "../types";
import { CATEGORIES } from "../constants";
import { uid } from "../lib/uid";
import { timeToMinutes, minutesToTime } from "../utils/dateUtils";
import { GoogleProviderIcon, OutlookProviderIcon, TrashIcon } from "./icons";
import RecurrenceSelector from "./RecurrenceSelector";
import EditRecurrenceDialog from "./EditRecurrenceDialog";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import { useDocsStore } from "@/store/useDocsStore";
import { TEMPLATES } from "@/lib/docs/templates";

/** Intentional brand colors per Google/Microsoft identity guidelines */
const GOOGLE_BRAND_COLOR = '#4285F4';
const OUTLOOK_BRAND_COLOR = '#0078D4';

/* ── Zod schema ──────────────────────────────────────────────────────────── */
const eventSchema = z.object({
  title: z.string().min(1, "Event name is required").max(100),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  category: z.string(),
}).refine((d) => timeToMinutes(d.endTime) > timeToMinutes(d.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

/* ── Component ───────────────────────────────────────────────────────────── */
const EventModal: React.FC = () => {
  // Per-field selectors — EventModal is always mounted in AppShell.
  // A full-store sub re-renders it on every unrelated state change.
  const isModalOpen           = useCalendarStore(s => s.isModalOpen);
  const closeModal            = useCalendarStore(s => s.closeModal);
  const selectedEventId       = useCalendarStore(s => s.selectedEventId);
  const initialDateForNewEvent = useCalendarStore(s => s.initialDateForNewEvent);
  const initialTimeForNewEvent = useCalendarStore(s => s.initialTimeForNewEvent);
  const timezone              = useCalendarStore(s => s.timezone);
  const events     = useCalendarEventsStore(s => s.events);
  const addEvent   = useCalendarEventsStore(s => s.addEvent);
  const updateEvent = useCalendarEventsStore(s => s.updateEvent);
  const deleteEvent = useCalendarEventsStore(s => s.deleteEvent);
  const localEvent = events.find((e) => e.id === selectedEventId);
  const outlookEvents = usePlannerStore((s) => s.outlookEvents);
  const googleEvents = usePlannerStore((s) => s.googleEvents);
  const outlookEvent = outlookEvents.find((e) => e.id === selectedEventId);
  const googleEvent = googleEvents.find((e) => e.id === selectedEventId);
  const activeEvent = localEvent || outlookEvent || googleEvent;
  const provider = activeEvent?.provider
    || (activeEvent?.source === 'outlook' || activeEvent?.source === 'microsoft'
      ? 'microsoft'
      : activeEvent?.source === 'google'
        ? 'google'
        : 'local');
  const isExternalEvent = provider === 'google' || provider === 'microsoft';
  const isGoogleEvent = provider === 'google';
  const externalColor = activeEvent?.color || (isGoogleEvent ? GOOGLE_BRAND_COLOR : OUTLOOK_BRAND_COLOR);

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: "", description: "", date: "",
    startTime: "09:00", endTime: "10:00", category: "Work", location: "",
  });
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editScopeDialog, setEditScopeDialog] = useState<{ open: boolean; action: 'edit' | 'delete' }>({ open: false, action: 'edit' });

  const isRecurring = !!(activeEvent?.recurrence || activeEvent?.recurringEventId || activeEvent?.isRecurrenceException);

  useEffect(() => {
    if (!isModalOpen) return;
    if (activeEvent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(activeEvent);
      setRecurrence(activeEvent.recurrence ?? null);
    } else {
      const startTime = initialTimeForNewEvent || "09:00";
      const endTime = minutesToTime(Math.min(1435, timeToMinutes(startTime) + 60));
      setFormData({
        title: "", description: "",
        date: initialDateForNewEvent || new Date().toISOString().split("T")[0],
        startTime, endTime, category: "Work", location: "",
      });
      setRecurrence(null);
    }
    setErrors({});
  }, [activeEvent, initialDateForNewEvent, initialTimeForNewEvent, isModalOpen]);

  /* Auto-adjust end time */
  useEffect(() => {
    const s = timeToMinutes(formData.startTime || "09:00");
    const e = timeToMinutes(formData.endTime || "10:00");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e <= s) setFormData((prev) => ({ ...prev, endTime: minutesToTime(Math.min(1435, s + 30)) }));
  }, [formData.startTime, formData.endTime]);


  const handleSave = (editScope?: EditScope) => {
    const result = eventSchema.safeParse(formData);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach((i) => { if (i.path[0] != null) fe[i.path[0].toString()] = i.message; });
      setErrors(fe); return;
    }

    // If editing a recurring event and no scope chosen yet, show the dialog
    if (localEvent && isRecurring && !editScope) {
      setEditScopeDialog({ open: true, action: 'edit' });
      return;
    }

    const finalEvent: CalendarEvent = {
      id: localEvent?.id || uid('ev_'),
      title: result.data.title,
      description: result.data.description || "",
      date: result.data.date,
      startTime: result.data.startTime,
      endTime: result.data.endTime,
      category: result.data.category as EventCategory,
      location: formData.location || "",
      color: CATEGORIES.find((c) => c.name === result.data.category)?.color || 'hsl(var(--primary))',
      timezone: localEvent?.timezone || timezone,
      recurrence: recurrence ?? undefined,
    };
    if (localEvent) updateEvent(finalEvent, editScope); else addEvent(finalEvent);
    closeModal();
  };

  const handleDelete = (editScope?: EditScope) => {
    if (!localEvent) return;
    if (isRecurring && !editScope) {
      setEditScopeDialog({ open: true, action: 'delete' });
      return;
    }
    deleteEvent(localEvent.id, editScope);
    closeModal();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              {isExternalEvent && (
                isGoogleEvent
                  ? <GoogleProviderIcon size={16} className="flex-shrink-0" />
                  : <OutlookProviderIcon size={16} className="flex-shrink-0" />
              )}
              {isGoogleEvent
                ? 'Google Calendar Event'
                : provider === 'microsoft'
                  ? 'Outlook Event'
                  : activeEvent
                    ? 'Edit Event'
                    : 'Add Event'}
            </DialogTitle>
          </div>
          {isExternalEvent && (
            <p className="text-xs text-muted-foreground mt-1">
              This event is synced from {isGoogleEvent ? 'Google Calendar' : 'Outlook'} and cannot be edited in Lumina.
            </p>
          )}
        </DialogHeader>


        {/* Form */}
        <div
          className="modal-scroll px-6 py-5 space-y-4 overflow-y-auto max-h-[65vh]"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >

          {/* Event Name */}
          <div className="space-y-1.5">
            <Label htmlFor="evt-title">Event Name</Label>
            <Input
              id="evt-title"
              autoFocus
              placeholder="e.g. Team standup"
              value={formData.title || ""}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors((p) => ({ ...p, title: "" })); }}
              className={errors.title ? "border-destructive focus-visible:ring-destructive/40" : ""}
              disabled={isExternalEvent}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="evt-desc">Description</Label>
            <Textarea
              id="evt-desc"
              placeholder="Notes, agenda, links..."
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isExternalEvent}
            />
          </div>

          {/* Meeting Notes */}
          {activeEvent && <MeetingNotesSection eventId={activeEvent.id} eventTitle={activeEvent.title} eventDate={formData.date} eventStartTime={formData.startTime} eventEndTime={formData.endTime} />}

          {isExternalEvent && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Synced Source</span>
                <span className="text-xs font-semibold text-foreground">{isGoogleEvent ? 'Google Calendar' : 'Outlook Calendar'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Calendar Color</span>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: externalColor }} />
                  {externalColor}
                </span>
              </div>
            </div>
          )}

          {/* External provider details */}
          {isExternalEvent && activeEvent?.organizer && (
            <div className="space-y-1.5">
              <Label>Organizer</Label>
              <p className="text-sm text-muted-foreground">{activeEvent.organizer}</p>
            </div>
          )}
          {isExternalEvent && activeEvent?.location && (
            <div className="space-y-1.5">
              <Label>Location</Label>
              <p className="text-sm text-muted-foreground">{activeEvent.location}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <DatePicker
                value={formData.date || ""}
                onChange={(date) => { setFormData({ ...formData, date }); setErrors((p) => ({ ...p, date: "" })); }}
                disabled={isExternalEvent}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <DatePicker
                value={formData.date || ""}
                onChange={(date) => setFormData({ ...formData, date })}
                disabled={isExternalEvent}
              />
            </div>
          </div>

          {/* Times */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <TimePicker
                  value={formData.startTime || "09:00"}
                  onChange={(v) => setFormData({ ...formData, startTime: v })}
                  disabled={isExternalEvent}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <TimePicker
                  value={formData.endTime || "10:00"}
                  onChange={(v) => { setFormData({ ...formData, endTime: v }); setErrors((p) => ({ ...p, endTime: "" })); }}
                  disabled={isExternalEvent}
                />
              </div>
            </div>
            {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={formData.category || "Work"}
              onValueChange={(v) => setFormData({ ...formData, category: v as EventCategory })}
              disabled={isExternalEvent}
            >
              <SelectTrigger className="h-9">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORIES.find((c) => c.name === formData.category)?.color || 'hsl(var(--primary))' }}
                    />
                    {formData.category}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          {!isExternalEvent && (
            <RecurrenceSelector
              value={recurrence}
              onChange={setRecurrence}
              dtstart={formData.date}
              disabled={isExternalEvent}
            />
          )}

        </div>

        {/* Edit scope dialog for recurring events */}
        <EditRecurrenceDialog
          open={editScopeDialog.open}
          onClose={() => setEditScopeDialog({ ...editScopeDialog, open: false })}
          onConfirm={(scope) => {
            if (editScopeDialog.action === 'delete') {
              handleDelete(scope);
            } else {
              handleSave(scope);
            }
          }}
          action={editScopeDialog.action}
        />

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t flex-row items-center justify-between">
          <div>
            {localEvent && !isExternalEvent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete()}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <TrashIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={closeModal}>
              {isExternalEvent ? "Close" : "Cancel"}
            </Button>
            {!isExternalEvent && (
              <Button size="sm" onClick={() => handleSave()} className="bg-primary hover:bg-primary/90 gap-1.5">
                {localEvent ? "Save changes" : "Save"}
              </Button>
            )}
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default EventModal;

// ── Meeting Notes Section ────────────────────────────────────────────────────

function MeetingNotesSection({
  eventId,
  eventTitle,
  eventDate,
  eventStartTime,
  eventEndTime,
}: {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
}) {
  const docs = useDocsStore((s) => s.docs);
  const createDoc = useDocsStore((s) => s.createDoc);
  const updateDoc = useDocsStore((s) => s.updateDoc);
  const [isCreating, setIsCreating] = React.useState(false);

  // Find existing linked doc
  const linkedDoc = docs.find((d) => d.linkedEventId === eventId && !d.isArchived);

  const handleCreateNotes = async () => {
    setIsCreating(true);
    try {
      // Take the meeting-notes template's body (everything after its own H1
      // title block) and prepend an event-specific header so the resulting
      // doc is a proper Tiptap doc { type: 'doc', content: [...] }.
      const meetingTemplate = TEMPLATES.find((t) => t.id === 'meeting-notes');
      const templateBody =
        ((meetingTemplate?.content as { content?: Record<string, unknown>[] } | undefined)?.content ?? []).slice(1);
      const content = {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: eventTitle }] },
          { type: 'paragraph', content: [{ type: 'text', text: `Date: ${eventDate}` }] },
          { type: 'paragraph', content: [{ type: 'text', text: `Time: ${eventStartTime} – ${eventEndTime}` }] },
          ...templateBody,
        ],
      };

      const docId = await createDoc({
        title: `${eventTitle} — Notes`,
        icon: '📋',
        linkedEventId: eventId,
      });

      if (docId) {
        // Save content
        const contentText = `${eventTitle} Notes Date: ${eventDate} Time: ${eventStartTime} – ${eventEndTime}`;
        await fetch(`/api/docs/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, contentText, wordCount: contentText.split(/\s+/).length }),
        });

        // Link event to doc
        await fetch(`/api/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedDocId: docId }),
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUnlink = async () => {
    if (!linkedDoc) return;
    updateDoc(linkedDoc.id, { linkedEventId: null });
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedDocId: null }),
    });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Meeting notes</Label>
      {linkedDoc ? (
        <div className="flex items-center gap-2">
          <a
            href={`/docs/${linkedDoc.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1.5"
          >
            📋 Open notes →
          </a>
          <button
            type="button"
            onClick={handleUnlink}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCreateNotes}
          disabled={isCreating}
          className="text-sm bg-muted text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : '+ Create notes'}
        </button>
      )}
    </div>
  );
}
