import { ContributionWeights, DailyContributionInputs, DEFAULT_CONTRIBUTION_WEIGHTS } from '../../types/performance';

export function computeContributionScoreForDay(
  input: DailyContributionInputs,
  weights: ContributionWeights = DEFAULT_CONTRIBUTION_WEIGHTS,
): number {
  return (
    input.completedTasks * weights.completedTasks +
    input.focusSessions * weights.focusSessions +
    (input.scheduledEvents ?? 0) * weights.scheduledEvents +
    input.completedEvents * weights.completedEvents +
    input.completedPlannerItems * weights.completedPlannerItems
  );
}
