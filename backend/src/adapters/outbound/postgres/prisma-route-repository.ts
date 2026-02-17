import { PrismaClient } from '@prisma/client';
import type { Route } from '../../../core/domain/route';
import type { RouteRepository } from '../../../core/ports/route-repository';

function toDomain(r: {
  id: string;
  route_id: string;
  vessel_type: string;
  fuel_type: string;
  year: number;
  ghg_intensity: number;
  fuel_consumption: number;
  distance: number;
  total_emissions: number;
  is_baseline: boolean;
}): Route {
  return {
    id: r.id,
    routeId: r.route_id,
    vesselType: r.vessel_type,
    fuelType: r.fuel_type,
    year: r.year,
    ghgIntensity: r.ghg_intensity,
    fuelConsumption: r.fuel_consumption,
    distance: r.distance,
    totalEmissions: r.total_emissions,
    isBaseline: r.is_baseline,
  };
}

export function createPrismaRouteRepository(prisma: PrismaClient): RouteRepository {
  return {
    async findAll(): Promise<Route[]> {
      const rows = await prisma.route.findMany({ orderBy: { route_id: 'asc' } });
      return rows.map(toDomain);
    },
    async findByRouteId(routeId: string): Promise<Route | null> {
      const row = await prisma.route.findUnique({ where: { route_id: routeId } });
      return row ? toDomain(row) : null;
    },
    async setBaseline(routeId: string): Promise<Route> {
      await prisma.$transaction([
        prisma.route.updateMany({ data: { is_baseline: false } }),
        prisma.route.update({ where: { route_id: routeId }, data: { is_baseline: true } }),
      ]);
      const row = await prisma.route.findUnique({ where: { route_id: routeId } });
      if (!row) throw new Error('Route not found');
      return toDomain(row);
    },
  };
}
