import { createBankSurplusUseCase } from './bank-surplus';
import type { GetCbUseCase } from './compute-cb';
import type { BankRepository } from '../ports/bank-repository';

describe('createBankSurplusUseCase', () => {
  const getCb: GetCbUseCase = {
    execute: jest.fn(),
  };

  const bankRepo: BankRepository = {
    getRecords: jest.fn(),
    getTotalBanked: jest.fn(),
    bank: jest.fn().mockResolvedValue({ id: '1', shipId: 'R001', year: 2024, amountGco2eq: 100, createdAt: new Date() }),
    apply: jest.fn(),
  };

  it('throws when CB <= 0', async () => {
    (getCb.execute as jest.Mock).mockResolvedValue({ shipId: 'R001', year: 2024, cb: 0 });
    const useCase = createBankSurplusUseCase(getCb, bankRepo);
    await expect(useCase.execute('R001', 2024)).rejects.toThrow('Compliance balance must be positive');
    (getCb.execute as jest.Mock).mockResolvedValue({ shipId: 'R001', year: 2024, cb: -10 });
    await expect(useCase.execute('R001', 2024)).rejects.toThrow('Compliance balance must be positive');
  });

  it('banks positive CB and returns banked amount', async () => {
    (getCb.execute as jest.Mock).mockResolvedValue({ shipId: 'R001', year: 2024, cb: 100 });
    const useCase = createBankSurplusUseCase(getCb, bankRepo);
    const result = await useCase.execute('R001', 2024);
    expect(bankRepo.bank).toHaveBeenCalledWith('R001', 2024, 100);
    expect(result.banked).toBe(100);
  });
});
