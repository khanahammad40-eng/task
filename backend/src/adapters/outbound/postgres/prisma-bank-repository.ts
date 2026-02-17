import { PrismaClient } from '@prisma/client';
import type { BankEntry } from '../../../core/domain/banking';
import type { BankRepository } from '../../../core/ports/bank-repository';

function toDomain(e: {
  id: string;
  ship_id: string;
  year: number;
  amount_gco2eq: number;
  created_at: Date;
}): BankEntry {
  return {
    id: e.id,
    shipId: e.ship_id,
    year: e.year,
    amountGco2eq: e.amount_gco2eq,
    createdAt: e.created_at,
  };
}

export function createPrismaBankRepository(prisma: PrismaClient): BankRepository {
  return {
    async getRecords(shipId: string, year: number): Promise<BankEntry[]> {
      const rows = await prisma.bankEntry.findMany({
        where: { ship_id: shipId, year },
        orderBy: { created_at: 'asc' },
      });
      return rows.map(toDomain);
    },
    async getTotalBanked(shipId: string, year: number): Promise<number> {
      const rows = await prisma.bankEntry.findMany({
        where: { ship_id: shipId, year },
      });
      return rows.reduce((s, r) => s + r.amount_gco2eq, 0);
    },
    async bank(shipId: string, year: number, amountGco2eq: number): Promise<BankEntry> {
      const row = await prisma.bankEntry.create({
        data: { ship_id: shipId, year, amount_gco2eq: amountGco2eq },
      });
      return toDomain(row);
    },
    async apply(shipId: string, year: number, amountGco2eq: number): Promise<void> {
      await prisma.bankEntry.create({
        data: { ship_id: shipId, year, amount_gco2eq: -amountGco2eq },
      });
    },
  };
}
