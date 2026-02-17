import {
  computeCbFromRoute,
  createGetCbUseCase,
} from './compute-cb';
import type { RouteRepository } from '../ports/route-repository';
import type { ComplianceRepository } from '../ports/compliance-repository';
import { TARGET_INTENSITY_2025, MJ_PER_TONNE_FUEL } from '../../shared/constants';

describe('computeCbFromRoute', () => {
  it('computes (Target - Actual) * Energy with energy = fuelConsumption * 41000', () => {
    const target = 89.3368;
    const actual = 91;
    const fuel = 5000;
    const energy = fuel * MJ_PER_TONNE_FUEL;
    const expected = (target - actual) * energy;
    expect(computeCbFromRoute(target, actual, fuel)).toBeCloseTo(expected);
  });

  it('positive CB when actual < target (surplus)', () => {
    const cb = computeCbFromRoute(90, 88, 1000);
    expect(cb).toBeGreaterThan(0);
  });

  it('negative CB when actual > target (deficit)', () => {
    const cb = computeCbFromRoute(90, 93, 1000);
    expect(cb).toBeLessThan(0);
  });
});

describe('createGetCbUseCase', () => {
  const route = {
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

  const routeRepo: RouteRepository = {
    findAll: jest.fn(),
    findByRouteId: jest.fn().mockResolvedValue(route),
    setBaseline: jest.fn(),
  };

  const complianceRepo: ComplianceRepository = {
    getCb: jest.fn().mockResolvedValue(null),
    upsertCb: jest.fn().mockImplementation((_s, _y, cb) => Promise.resolve({ shipId: 'R001', year: 2024, cb })),
    getAdjustedCb: jest.fn(),
  };

  it('computes and stores CB for route matching shipId and year', async () => {
    const useCase = createGetCbUseCase(routeRepo, complianceRepo);
    const result = await useCase.execute('R001', 2024);
    expect(complianceRepo.upsertCb).toHaveBeenCalledWith('R001', 2024, expect.any(Number));
    expect(result.cb).toBeCloseTo(
      (TARGET_INTENSITY_2025 - 91) * (5000 * MJ_PER_TONNE_FUEL)
    );
  });
});
