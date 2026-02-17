export interface BankResult {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export interface AdjustedCbItem {
  shipId: string;
  year: number;
  adjustedCb: number;
}
