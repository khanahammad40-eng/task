import type { BankEntry } from '../domain/banking';

export interface BankRepository {
  getRecords(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  bank(shipId: string, year: number, amountGco2eq: number): Promise<BankEntry>;
  apply(shipId: string, year: number, amountGco2eq: number): Promise<void>;
}
