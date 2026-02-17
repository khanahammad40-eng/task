import { PrismaClient } from '@prisma/client';
import type { ComplianceBalance } from '../../../core/domain/compliance';
import type { ComplianceRepository } from '../../../core/ports/compliance-repository';

export function createPrismaComplianceRepository(prisma: PrismaClient): ComplianceRepository {
  return {
    async getCb(shipId: string, year: number): Promise<ComplianceBalance | null> {
      const row = await prisma.shipCompliance.findUnique({
        where: { ship_id_year: { ship_id: shipId, year } },
      });
      if (!row) return null;
      return { shipId: row.ship_id, year: row.year, cb: row.cb_gco2eq };
    },
    async upsertCb(shipId: string, year: number, cbGco2eq: number): Promise<ComplianceBalance> {
      await prisma.shipCompliance.upsert({
        where: { ship_id_year: { ship_id: shipId, year } },
        create: { ship_id: shipId, year, cb_gco2eq: cbGco2eq },
        update: { cb_gco2eq: cbGco2eq },
      });
      return { shipId, year, cb: cbGco2eq };
    },
    async getAdjustedCb(shipId: string, year: number): Promise<number> {
      const balance = await this.getCb(shipId, year);
      const baseCb = balance?.cb ?? 0;
      const entries = await prisma.bankEntry.findMany({
        where: { ship_id: shipId, year },
      });
      const bankNet = entries.reduce((s, e) => s + e.amount_gco2eq, 0);
      return baseCb + bankNet;
    },
  };
}
