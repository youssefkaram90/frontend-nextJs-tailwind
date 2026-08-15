"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlantStocks } from "@/app/lib/hooks/use-plant-stock";
import { useSearch } from "@/app/lib/use-search";
import type { PlantStockRow } from "@/app/lib/types/plant-stock";
import { Search, Sprout, Layers, ChevronRight } from "lucide-react";

type StockType = "SSM" | "LPM";

interface VarietyRow {
  variety: string;
  initialStock: number;
  harvested: number;
  lots: number;
}

interface LocationRow {
  location: string;
  initialStock: number;
  trays: number;
  sowings: number;
  varieties: string;
}

function groupByVariety(rows: PlantStockRow[]): VarietyRow[] {
  const map = new Map<string, VarietyRow>();
  for (const r of rows) {
    const cur =
      map.get(r.variety) ??
      ({
        variety: r.variety,
        initialStock: 0,
        harvested: 0,
        lots: 0,
      } as VarietyRow);
    cur.initialStock += r.expectedPlants;
    cur.lots += 1;
    map.set(r.variety, cur);
  }
  return [...map.values()].sort((a, b) => b.initialStock - a.initialStock);
}

function groupByLocation(rows: PlantStockRow[]): LocationRow[] {
  const map = new Map<string, LocationRow>();
  for (const r of rows) {
    const loc = r.location || "Not assigned";
    const cur =
      map.get(loc) ??
      ({
        location: loc,
        initialStock: 0,
        trays: 0,
        sowings: 0,
        varieties: "",
      } as LocationRow);
    cur.initialStock += r.expectedPlants;
    cur.trays += r.numberOfTrays ?? 0;
    cur.sowings += 1;
    cur.varieties = cur.varieties
      ? `${cur.varieties}, ${r.variety}`
      : r.variety;
    map.set(loc, cur);
  }
  return [...map.values()].sort((a, b) => b.initialStock - a.initialStock);
}

function thClass() {
  return "px-6 py-3 text-left font-medium whitespace-nowrap";
}

function tdClass() {
  return "px-6 py-3 whitespace-nowrap";
}

export default function PlantStockPage() {
  const { query, setQuery, debouncedQuery } = useSearch();
  const [activeType, setActiveType] = useState<StockType>("SSM");
  const router = useRouter();

  const {
    data = [],
    isPending,
    error,
  } = usePlantStocks(debouncedQuery || undefined);

  const { ssm, lpm } = useMemo(() => {
    const ssm = data.filter((r) => r.ssmSowingId);
    const lpm = data.filter((r) => r.lpmSowingId);
    return { ssm, lpm };
  }, [data]);

  const rows = activeType === "SSM" ? ssm : lpm;

  const byVariety = useMemo(() => groupByVariety(rows), [rows]);
  const byLocation = useMemo(() => groupByLocation(rows), [rows]);

  const totals = useMemo(
    () => ({
      initialStock: rows.reduce((s, r) => s + r.expectedPlants, 0),
      trays: rows.reduce((s, r) => s + (r.numberOfTrays ?? 0), 0),
      sowings: rows.length,
    }),
    [rows],
  );

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  const isSSM = activeType === "SSM";

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plant Stock
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Plants in stock per variety and per location — SSM and LPM kept apart
        </p>
      </div>

      {/* Search + Type tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by variety, location or lot…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
          />
        </div>

        <div className="inline-flex rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
          {(["SSM", "LPM"] as StockType[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                activeType === t
                  ? "bg-green-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {t === "SSM" ? "SSM (Tunnel)" : "LPM (Sector)"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Initial stock (plants)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totals.initialStock.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">Sowings</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totals.sowings.toLocaleString()}
          </p>
        </div>
        {isSSM && (
          <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trays in tunnels
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totals.trays.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-10 text-center text-gray-500 dark:text-gray-400 shadow-xl">
          No {activeType} plant stock found.
        </div>
      ) : (
        <>
          {/* ═══ PART 1: PER VARIETY ═══ */}
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Sprout className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Per Variety
              </h2>
              <span className="text-xs text-gray-400 ml-auto">
                Harvest tracking coming soon — remain currently equals initial
                stock
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                    <th className={thClass()}>Variety</th>
                    <th className={thClass()}>Initial Stock</th>
                    <th className={thClass()}>Harvested</th>
                    <th className={thClass()}>Remain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {byVariety.map((v) => {
                    const remain = v.initialStock - v.harvested;
                    return (
                      <tr
                        key={v.variety}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td
                          className={`${tdClass()} font-medium text-gray-900 dark:text-white`}
                        >
                          {v.variety}
                        </td>
                        <td
                          className={`${tdClass()} text-gray-700 dark:text-gray-300`}
                        >
                          {v.initialStock.toLocaleString()}
                        </td>
                        <td className={`${tdClass()} text-gray-400`}>
                          {v.harvested > 0 ? v.harvested.toLocaleString() : "—"}
                        </td>
                        <td
                          className={`${tdClass()} font-semibold text-green-600 dark:text-green-400`}
                        >
                          {remain.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ PART 2: PER TUNNEL / SECTOR ═══ */}
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isSSM ? "Per Tunnel" : "Per Sector"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                    <th className={thClass()}>{isSSM ? "Tunnel" : "Sector"}</th>
                    {isSSM && <th className={thClass()}>Trays</th>}
                    <th className={thClass()}>Sowings</th>
                    <th className={thClass()}>Initial Stock</th>
                    <th className={thClass()}>Varieties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {byLocation.map((loc) => (
                    <tr
                      key={loc.location}
                      onClick={() =>
                        router.push(
                          `/plant-stock/${encodeURIComponent(loc.location)}`,
                        )
                      }
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td
                        className={`${tdClass()} font-medium text-gray-900 dark:text-white`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                          {loc.location}
                        </span>
                      </td>
                      {isSSM && (
                        <td
                          className={`${tdClass()} text-gray-700 dark:text-gray-300`}
                        >
                          {loc.trays.toLocaleString()}
                        </td>
                      )}
                      <td
                        className={`${tdClass()} text-gray-700 dark:text-gray-300`}
                      >
                        {loc.sowings.toLocaleString()}
                      </td>
                      <td
                        className={`${tdClass()} font-semibold text-green-600 dark:text-green-400`}
                      >
                        {loc.initialStock.toLocaleString()}
                      </td>
                      <td
                        className={`${tdClass()} text-gray-500 dark:text-gray-400 max-w-xs truncate`}
                      >
                        {loc.varieties}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
