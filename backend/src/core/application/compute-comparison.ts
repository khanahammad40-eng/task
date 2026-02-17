import type { Route } from '../domain/route';
import type { RouteComparison } from '../domain/route';
import type { RouteRepository } from '../ports/route-repository';
import { TARGET_INTENSITY_2025 } from '../../shared/constants';

export function computePercentDiff(baseline: number, comparison: number): number {
  if (baseline === 0) return 0;
  return ((comparison / baseline) - 1) * 100;
}

export function isCompliant(ghgIntensity: number, target: number = TARGET_INTENSITY_2025): boolean {
  return ghgIntensity <= target;
}

export interface ComputeComparisonUseCase {
  execute(): Promise<RouteComparison[]>;
}

export function createComputeComparisonUseCase(
  routeRepo: RouteRepository
): ComputeComparisonUseCase {
  return {
    async execute(): Promise<RouteComparison[]> {
      const routes = await routeRepo.findAll();
      const baseline = routes.find((r) => r.isBaseline);
      if (!baseline) return [];

      const comparisons: RouteComparison[] = routes
        .filter((r) => r.routeId !== baseline.routeId)
        .map((r) => {
          const percentDiff = computePercentDiff(baseline.ghgIntensity, r.ghgIntensity);
          const compliant = isCompliant(r.ghgIntensity);
          return {
            routeId: r.routeId,
            vesselType: r.vesselType,
            fuelType: r.fuelType,
            year: r.year,
            baselineGhgIntensity: baseline.ghgIntensity,
            comparisonGhgIntensity: r.ghgIntensity,
            percentDiff,
            compliant,
          };
        });
      return comparisons;
    },
  };
}
