import { createCreatePoolUseCase } from './create-pool';
import type { ComplianceRepository } from '../ports/compliance-repository';
import type { PoolRepository } from '../ports/pool-repository';

describe('createCreatePoolUseCase', () => {
  const complianceRepo: ComplianceRepository = {
    getCb: jest.fn(),
    upsertCb: jest.fn(),
    getAdjustedCb: jest.fn(),
  };

  const poolRepo: PoolRepository = {
    createPool: jest.fn().mockResolvedValue({ poolId: 'pool-1' }),
  };

  it('throws when sum of adjusted CB < 0', async () => {
    (complianceRepo.getAdjustedCb as jest.Mock)
      .mockResolvedValueOnce(-100)
      .mockResolvedValueOnce(-50);
    const useCase = createCreatePoolUseCase(complianceRepo, poolRepo);
    await expect(
      useCase.execute({ year: 2024, memberShipIds: ['S1', 'S2'] })
    ).rejects.toThrow('Pool sum of adjusted CB must be ≥ 0');
  });

  it('creates pool with greedy allocation', async () => {
    (complianceRepo.getAdjustedCb as jest.Mock)
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(-30);
    const useCase = createCreatePoolUseCase(complianceRepo, poolRepo);
    const result = await useCase.execute({ year: 2024, memberShipIds: ['S1', 'S2'] });
    expect(result.poolId).toBe('pool-1');
    expect(result.members).toHaveLength(2);
    const surplus = result.members.find((m) => m.shipId === 'S1');
    const deficit = result.members.find((m) => m.shipId === 'S2');
    expect(surplus?.cbBefore).toBe(100);
    expect(surplus?.cbAfter).toBe(70);
    expect(deficit?.cbBefore).toBe(-30);
    expect(deficit?.cbAfter).toBe(0);
  });
});
