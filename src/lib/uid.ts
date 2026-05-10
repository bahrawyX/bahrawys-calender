/**
 * uid.ts
 *
 * Shared unique-ID generator.
 * Combines a random base-36 segment with a timestamp suffix for practical
 * collision-freedom in a single-user client-side context.
 *
 * @param prefix Optional string prepended to the ID (e.g. "plan_", "task_").
 */
export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
