import type { BankResult } from '../domain/banking';
import type { BankRepository } from '../ports/bank-repository';
import type { GetCbUseCase } from './compute-cb';

/** Apply does not change stored CB; effective CB = base CB + sum(bank entries). */
export interface ApplyBankedUseCase {
  execute(shipId: string, year: number, amount: number): Promise<BankResult>;
}

export function createApplyBankedUseCase(
  getCb: GetCbUseCase,
  bankRepo: BankRepository
): ApplyBankedUseCase {
  return {
    async execute(shipId: string, year: number, amount: number): Promise<BankResult> {
      const balance = await getCb.execute(shipId, year);
      const available = await bankRepo.getTotalBanked(shipId, year);
      if (amount > available) {
        throw new Error(`Cannot apply ${amount}: only ${available} available in bank`);
      }
      if (amount <= 0) {
        throw new Error('Apply amount must be positive');
      }
      await bankRepo.apply(shipId, year, amount);
      const cbAfter = balance.cb + amount;
      return {
        shipId,
        year,
        cbBefore: balance.cb,
        applied: amount,
        cbAfter,
      };
    },
  };
}
