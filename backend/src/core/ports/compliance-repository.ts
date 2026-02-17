import type { ComplianceBalance } from '../domain/compliance';

export interface ComplianceRepository {
  getCb(shipId: string, year: number): Promise<ComplianceBalance | null>;
  upsertCb(shipId: string, year: number, cbGco2eq: number): Promise<ComplianceBalance>;
  getAdjustedCb(shipId: string, year: number): Promise<number>;
}
