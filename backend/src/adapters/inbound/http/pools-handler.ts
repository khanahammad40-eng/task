import type { Request, Response } from 'express';
import type { CreatePoolUseCase } from '../../../core/application/create-pool';

export function createPoolsHandler(createPool: CreatePoolUseCase) {
  return {
    async create(req: Request, res: Response): Promise<void> {
      try {
        const { year, memberShipIds } = req.body as { year?: number; memberShipIds?: string[] };
        if (!year || !Array.isArray(memberShipIds)) {
          res.status(400).json({ error: 'year and memberShipIds array are required in body' });
          return;
        }
        const result = await createPool.execute({ year, memberShipIds });
        res.status(201).json(result);
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  };
}
