import { useEffect, useState } from 'react';
import type { Route } from '../../core/domain/route';
import { api } from '../infrastructure/api-client-adapter';

export function RoutesTab() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVessel, setFilterVessel] = useState('');
  const [filterFuel, setFilterFuel] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRoutes();
      setRoutes(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = routes.filter((r) => {
    if (filterVessel && r.vesselType !== filterVessel) return false;
    if (filterFuel && r.fuelType !== filterFuel) return false;
    if (filterYear && String(r.year) !== filterYear) return false;
    return true;
  });

  const vesselTypes = [...new Set(routes.map((r) => r.vesselType))].sort();
  const fuelTypes = [...new Set(routes.map((r) => r.fuelType))].sort();
  const years = [...new Set(routes.map((r) => r.year))].sort();

  const setBaseline = async (routeId: string) => {
    setError(null);
    try {
      await api.setBaseline(routeId);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) return <p className="text-slate-400">Loading routes…</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-slate-400">Vessel type</span>
          <select
            value={filterVessel}
            onChange={(e) => setFilterVessel(e.target.value)}
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-200"
          >
            <option value="">All</option>
            {vesselTypes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-slate-400">Fuel type</span>
          <select
            value={filterFuel}
            onChange={(e) => setFilterFuel(e.target.value)}
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-200"
          >
            <option value="">All</option>
            {fuelTypes.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-slate-400">Year</span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-200"
          >
            <option value="">All</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-800/80 text-slate-300">
            <tr>
              <th className="px-4 py-3">routeId</th>
              <th className="px-4 py-3">vesselType</th>
              <th className="px-4 py-3">fuelType</th>
              <th className="px-4 py-3">year</th>
              <th className="px-4 py-3">ghgIntensity (gCO₂e/MJ)</th>
              <th className="px-4 py-3">fuelConsumption (t)</th>
              <th className="px-4 py-3">distance (km)</th>
              <th className="px-4 py-3">totalEmissions (t)</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50">
                <td className="px-4 py-2 font-medium">{r.routeId}</td>
                <td className="px-4 py-2">{r.vesselType}</td>
                <td className="px-4 py-2">{r.fuelType}</td>
                <td className="px-4 py-2">{r.year}</td>
                <td className="px-4 py-2">{r.ghgIntensity}</td>
                <td className="px-4 py-2">{r.fuelConsumption}</td>
                <td className="px-4 py-2">{r.distance}</td>
                <td className="px-4 py-2">{r.totalEmissions}</td>
                <td className="px-4 py-2">
                  {!r.isBaseline && (
                    <button
                      onClick={() => setBaseline(r.routeId)}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Set Baseline
                    </button>
                  )}
                  {r.isBaseline && <span className="text-emerald-400 text-xs">Baseline</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
