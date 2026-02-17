import type { Route, RouteComparison } from '../domain/route';
import type { ComplianceBalance } from '../domain/compliance';
import type { BankResult, AdjustedCbItem } from '../domain/banking';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json();
}

export interface ApiClient {
  getRoutes(): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<RouteComparison[]>;
  getCb(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedCb(year: number): Promise<AdjustedCbItem[]>;
  getBankRecords(shipId: string, year: number): Promise<{ id: string; shipId: string; year: number; amountGco2eq: number }[]>;
  bank(shipId: string, year: number): Promise<{ banked: number }>;
  apply(shipId: string, year: number, amount: number): Promise<BankResult>;
  createPool(year: number, memberShipIds: string[]): Promise<{ poolId: string; year: number; members: { shipId: string; cbBefore: number; cbAfter: number }[] }>;
}

export function createApiClient(): ApiClient {
  return {
    getRoutes: () => fetchJson<Route[]>(`/routes`),
    setBaseline: (routeId) => fetchJson<Route>(`/routes/${routeId}/baseline`, { method: 'POST' }),
    getComparison: () => fetchJson<RouteComparison[]>(`/routes/comparison`),
    getCb: (shipId, year) => fetchJson<ComplianceBalance>(`/compliance/cb?shipId=${encodeURIComponent(shipId)}&year=${year}`),
    getAdjustedCb: (year) => fetchJson<AdjustedCbItem[]>(`/compliance/adjusted-cb?year=${year}`),
    getBankRecords: (shipId, year) => fetchJson(`/banking/records?shipId=${encodeURIComponent(shipId)}&year=${year}`),
    bank: (shipId, year) => fetchJson(`/banking/bank`, { method: 'POST', body: JSON.stringify({ shipId, year }) }),
    apply: (shipId, year, amount) => fetchJson<BankResult>(`/banking/apply`, { method: 'POST', body: JSON.stringify({ shipId, year, amount }) }),
    createPool: (year, memberShipIds) => fetchJson(`/pools`, { method: 'POST', body: JSON.stringify({ year, memberShipIds }) }),
  };
}
