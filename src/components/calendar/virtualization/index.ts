export { useVisibleTimeRange } from './useVisibleTimeRange';
export type { VisibleTimeRange } from './useVisibleTimeRange';

export { useVirtualizedEvents, useVirtualizedEventsByDay } from './useVirtualizedEvents';
export type { VirtualizationStats, VirtualizedResult } from './useVirtualizedEvents';

export {
  useDensityGuard,
  calculateOverlapsWithGuard,
  MAX_EVENTS_BEFORE_COMPACT,
  MAX_VISIBLE_COLUMNS,
  MAX_EVENTS_PER_HOUR,
  MAX_VISIBLE_PER_HOUR,
  DENSE_HOUR_THRESHOLD,
} from './useDensityGuard';
export type { DensityInfo, HourDensityData } from './useDensityGuard';

export { usePerfDebug } from './usePerfDebug';

export { default as DensityOverflowIndicator } from './DensityOverflowIndicator';
