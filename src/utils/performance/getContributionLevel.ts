import { ContributionLevel } from '../../types/performance';

export interface ContributionLevelThresholds {
  lowMax: number;
  mediumLowMax: number;
  mediumHighMax: number;
  highMin: number;
}

const DEFAULT_THRESHOLDS: ContributionLevelThresholds = {
  lowMax: 2,
  mediumLowMax: 4,
  mediumHighMax: 7,
  highMin: 8,
};

export function getContributionLevel(
  score: number,
  thresholds: ContributionLevelThresholds = DEFAULT_THRESHOLDS
): ContributionLevel {
  if (score <= 0) return 0;
  if (score <= thresholds.lowMax) return 1;
  if (score <= thresholds.mediumLowMax) return 2;
  if (score <= thresholds.mediumHighMax) return 3;
  if (score >= thresholds.highMin) return 4;
  return 4;
}
