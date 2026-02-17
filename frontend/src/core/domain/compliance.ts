export interface ComplianceBalance {
  shipId: string;
  year: number;
  cb: number;
  cbBefore?: number;
  applied?: number;
  cbAfter?: number;
}
