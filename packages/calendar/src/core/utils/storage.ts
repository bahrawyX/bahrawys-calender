/**
 * SSR-safe localStorage helpers.
 * Every function is null-key-safe, SSR-safe, and quota-error-safe.
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
    // Ignore quota / private-mode write failures
  }
}

export function removeStorageItem(key: string | null): void {
  if (!key || !canUseStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage remove failures
  }
}

/**
 * Read and JSON-parse a localStorage value, returning `fallback` on any error.
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
