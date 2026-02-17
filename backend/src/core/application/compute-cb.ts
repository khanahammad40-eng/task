import type { ComplianceBalance } from '../domain/compliance';
import type { RouteRepository } from '../ports/route-repository';
import type { ComplianceRepository } from '../ports/compliance-repository';
import type { BankRepository } from '../ports/bank-repository';
import { TARGET_INTENSITY_2025, MJ_PER_TONNE_FUEL } from '../../shared/constants';

/**
 * CB = (Target - Actual) × Energy in scope
 * Energy in scope (MJ) ≈ fuelConsumption × 41_000 MJ/t
 */
export function computeCbFromRoute(
  targetIntensity: number,
  actualIntensity: number,
  fuelConsumptionTonnes: number
): number {
  const energyMj = fuelConsumptionTonnes * MJ_PER_TONNE_FUEL;
  return (targetIntensity - actualIntensity) * energyMj;
}

export interface GetCbUseCase {
  execute(shipId: string, year: number): Promise<ComplianceBalance>;
}

export function createGetCbUseCase(
  routeRepo: RouteRepository,
  complianceRepo: ComplianceRepository
): GetCbUseCase {
  return {
    async execute(shipId: string, year: number): Promise<ComplianceBalance> {
      const route = await routeRepo.findByRouteId(shipId);
      if (!route || route.year !== year) {
        const existing = await complianceRepo.getCb(shipId, year);
        if (existing) return existing;
        return { shipId, year, cb: 0 };
      }
      const cb = computeCbFromRoute(
        TARGET_INTENSITY_2025,
        route.ghgIntensity,
        route.fuelConsumption
      );
      await complianceRepo.upsertCb(shipId, year, cb);
      return { shipId, year, cb };
    },
  };
}

export interface GetAdjustedCbUseCase {
  execute(shipId: string, year: number): Promise<number>;
}

export function createGetAdjustedCbUseCase(
  getCb: GetCbUseCase,
  bankRepo: BankRepository
): GetAdjustedCbUseCase {
  return {
    async execute(shipId: string, year: number): Promise<number> {
      const balance = await getCb.execute(shipId, year);
      const banked = await bankRepo.getTotalBanked(shipId, year);
      return balance.cb + banked;
    },
  };
}
