import { useEffect, useState } from 'react';
import type { RouteComparison } from '../../core/domain/route';
import { api } from '../infrastructure/api-client-adapter';
import { TARGET_INTENSITY } from '../../shared/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export function CompareTab() {
  const [data, setData] = useState<RouteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getComparison()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="text-slate-400">Loading comparison…</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  const chartData = data.map((d) => ({
    name: d.routeId,
    baseline: d.baselineGhgIntensity,
    comparison: d.comparisonGhgIntensity,
    target: TARGET_INTENSITY,
  }));

  return (
    <div className="space-y-6">
      <p className="text-slate-400">
        Target: <strong className="text-slate-200">{TARGET_INTENSITY} gCO₂e/MJ</strong> (2% below 91.16)
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/80 text-slate-300">
            <tr>
              <th className="px-4 py-3">routeId</th>
              <th className="px-4 py-3">vesselType</th>
              <th className="px-4 py-3">fuelType</th>
              <th className="px-4 py-3">year</th>
              <th className="px-4 py-3">ghgIntensity (baseline)</th>
              <th className="px-4 py-3">ghgIntensity (comparison)</th>
              <th className="px-4 py-3">% difference</th>
              <th className="px-4 py-3">compliant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((d) => (
              <tr key={d.routeId} className="hover:bg-slate-800/50">
                <td className="px-4 py-2 font-medium">{d.routeId}</td>
                <td className="px-4 py-2">{d.vesselType}</td>
                <td className="px-4 py-2">{d.fuelType}</td>
                <td className="px-4 py-2">{d.year}</td>
                <td className="px-4 py-2">{d.baselineGhgIntensity}</td>
                <td className="px-4 py-2">{d.comparisonGhgIntensity}</td>
                <td className="px-4 py-2">{d.percentDiff.toFixed(2)}%</td>
                <td className="px-4 py-2">{d.compliant ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chartData.length > 0 && (
        <div className="h-80 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <ReferenceLine y={TARGET_INTENSITY} stroke="#f59e0b" strokeDasharray="3 3" label="Target" />
              <Bar dataKey="baseline" fill="#10b981" name="Baseline (gCO₂e/MJ)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="comparison" fill="#3b82f6" name="Comparison (gCO₂e/MJ)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length === 0 && <p className="text-slate-400">Set a baseline route to see comparisons.</p>}
    </div>
  );
}
