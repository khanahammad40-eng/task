import type { Request, Response } from 'express';
import type { BankRepository } from '../../../core/ports/bank-repository';
import type { BankSurplusUseCase } from '../../../core/application/bank-surplus';
import type { ApplyBankedUseCase } from '../../../core/application/apply-banked';

export function createBankingHandler(
  bankRepo: BankRepository,
  bankSurplus: BankSurplusUseCase,
  applyBanked: ApplyBankedUseCase
) {
  return {
    async getRecords(req: Request, res: Response): Promise<void> {
      try {
        const shipId = (req.query.shipId as string) ?? (req.query.ship_id as string);
        const year = parseInt(req.query.year as string, 10);
        if (!shipId || !year) {
          res.status(400).json({ error: 'shipId and year are required' });
          return;
        }
        const records = await bankRepo.getRecords(shipId, year);
        res.json(records);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    },
    async bank(req: Request, res: Response): Promise<void> {
      try {
        const { shipId, year } = req.body as { shipId?: string; year?: number };
        if (!shipId || !year) {
          res.status(400).json({ error: 'shipId and year are required in body' });
          return;
        }
        const result = await bankSurplus.execute(shipId, year);
        res.json(result);
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
    async apply(req: Request, res: Response): Promise<void> {
      try {
        const { shipId, year, amount } = req.body as { shipId?: string; year?: number; amount?: number };
        if (!shipId || !year || amount == null) {
          res.status(400).json({ error: 'shipId, year and amount are required in body' });
          return;
        }
        const result = await applyBanked.execute(shipId, year, amount);
        res.json(result);
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  };
}
