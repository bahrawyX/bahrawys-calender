import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  dailyBrief: boolean;
  eventReminders: boolean;
  streakReminder: boolean;
  taskReminders: boolean;
  focusComplete: boolean;
}

interface NotificationState {
  permission: NotificationPermission;
  subscription: PushSubscriptionJSON | null;
  preferences: NotificationPreferences;
  isSupported: boolean;
  initialized: boolean;
}

interface NotificationActions {
  init: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyBrief: true,
  eventReminders: true,
  streakReminder: true,
  taskReminders: true,
  focusComplete: false,
};

// ── Store ────────────────────────────────────────────────────────────────────

// Notification preferences live in `users.notificationPreferences` in the
// DB. The previous `lumina-notifications` persist payload duplicated those
// values into localStorage and meant a freshly-wiped or different user
// briefly saw the previous user's prefs before init() overwrote them.
export const useNotificationStore = create<NotificationState & NotificationActions>(
    (set, get) => ({
      permission: 'default' as NotificationPermission,
      subscription: null,
      preferences: DEFAULT_PREFERENCES,
      isSupported: false,
      initialized: false,

      init: async () => {
        if (typeof window === 'undefined') return;
        if (get().initialized) return;

        const isSupported =
          'Notification' in window &&
          'serviceWorker' in navigator &&
          'PushManager' in window;

        const permission = isSupported
          ? Notification.permission
          : ('denied' as NotificationPermission);

        set({ isSupported, permission, initialized: true });

        // If already granted, check for existing subscription
        if (permission === 'granted' && isSupported) {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              set({ subscription: sub.toJSON() as PushSubscriptionJSON });
            }
          } catch {
            // SW not ready yet — ok
          }
        }

        // Fetch server preferences and sync timezone
        try {
          const res = await fetch('/api/users/notification-preferences');
          if (res.ok) {
            const data = await res.json();
            if (data.preferences) {
              set({ preferences: { ...DEFAULT_PREFERENCES, ...data.preferences } });
            }
          }
          // Sync browser timezone to server so cron jobs use the correct local time
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz) {
            fetch('/api/users/notification-preferences', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timezone: tz }),
            }).catch(() => { /* fire-and-forget */ });
          }
        } catch {
          // Offline or not logged in — use cached
        }
      },

      requestPermission: async () => {
        if (!get().isSupported) return false;

        try {
          const result = await Notification.requestPermission();
          set({ permission: result });

          if (result === 'granted') {
            await get().subscribe();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      subscribe: async () => {
        if (!get().isSupported) return;

        try {
          const reg = await navigator.serviceWorker.ready;
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidKey) return;

          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });

          const subJson = sub.toJSON() as PushSubscriptionJSON;
          set({ subscription: subJson });

          // Send to server
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: subJson }),
          });
        } catch (err) {
          console.error('[Notifications] Subscribe failed:', err);
        }
      },

      unsubscribe: async () => {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            const endpoint = sub.endpoint;
            await sub.unsubscribe();

            // Remove from server
            await fetch('/api/push/subscribe', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint }),
            });
          }
          set({ subscription: null });
        } catch (err) {
          console.error('[Notifications] Unsubscribe failed:', err);
          set({ subscription: null });
        }
      },

      updatePreferences: async (prefs) => {
        const current = get().preferences;
        const merged = { ...current, ...prefs };
        set({ preferences: merged });

        try {
          await fetch('/api/users/notification-preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefs),
          });
        } catch {
          // Revert on failure
          set({ preferences: current });
        }
      },
    }),
);
