import type { PoolMemberAllocation } from '../domain/pool';

export interface PoolRepository {
  createPool(
    year: number,
    members: PoolMemberAllocation[]
  ): Promise<{ poolId: string }>;
}
