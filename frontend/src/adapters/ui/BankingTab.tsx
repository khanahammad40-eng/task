import { useEffect, useState } from 'react';
import { api } from '../infrastructure/api-client-adapter';
import type { ComplianceBalance } from '../../core/domain/compliance';
import type { BankResult } from '../../core/domain/banking';

export function BankingTab() {
  const [shipId, setShipId] = useState('R001');
  const [year, setYear] = useState(2024);
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [applyAmount, setApplyAmount] = useState('');
  const [applyResult, setApplyResult] = useState<BankResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCb = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApplyResult(null);
    try {
      const data = await api.getCb(shipId, year);
      setCb(data);
    } catch (e) {
      setError((e as Error).message);
      setCb(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCb();
  }, [shipId, year]);

  const handleBank = async () => {
    setError(null);
    setSuccess(null);
    try {
      await api.bank(shipId, year);
      setSuccess('Surplus banked successfully.');
      await loadCb();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleApply = async () => {
    const amount = parseFloat(applyAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const result = await api.apply(shipId, year, amount);
      setApplyResult(result);
      setSuccess(`Applied ${amount}. CB after: ${result.cbAfter.toFixed(2)}`);
      setApplyAmount('');
      await loadCb();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const canBank = cb != null && cb.cb > 0;
  const hasBanked = cb != null; // could fetch bank records to show "Apply" only when banked > 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <span className="text-slate-400">Ship (route) ID</span>
          <input
            type="text"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-200"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-slate-400">Year</span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-200"
          />
        </label>
        <button
          onClick={loadCb}
          className="rounded bg-slate-700 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-600"
        >
          Refresh CB
        </button>
      </div>
      {error && <p className="text-red-400">Error: {error}</p>}
      {success && <p className="text-emerald-400">{success}</p>}
      {loading && <p className="text-slate-400">Loading…</p>}
      {!loading && cb != null && (
        <>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="text-slate-300 font-medium mb-2">Compliance Balance (CB)</h3>
            <p className="text-2xl font-semibold text-slate-100">
              {cb.cb.toFixed(2)} <span className="text-slate-400 text-sm">gCO₂eq</span>
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {cb.cb > 0 ? 'Surplus — you can bank.' : cb.cb < 0 ? 'Deficit — you can apply banked surplus.' : 'Zero.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleBank}
              disabled={!canBank}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bank surplus
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Amount to apply"
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                className="w-40 rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-200"
              />
              <button
                onClick={handleApply}
                disabled={!applyAmount}
                className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply banked
              </button>
            </div>
          </div>
          {applyResult && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm">
              <p>cb_before: {applyResult.cbBefore.toFixed(2)}</p>
              <p>applied: {applyResult.applied.toFixed(2)}</p>
              <p>cb_after: {applyResult.cbAfter.toFixed(2)}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
