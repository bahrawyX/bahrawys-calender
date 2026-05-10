import type { FocusSessionLength } from '@/store/useOnboardingStore';
import type { FocusMode } from '@/types';

export function normalizeFocusMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 25;
  return Math.max(5, Math.min(240, Math.round(minutes)));
}

export function focusSessionSelectionToMinutes(
  selection: FocusSessionLength,
  customFocusMinutes: number,
): number {
  switch (selection) {
    case '25/5':
      return 25;
    case '50/10':
      return 50;
    case '90/20':
      return 90;
    case 'custom':
      return normalizeFocusMinutes(customFocusMinutes);
    default:
      return 25;
  }
}

export function focusModeFromMinutes(minutes: number): FocusMode {
  return normalizeFocusMinutes(minutes) > 30 ? 'deep' : 'classic';
}
