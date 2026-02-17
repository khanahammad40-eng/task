import { createApplyBankedUseCase } from './apply-banked';
import type { GetCbUseCase } from './compute-cb';
import type { BankRepository } from '../ports/bank-repository';

describe('createApplyBankedUseCase', () => {
  const getCb: GetCbUseCase = {
    execute: jest.fn().mockResolvedValue({ shipId: 'R001', year: 2024, cb: -50 }),
  };
  const bankRepo: BankRepository = {
    getRecords: jest.fn(),
    getTotalBanked: jest.fn().mockResolvedValue(100),
    bank: jest.fn(),
    apply: jest.fn().mockResolvedValue(undefined),
  };

  it('throws when amount > available banked', async () => {
    const useCase = createApplyBankedUseCase(getCb, bankRepo);
    await expect(useCase.execute('R001', 2024, 150)).rejects.toThrow(/only 100 available/);
  });

  it('applies amount and returns cbBefore, applied, cbAfter', async () => {
    const useCase = createApplyBankedUseCase(getCb, bankRepo);
    const result = await useCase.execute('R001', 2024, 50);
    expect(bankRepo.apply).toHaveBeenCalledWith('R001', 2024, 50);
    expect(result).toEqual({ shipId: 'R001', year: 2024, cbBefore: -50, applied: 50, cbAfter: 0 });
  });
});
