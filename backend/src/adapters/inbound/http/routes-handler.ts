import type { Request, Response } from 'express';
import type { RouteRepository } from '../../../core/ports/route-repository';
import type { ComputeComparisonUseCase } from '../../../core/application/compute-comparison';

export function createRoutesHandler(
  routeRepo: RouteRepository,
  computeComparison: ComputeComparisonUseCase
) {
  return {
    async getAll(req: Request, res: Response): Promise<void> {
      try {
        const routes = await routeRepo.findAll();
        res.json(routes);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    },
    async setBaseline(req: Request, res: Response): Promise<void> {
      try {
        const routeId = req.params.routeId ?? req.params.id;
        const route = await routeRepo.setBaseline(routeId);
        res.json(route);
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
    async getComparison(req: Request, res: Response): Promise<void> {
      try {
        const data = await computeComparison.execute();
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    },
  };
}
