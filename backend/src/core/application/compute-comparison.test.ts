import {
  computePercentDiff,
  isCompliant,
  createComputeComparisonUseCase,
} from './compute-comparison';
import type { RouteRepository } from '../ports/route-repository';
import type { Route } from '../domain/route';
import { TARGET_INTENSITY_2025 } from '../../shared/constants';

describe('computePercentDiff', () => {
  it('computes ((comparison/baseline) - 1) * 100', () => {
    expect(computePercentDiff(100, 110)).toBeCloseTo(10);
    expect(computePercentDiff(91.16, 89.3368)).toBeCloseTo(-2);
    expect(computePercentDiff(50, 50)).toBe(0);
  });

  it('returns 0 when baseline is 0', () => {
    expect(computePercentDiff(0, 10)).toBe(0);
  });
});

describe('isCompliant', () => {
  it('returns true when intensity <= target', () => {
    expect(isCompliant(89, TARGET_INTENSITY_2025)).toBe(true);
    expect(isCompliant(TARGET_INTENSITY_2025, TARGET_INTENSITY_2025)).toBe(true);
  });

  it('returns false when intensity > target', () => {
    expect(isCompliant(91, TARGET_INTENSITY_2025)).toBe(false);
  });
});

describe('createComputeComparisonUseCase', () => {
  const baseline: Route = {
    id: '1',
    routeId: 'R001',
    vesselType: 'Container',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 91,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true,
  };
  const other: Route = {
    id: '2',
    routeId: 'R002',
    vesselType: 'BulkCarrier',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 88,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false,
  };

  const routeRepo: RouteRepository = {
    findAll: jest.fn().mockResolvedValue([baseline, other]),
    findByRouteId: jest.fn(),
    setBaseline: jest.fn(),
  };

  it('returns comparison with percentDiff and compliant', async () => {
    const useCase = createComputeComparisonUseCase(routeRepo);
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(result[0].routeId).toBe('R002');
    expect(result[0].baselineGhgIntensity).toBe(91);
    expect(result[0].comparisonGhgIntensity).toBe(88);
    expect(result[0].percentDiff).toBeCloseTo((88 / 91 - 1) * 100);
    expect(result[0].compliant).toBe(true);
  });

  it('returns empty when no baseline', async () => {
    const repoNoBaseline: RouteRepository = {
      ...routeRepo,
      findAll: jest.fn().mockResolvedValue([{ ...other, isBaseline: false }]),
    };
    const useCase = createComputeComparisonUseCase(repoNoBaseline);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
