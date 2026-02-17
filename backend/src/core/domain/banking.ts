export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: Date;
}

export interface BankResult {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
}
