import { useEffect, useState } from 'react';
import { api } from '../infrastructure/api-client-adapter';
import type { AdjustedCbItem } from '../../core/domain/banking';

export function PoolingTab() {
  const [year, setYear] = useState(2024);
  const [members, setMembers] = useState<AdjustedCbItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ poolId: string; members: { shipId: string; cbBefore: number; cbAfter: number }[] } | null>(null);

  const loadAdjustedCb = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdjustedCb(year);
      setMembers(data);
      setSelectedIds(new Set());
      setResult(null);
    } catch (e) {
      setError((e as Error).message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdjustedCb();
  }, [year]);

  const toggle = (shipId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(shipId)) next.delete(shipId);
      else next.add(shipId);
      return next;
    });
  };

  const selectedMembers = members.filter((m) => selectedIds.has(m.shipId));
  const poolSum = selectedMembers.reduce((s, m) => s + m.adjustedCb, 0);
  const isValid = selectedMembers.length > 0 && poolSum >= 0;

  const createPool = async () => {
    if (!isValid) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.createPool(year, selectedMembers.map((m) => m.shipId));
      setResult({ poolId: res.poolId, members: res.members });
      await loadAdjustedCb();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p className="text-slate-400">Loading adjusted CB…</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
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
          onClick={loadAdjustedCb}
          className="rounded bg-slate-700 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>
      <p className="text-slate-400 text-sm">
        Select ships to pool. Sum(adjusted CB) must be ≥ 0. Deficit ship cannot exit worse; surplus cannot exit negative.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 w-12">Select</th>
              <th className="px-4 py-3">shipId</th>
              <th className="px-4 py-3">adjustedCb (gCO₂eq)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {members.map((m) => (
              <tr key={m.shipId} className="hover:bg-slate-800/50">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(m.shipId)}
                    onChange={() => toggle(m.shipId)}
                    className="rounded border-slate-600"
                  />
                </td>
                <td className="px-4 py-2 font-medium">{m.shipId}</td>
                <td className={`px-4 py-2 ${m.adjustedCb >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.adjustedCb.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4">
        <span className={`rounded px-3 py-1.5 text-sm font-medium ${poolSum >= 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
          Pool sum: {poolSum.toFixed(2)}
        </span>
        <button
          onClick={createPool}
          disabled={!isValid || creating}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating…' : 'Create Pool'}
        </button>
      </div>
      {result && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-slate-300 font-medium mb-2">Pool created: {result.poolId}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1">shipId</th>
                <th className="text-left py-1">cb_before</th>
                <th className="text-left py-1">cb_after</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {result.members.map((m) => (
                <tr key={m.shipId}>
                  <td className="py-1">{m.shipId}</td>
                  <td className="py-1">{m.cbBefore.toFixed(2)}</td>
                  <td className="py-1">{m.cbAfter.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
