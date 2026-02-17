import { PrismaClient } from '@prisma/client';
import type { PoolMemberAllocation } from '../../../core/domain/pool';
import type { PoolRepository } from '../../../core/ports/pool-repository';

export function createPrismaPoolRepository(prisma: PrismaClient): PoolRepository {
  return {
    async createPool(year: number, members: PoolMemberAllocation[]): Promise<{ poolId: string }> {
      const pool = await prisma.pool.create({
        data: {
          year,
          members: {
            create: members.map((m) => ({
              ship_id: m.shipId,
              cb_before: m.cbBefore,
              cb_after: m.cbAfter,
            })),
          },
        },
      });
      return { poolId: pool.id };
    },
  };
}
