/**
 * storage.ts
 *
 * Shared, SSR-safe localStorage helpers used across all Zustand stores.
 * Every function is:
 *  - Null-key-safe (nullable keys treated as "no-op" gracefully).
 *  - SSR-safe (guards on `typeof window`).
 *  - Quota-error-safe (storage failures are swallowed; they must never crash the UI).
 */

export const canUseStorage = typeof window !== 'undefined';

export function getStorageItem(key: string | null): string | null {
  if (!key || !canUseStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string | null, value: string): void {
  if (!key || !canUseStorage) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore quota / private-mode write failures — UI stays optimistic.
  }
}

export function removeStorageItem(key: string | null): void {
  if (!key || !canUseStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage remove failures.
  }
}

/**
 * Read and JSON-parse a localStorage value, returning `fallback` on any error.
 * Generic so callers get a typed value without casting.
 */
export function readStorageJSON<T>(key: string, fallback: T): T {
  const raw = getStorageItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Keys that survive logout/clear — purely browser-level UX preferences with
// no relation to user data or identity.
const PRESERVE_ON_CLEAR = new Set<string>([
  'lumina-theme',         // next-themes
  'lumina_theme',
  'lumina-pwa-installed', // PWA install banner
  'lumina-pwa-snooze',
]);

/**
 * Clear every Lumina-owned key from localStorage and sessionStorage.
 *
 * Used on signout and on cross-user-id detection so no per-user data leaks
 * across sessions. Theme + PWA install flags are intentionally preserved.
 */
export function clearLuminaStorage(): void {
  if (!canUseStorage) return;
  try {
    const lsKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('lumina-') || key.startsWith('lumina_') || key.startsWith('lumina:')) &&
        !PRESERVE_ON_CLEAR.has(key)
      ) {
        lsKeys.push(key);
      }
    }
    lsKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
  try {
    const ssKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('lumina-') || key.startsWith('lumina_') || key.startsWith('lumina:'))) {
        ssKeys.push(key);
      }
    }
    ssKeys.forEach((k) => {
      try { sessionStorage.removeItem(k); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
}
