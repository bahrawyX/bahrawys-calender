"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useCalendarEventsStore } from "@/store/useCalendarEventsStore";
import { usePlannerStore } from "@/store/usePlannerStore";
import { ViewType } from "@/types";
import EventModal from "@/components/EventModal";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { GoogleProviderIcon, OutlookProviderIcon, AppleProviderIcon } from "@/components/icons";
import { useExternalSync } from "@/hooks/useExternalSync";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── Inline icons ─────────────────────────────────────────────────── */
const PlusIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

const MonthIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="1" x2="8" y2="4" /><line x1="16" y1="1" x2="16" y2="4" />
  </svg>
);

const LinkIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const FilterIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const RefreshIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const MOBILE_NAV_ITEMS = [
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
] as const;

/* ─── Types ────────────────────────────────────────────────────────── */
type IntegrationProvider = 'google' | 'microsoft';

interface ExternalCalendarFilter {
  id: string;
  provider: 'google' | 'microsoft' | 'apple';
  name: string;
  color: string;
  enabled: boolean;
  isPrimary: boolean;
}

/* ─── Integration popup helper ─────────────────────────────────────── */
function openIntegrationPopup(
  provider: IntegrationProvider,
  onSuccess: () => void,
  onError: (msg: string) => void,
) {
  const w = 500;
  const h = 700;
  const left = window.screenX + (window.innerWidth - w) / 2;
  const top = window.screenY + (window.innerHeight - h) / 2;
  const popup = window.open(
    `/api/integrations/${provider}/connect`,
    `lumina-${provider}-connect`,
    `width=${w},height=${h},left=${left},top=${top},popup=1`,
  );

  if (!popup) {
    onError('Popup was blocked. Please allow popups for this site.');
    return;
  }

  const timeout = setTimeout(() => {
    cleanup();
    onError('Connection timed out. Please try again.');
  }, 3 * 60 * 1000);

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type !== 'lumina:oauth-complete') return;
    cleanup();
    if (e.data.success) {
      onSuccess();
    } else {
      onError(e.data.error || 'Connection failed');
    }
  };

  const pollClosed = setInterval(() => {
    if (popup.closed) {
      cleanup();
      // Don't treat as error — user may have completed auth
      setTimeout(() => onSuccess(), 500);
    }
  }, 500);

  const cleanup = () => {
    clearTimeout(timeout);
    clearInterval(pollClosed);
    window.removeEventListener('message', handleMessage);
  };

  window.addEventListener('message', handleMessage);
}

/* ─── Calendar Filters Dialog ──────────────────────────────────────── */
const CalendarFiltersDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [filters, setFilters] = useState<ExternalCalendarFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/calendars');
      if (res.ok) {
        const data = await res.json();
        setFilters(data);
      }
    } catch (err) {
      console.error('Failed to load calendar filters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadFilters();
  }, [open, loadFilters]);

  const toggleFilter = async (cal: ExternalCalendarFilter) => {
    setSavingId(cal.id);
    try {
      const res = await fetch(`/api/integrations/calendars/${encodeURIComponent(cal.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !cal.enabled }),
      });
      if (res.ok) {
        setFilters((prev) =>
          prev.map((f) => (f.id === cal.id ? { ...f, enabled: !f.enabled } : f)),
        );
        // Trigger re-sync
        window.dispatchEvent(new CustomEvent('lumina:external-sync-now'));
      }
    } catch (err) {
      console.error('Failed to toggle calendar filter:', err);
    } finally {
      setSavingId(null);
    }
  };

  if (!open) return null;

  const googleCals = filters.filter((f) => f.provider === 'google');
  const msCals = filters.filter((f) => f.provider === 'microsoft');
  const appleCals = filters.filter((f) => f.provider === 'apple');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border border-border/60 shadow-2xl w-[380px] max-h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/40">
          <h3 className="text-sm font-semibold text-foreground">Calendar Filters</h3>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <div className="flex-1 h-4 rounded bg-muted" />
                    <div className="w-8 h-5 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : filters.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No external calendars found. Connect a provider first.
              </p>
            ) : (
              <>
                {googleCals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <GoogleProviderIcon size={14} />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Google Calendar
                      </span>
                    </div>
                    <div className="space-y-1">
                      {googleCals.map((cal) => (
                        <CalendarFilterRow
                          key={cal.id}
                          cal={cal}
                          saving={savingId === cal.id}
                          onToggle={() => toggleFilter(cal)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {msCals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <OutlookProviderIcon size={14} />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Outlook
                      </span>
                    </div>
                    <div className="space-y-1">
                      {msCals.map((cal) => (
                        <CalendarFilterRow
                          key={cal.id}
                          cal={cal}
                          saving={savingId === cal.id}
                          onToggle={() => toggleFilter(cal)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {appleCals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <AppleProviderIcon size={14} />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Apple Calendar
                      </span>
                    </div>
                    <div className="space-y-1">
                      {appleCals.map((cal) => (
                        <CalendarFilterRow
                          key={cal.id}
                          cal={cal}
                          saving={savingId === cal.id}
                          onToggle={() => toggleFilter(cal)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
          <button
            onClick={loadFilters}
            disabled={loading}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={12} />
            Refresh List
          </button>
          <button
            onClick={onClose}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const CalendarFilterRow: React.FC<{
  cal: ExternalCalendarFilter;
  saving: boolean;
  onToggle: () => void;
}> = ({ cal, saving, onToggle }) => (
  <button
    onClick={onToggle}
    disabled={saving}
    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-60"
  >
    <span
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: cal.color }}
    />
    <span className="flex-1 text-xs text-foreground truncate">{cal.name}</span>
    {/* Toggle switch */}
    <div
      className={`w-8 h-[18px] rounded-full transition-colors duration-200 flex items-center px-0.5 ${
        cal.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          cal.enabled ? 'translate-x-[14px]' : 'translate-x-0'
        }`}
      />
    </div>
  </button>
);

/* ─── Apple Calendar Connect Modal ─────────────────────────────────── */
const AppleConnectModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !appPassword) {
      setError('Both fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/integrations/apple/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, appPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Connection failed');
      }

      onSuccess();
      onClose();
      setEmail('');
      setAppPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border border-border/60 shadow-2xl w-[400px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <AppleProviderIcon size={18} />
            <h3 className="text-sm font-semibold text-foreground">Connect Apple Calendar</h3>
          </div>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="text-xs text-muted-foreground leading-relaxed">
            Apple Calendar uses an{' '}
            <span className="font-medium text-foreground">app-specific password</span>
            {' '}instead of OAuth. Generate one at{' '}
            <a
              href="https://appleid.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              appleid.apple.com
            </a>
            {' '}→ Sign-In and Security → App-Specific Passwords.
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Apple ID Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@icloud.com"
                disabled={loading}
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">App-Specific Password</label>
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                disabled={loading}
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !appPassword}
              className="h-8 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              )}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── AppShell ─────────────────────────────────────────────────────── */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Calendar store
  const openModal = useCalendarStore((s) => s.openModal);
  const isSidebarCollapsed = useCalendarStore((s) => s.isSidebarCollapsed);
  const setSidebarCollapsed = useCalendarStore((s) => s.setSidebarCollapsed);
  const setView = useCalendarStore((s) => s.setView);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);
  const setFocusMode = useCalendarStore((s) => s.setFocusMode);
  const isFocusMode = useCalendarStore((s) => s.isFocusMode);
  const undo = useCalendarEventsStore((s) => s.undo);
  const redo = useCalendarEventsStore((s) => s.redo);

  // Planner store — integration state
  const outlookConnected = usePlannerStore((s) => s.outlookConnected);
  const googleConnected = usePlannerStore((s) => s.googleConnected);
  const appleConnected = usePlannerStore((s) => s.appleConnected);
  const setOutlookConnected = usePlannerStore((s) => s.setOutlookConnected);
  const setGoogleConnected = usePlannerStore((s) => s.setGoogleConnected);
  const setAppleConnected = usePlannerStore((s) => s.setAppleConnected);
  const clearExternalEvents = usePlannerStore((s) => s.clearExternalEvents);
  const isSyncing = usePlannerStore((s) => s.isSyncing);

  // External sync hook — fetches events from connected providers
  useExternalSync();

  // Integration UI state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [outlookLoading, setOutlookLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [calendarFiltersOpen, setCalendarFiltersOpen] = useState(false);
  const [appleConnectOpen, setAppleConnectOpen] = useState(false);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-collapse sidebar at laptop widths
  const wasAutoCollapsedRef = useRef(false);
  useEffect(() => {
    const checkWidth = () => {
      const w = window.innerWidth;
      const isDrawer = w < 1024;
      const isLaptop = w >= 1024 && w < 1400;
      const collapsed = useCalendarStore.getState().isSidebarCollapsed;

      if (isDrawer && collapsed) {
        wasAutoCollapsedRef.current = false;
        setSidebarCollapsed(false);
      } else if (isLaptop && !collapsed) {
        wasAutoCollapsedRef.current = true;
        setSidebarCollapsed(true);
      } else if (!isDrawer && !isLaptop && collapsed && wasAutoCollapsedRef.current) {
        wasAutoCollapsedRef.current = false;
        setSidebarCollapsed(false);
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [setSidebarCollapsed]);

  // Refresh integration status on mount
  useEffect(() => {
    const refreshStatus = async () => {
      try {
        const res = await fetch('/api/integrations/status');
        if (!res.ok) return;
        const data = await res.json();
        setGoogleConnected(data.google?.connected ?? false);
        setOutlookConnected(data.microsoft?.connected ?? false);
        setAppleConnected(data.apple?.connected ?? false);
      } catch {
        // Silently fail — status will show as disconnected
      }
    };
    refreshStatus();
  }, [setGoogleConnected, setOutlookConnected, setAppleConnected]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        (e.target instanceof HTMLElement && e.target.closest('[contenteditable]'))
      )
        return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (key === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
        return;
      }

      if (pathname === "/calendar") {
        if (key === "n") { e.preventDefault(); openModal(); }
        else if (key === "t") { e.preventDefault(); setCurrentDate(new Date()); }
        else if (key === "f") { e.preventDefault(); setFocusMode(!isFocusMode); }
        else if (key === "m") { setView(ViewType.MONTH); }
        else if (key === "w") { setView(ViewType.WEEK); }
        else if (key === "d") { setView(ViewType.DAY); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModal, setCurrentDate, setView, setFocusMode, isFocusMode, undo, redo, pathname]);

  // Tooltip suppression during collapse transition
  const [tooltipsReady, setTooltipsReady] = useState(isSidebarCollapsed);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    if (isSidebarCollapsed) {
      collapseTimerRef.current = setTimeout(() => setTooltipsReady(true), 350);
    } else {
      setTooltipsReady(false);
    }
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [isSidebarCollapsed]);

  /* ── Integration handlers ─────────────────────────────────────────── */
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/status');
      if (!res.ok) return;
      const data = await res.json();
      setGoogleConnected(data.google?.connected ?? false);
      setOutlookConnected(data.microsoft?.connected ?? false);
      setAppleConnected(data.apple?.connected ?? false);
    } catch {
      // silently fail
    }
  }, [setGoogleConnected, setOutlookConnected, setAppleConnected]);

  const handleGoogleConnect = useCallback(async () => {
    if (googleConnected) {
      // Disconnect
      setGoogleLoading(true);
      try {
        await fetch('/api/integrations/google/disconnect', { method: 'POST' });
        setGoogleConnected(false);
        clearExternalEvents();
      } catch (err) {
        console.error('Google disconnect failed:', err);
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    // Connect via popup
    setGoogleLoading(true);
    openIntegrationPopup(
      'google',
      async () => {
        await refreshStatus();
        window.dispatchEvent(new CustomEvent('lumina:external-sync-now'));
        setGoogleLoading(false);
      },
      (msg) => {
        console.error('Google connect error:', msg);
        setGoogleLoading(false);
      },
    );
  }, [googleConnected, setGoogleConnected, clearExternalEvents, refreshStatus]);

  const handleOutlookConnect = useCallback(async () => {
    if (outlookConnected) {
      setOutlookLoading(true);
      try {
        await fetch('/api/integrations/microsoft/disconnect', { method: 'POST' });
        setOutlookConnected(false);
        clearExternalEvents();
      } catch (err) {
        console.error('Outlook disconnect failed:', err);
      } finally {
        setOutlookLoading(false);
      }
      return;
    }

    setOutlookLoading(true);
    openIntegrationPopup(
      'microsoft',
      async () => {
        await refreshStatus();
        window.dispatchEvent(new CustomEvent('lumina:external-sync-now'));
        setOutlookLoading(false);
      },
      (msg) => {
        console.error('Outlook connect error:', msg);
        setOutlookLoading(false);
      },
    );
  }, [outlookConnected, setOutlookConnected, clearExternalEvents, refreshStatus]);

  const handleAppleConnect = useCallback(async () => {
    if (appleConnected) {
      // Disconnect
      setAppleLoading(true);
      try {
        await fetch('/api/integrations/apple/disconnect', { method: 'POST' });
        setAppleConnected(false);
        clearExternalEvents();
      } catch (err) {
        console.error('Apple disconnect failed:', err);
      } finally {
        setAppleLoading(false);
      }
      return;
    }

    // Open the Apple connect modal (CalDAV uses credentials, not OAuth popup)
    setAppleConnectOpen(true);
  }, [appleConnected, setAppleConnected, clearExternalEvents]);

  const handleAppleConnectSuccess = useCallback(async () => {
    await refreshStatus();
    window.dispatchEvent(new CustomEvent('lumina:external-sync-now'));
  }, [refreshStatus]);

  const isCalendarPage = pathname === '/calendar';

  /* ── Sidebar content (shared between desktop and mobile drawer) ───── */
  const sidebarInner = (
    <Sidebar className="h-full">
      {/* Header */}
      <SidebarHeader className="px-4 pt-8 pb-4 gap-4">
        {isSidebarCollapsed ? (
          <div className="flex justify-center">
            <span className="font-logo text-xl font-semibold text-primary dark:text-foreground select-none">L</span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-end justify-between overflow-hidden"
          >
            <div className="flex flex-col leading-none">
              <span className="font-logo text-[24px] font-medium tracking-[-0.035em] text-foreground leading-none">
                Lumina
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mt-1.5">
                Calendar
              </span>
            </div>
          </motion.div>
        )}

        {/* New Event button */}
        <div className="flex flex-col gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => openModal()}
                className={`w-full flex items-center gap-2.5 h-9 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 text-foreground transition-colors duration-150 ease-out text-sm font-medium font-sans ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
                }`}
              >
                <PlusIcon size={15} className="text-muted-foreground" />
                {!isSidebarCollapsed && <span>New Event</span>}
              </button>
            </TooltipTrigger>
            {tooltipsReady && <TooltipContent side="right">New Event (N)</TooltipContent>}
          </Tooltip>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent className="px-2 py-3 gap-1 no-scrollbar">
        <SidebarGroup className="px-2">
          {!isSidebarCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/50 px-3 mb-1">
              Views
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      isActive={isCalendarPage}
                      onClick={() => router.push('/calendar')}
                      className={`h-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Link href="/calendar" prefetch className="absolute inset-0 pointer-events-none" aria-hidden tabIndex={-1} />
                      {isCalendarPage && (
                        <>
                          <motion.div
                            layoutId="sidebar-active-nav-bg"
                            className="absolute inset-0 rounded-lg bg-primary/[0.08] dark:bg-primary/[0.12]"
                            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                          />
                          <motion.div
                            layoutId="sidebar-active-nav-rail"
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </>
                      )}
                      <MonthIcon
                        size={15}
                        className={`relative z-10 flex-shrink-0 transition-colors ${
                          isCalendarPage ? 'text-foreground' : 'text-muted-foreground/80'
                        }`}
                      />
                      {!isSidebarCollapsed && (
                        <span className={`relative z-10 font-sans text-[13px] truncate transition-colors ${
                          isCalendarPage ? 'text-foreground font-medium' : 'text-muted-foreground/90'
                        }`}>
                          Calendar
                        </span>
                      )}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {tooltipsReady && <TooltipContent side="right">Calendar</TooltipContent>}
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Integrations section ─────────────────────────────────── */}
        <SidebarSeparator className="my-2" />
        <SidebarGroup className="px-2">
          {!isSidebarCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/50 px-3 mb-1">
              Calendars
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Google Calendar */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleGoogleConnect}
                      className={`h-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <GoogleProviderIcon
                        size={15}
                        className="relative z-10 flex-shrink-0"
                      />
                      {!isSidebarCollapsed && (
                        <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                          <span className="font-sans text-[13px] truncate text-muted-foreground/90">
                            Google Calendar
                          </span>
                          <IntegrationBadge
                            connected={googleConnected}
                            loading={googleLoading}
                            syncing={isSyncing && googleConnected}
                          />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {tooltipsReady && (
                    <TooltipContent side="right">
                      {googleConnected ? 'Disconnect Google Calendar' : 'Connect Google Calendar'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>

              {/* Outlook */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleOutlookConnect}
                      className={`h-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <OutlookProviderIcon
                        size={15}
                        className="relative z-10 flex-shrink-0"
                      />
                      {!isSidebarCollapsed && (
                        <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                          <span className="font-sans text-[13px] truncate text-muted-foreground/90">
                            Outlook
                          </span>
                          <IntegrationBadge
                            connected={outlookConnected}
                            loading={outlookLoading}
                            syncing={isSyncing && outlookConnected}
                          />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {tooltipsReady && (
                    <TooltipContent side="right">
                      {outlookConnected ? 'Disconnect Outlook' : 'Connect Outlook'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>

              {/* Apple Calendar */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleAppleConnect}
                      className={`h-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <AppleProviderIcon
                        size={15}
                        className="relative z-10 flex-shrink-0"
                      />
                      {!isSidebarCollapsed && (
                        <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                          <span className="font-sans text-[13px] truncate text-muted-foreground/90">
                            Apple Calendar
                          </span>
                          <IntegrationBadge
                            connected={appleConnected}
                            loading={appleLoading}
                            syncing={isSyncing && appleConnected}
                          />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {tooltipsReady && (
                    <TooltipContent side="right">
                      {appleConnected ? 'Disconnect Apple Calendar' : 'Connect Apple Calendar'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>

              {/* Calendar Filters */}
              {(googleConnected || outlookConnected || appleConnected) && (
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => setCalendarFiltersOpen(true)}
                        className={`h-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <FilterIcon
                          size={15}
                          className="relative z-10 flex-shrink-0 text-muted-foreground/80"
                        />
                        {!isSidebarCollapsed && (
                          <span className="relative z-10 font-sans text-[13px] truncate text-muted-foreground/90">
                            Calendar Filters
                          </span>
                        )}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {tooltipsReady && <TooltipContent side="right">Calendar Filters</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );

  return (
    <>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground antialiased" style={{ animation: 'appShellFadeIn 0.4s cubic-bezier(0.4,0,0.2,1) both' }}>
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:h-full">
          <motion.aside
            initial={false}
            animate={isSidebarCollapsed ? 'collapsed' : 'expanded'}
            variants={{
              expanded: { width: '288px' },
              collapsed: { width: '72px' },
            }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative flex flex-col h-full bg-background border-r border-border/60 z-40 overflow-hidden"
          >
            {/* Collapse toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-12 h-6 w-6 min-h-6 min-w-6 p-0 rounded-full border border-border/80 bg-background shadow-sm z-50 hover:bg-accent/50 transition-colors flex items-center justify-center"
            >
              {isSidebarCollapsed ? (
                <ChevronRightIcon size={12} className="flex-shrink-0" />
              ) : (
                <ChevronLeftIcon size={12} className="flex-shrink-0" />
              )}
            </Button>

            {sidebarInner}
          </motion.aside>
        </div>

        {/* Mobile sidebar overlay */}
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/50 transition-opacity duration-150"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
          style={{
            opacity: mobileSidebarOpen ? 1 : 0,
            pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
          }}
        />

        {/* Mobile sidebar drawer */}
        <div
          role="dialog"
          aria-label="Navigation menu"
          aria-modal={mobileSidebarOpen}
          aria-hidden={!mobileSidebarOpen}
          className="lg:hidden fixed left-0 top-0 bottom-0 z-[60] w-[288px] bg-background border-r border-border/60 transition-transform duration-300 ease-out"
          style={{
            transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
          }}
        >
          {sidebarInner}
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 transition-all duration-500 overflow-y-auto no-scrollbar relative">
          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-3 py-2 bg-background/85 backdrop-blur-md border-b border-border/50">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                <line x1="2" y1="4" x2="16" y2="4" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="14" x2="16" y2="14" />
              </svg>
            </button>
            <span className="font-logo text-base font-semibold text-foreground tracking-tight">Lumina</span>
          </div>

          {/* Content area */}
          <div className="w-full max-w-[1024px] min-[1800px]:max-w-[1280px] min-[1800px]:mx-auto flex-1 flex flex-col min-h-0 p-3 md:p-4 lg:px-8 lg:py-1.5 pt-2 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-4 lg:pb-1.5 relative">
            {children}
          </div>
        </main>

        {/* Global components */}
        <EventModal />
        <SonnerToaster />
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border pb-safe">
        <div className="flex px-1 pt-1.5 pb-1.5">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex-1 min-h-[52px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  active ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                }`}
                aria-label={item.label}
              >
                <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium leading-none tracking-wide ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Calendar Filters Dialog */}
      <CalendarFiltersDialog
        open={calendarFiltersOpen}
        onClose={() => setCalendarFiltersOpen(false)}
      />

      {/* Apple Calendar Connect Modal */}
      <AppleConnectModal
        open={appleConnectOpen}
        onClose={() => setAppleConnectOpen(false)}
        onSuccess={handleAppleConnectSuccess}
      />
    </>
  );
}

/* ─── Integration badge ─────────────────────────────────────────────── */
const IntegrationBadge: React.FC<{
  connected: boolean;
  loading: boolean;
  syncing: boolean;
}> = ({ connected, loading, syncing }) => {
  if (loading) {
    return (
      <span className="text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
      </span>
    );
  }

  if (connected) {
    return (
      <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${syncing ? 'animate-pulse' : ''}`} />
        {syncing ? 'Syncing' : 'Synced'}
      </span>
    );
  }

  return (
    <span className="text-[10px] text-muted-foreground/50 font-medium">
      Not synced
    </span>
  );
};
