import type { CreatePoolCommand, CreatePoolResult, PoolMemberAllocation } from '../domain/pool';
import type { ComplianceRepository } from '../ports/compliance-repository';
import type { PoolRepository } from '../ports/pool-repository';

/**
 * Pool rules:
 * - Sum(adjustedCB) ≥ 0
 * - Deficit ship cannot exit worse (cb_after >= cb_before)
 * - Surplus ship cannot exit negative (cb_after >= 0)
 * Greedy: sort members desc by CB, transfer surplus to deficits.
 */
export interface CreatePoolUseCase {
  execute(cmd: CreatePoolCommand): Promise<CreatePoolResult>;
}

export function createCreatePoolUseCase(
  complianceRepo: ComplianceRepository,
  poolRepo: PoolRepository
): CreatePoolUseCase {
  return {
    async execute(cmd: CreatePoolCommand): Promise<CreatePoolResult> {
      const { year, memberShipIds } = cmd;
      if (!memberShipIds.length) {
        throw new Error('Pool must have at least one member');
      }

      const cbs = await Promise.all(
        memberShipIds.map(async (shipId) => {
          const cb = await complianceRepo.getAdjustedCb(shipId, year);
          return { shipId, cb };
        })
      );

      const sumCb = cbs.reduce((s, m) => s + m.cb, 0);
      if (sumCb < 0) {
        throw new Error('Pool sum of adjusted CB must be ≥ 0');
      }

      const surplus = cbs.filter((m) => m.cb > 0).sort((a, b) => b.cb - a.cb);
      const deficit = cbs.filter((m) => m.cb < 0).sort((a, b) => a.cb - b.cb); // most deficit first
      const zero = cbs.filter((m) => m.cb === 0);

      const surplusRemaining = surplus.map((m) => ({ shipId: m.shipId, remaining: m.cb }));
      const resultAllocations: PoolMemberAllocation[] = [];

      for (const m of surplus) {
        resultAllocations.push({ shipId: m.shipId, cbBefore: m.cb, cbAfter: m.cb });
      }
      for (const m of zero) {
        resultAllocations.push({ shipId: m.shipId, cbBefore: m.cb, cbAfter: m.cb });
      }

      for (const m of deficit) {
        const need = Math.abs(m.cb);
        let received = 0;
        for (const s of surplusRemaining) {
          if (received >= need) break;
          const alloc = resultAllocations.find((a) => a.shipId === s.shipId);
          const available = alloc ? alloc.cbAfter : s.remaining;
          const toGive = Math.min(available, need - received);
          if (toGive > 0) {
            received += toGive;
            if (alloc) alloc.cbAfter -= toGive;
            s.remaining -= toGive;
          }
        }
        const cbAfter = m.cb + received;
        if (cbAfter < m.cb) {
          throw new Error('Deficit ship cannot exit pool worse');
        }
        resultAllocations.push({ shipId: m.shipId, cbBefore: m.cb, cbAfter });
      }

      for (const a of resultAllocations) {
        if (a.cbAfter < 0) {
          throw new Error('Surplus ship cannot exit pool with negative CB');
        }
      }

      const { poolId } = await poolRepo.createPool(year, resultAllocations);
      return { poolId, year, members: resultAllocations };
    },
  };
}
