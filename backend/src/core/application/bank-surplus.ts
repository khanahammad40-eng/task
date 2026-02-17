import type { BankRepository } from '../ports/bank-repository';
import type { GetCbUseCase } from './compute-cb';

export interface BankSurplusUseCase {
  execute(shipId: string, year: number): Promise<{ banked: number }>;
}

export function createBankSurplusUseCase(
  getCb: GetCbUseCase,
  bankRepo: BankRepository
): BankSurplusUseCase {
  return {
    async execute(shipId: string, year: number): Promise<{ banked: number }> {
      const balance = await getCb.execute(shipId, year);
      if (balance.cb <= 0) {
        throw new Error('Compliance balance must be positive to bank');
      }
      await bankRepo.bank(shipId, year, balance.cb);
      return { banked: balance.cb };
    },
  };
}
