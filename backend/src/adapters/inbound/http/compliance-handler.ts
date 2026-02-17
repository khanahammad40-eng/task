import type { Request, Response } from 'express';
import type { GetCbUseCase } from '../../../core/application/compute-cb';
import type { GetAdjustedCbUseCase } from '../../../core/application/compute-cb';
import type { RouteRepository } from '../../../core/ports/route-repository';

export function createComplianceHandler(
  getCb: GetCbUseCase,
  getAdjustedCb: GetAdjustedCbUseCase,
  routeRepo: RouteRepository
) {
  return {
    async getCb(req: Request, res: Response): Promise<void> {
      try {
        const shipId = (req.query.shipId as string) ?? (req.query.ship_id as string);
        const year = parseInt(req.query.year as string, 10);
        if (!shipId || !year) {
          res.status(400).json({ error: 'shipId and year are required' });
          return;
        }
        const balance = await getCb.execute(shipId, year);
        res.json(balance);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    },
    async getAdjustedCb(req: Request, res: Response): Promise<void> {
      try {
        const shipId = (req.query.shipId as string) ?? (req.query.ship_id as string);
        const year = parseInt(req.query.year as string, 10);
        if (!year) {
          res.status(400).json({ error: 'year is required' });
          return;
        }
        if (shipId) {
          const adjusted = await getAdjustedCb.execute(shipId, year);
          res.json({ shipId, year, adjustedCb: adjusted });
          return;
        }
        const routes = await routeRepo.findAll();
        const shipIds = [...new Set(routes.filter((r) => r.year === year).map((r) => r.routeId))];
        const list = await Promise.all(
          shipIds.map(async (sid) => ({
            shipId: sid,
            year,
            adjustedCb: await getAdjustedCb.execute(sid, year),
          }))
        );
        res.json(list);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    },
  };
}
