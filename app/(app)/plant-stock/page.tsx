"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlantStocks } from "@/app/lib/hooks/use-plant-stock";
import { useSearch } from "@/app/lib/use-search";
import type { PlantStockRow } from "@/app/lib/types/plant-stock";
import { NOT_ASSIGNED_LOCATION } from "@/app/lib/sowing-constants";
import { Search, Sprout, Layers, ChevronRight } from "lucide-react";

type StockType = "SSM" | "LPM";

/**
 * Is this a place you can open, or just a bucket?
 *
 * `Not assigned` holds the trays that have not been transported yet. It is a
 * figure on the list (and a useful one), but there is nothing behind it: no
 * tunnel, no counts to take — a sample is always taken in a tunnel. So the row
 * is NOT a link (PSTOCK-23); before this it opened a page that could not find
 * itself, because the address arrives percent-encoded ("Not%20assigned") and
 * the detail page compared the raw text.
 */
function isPlace(location: string): boolean {
  return location !== NOT_ASSIGNED_LOCATION;
}

interface VarietyRow {
  variety: string;
  initialStock: number;
  harvested: number;
  /**
   * The server's own `remaining`, added up (PSTOCK-17).
   *
   * The subtraction used to be done again here, which is how two places start
   * disagreeing about one figure; the row already carries what is still standing.
   */
  remaining: number;
  /**
   * True when at least one row in this group has no `remaining` — a field that
   * has not been counted (HARV-08). The figure is then shown as "—" instead of
   * the sum of the rows that happen to have one, which would read as "0 left".
   */
  remainingUnknown: boolean;
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
        remaining: 0,
        remainingUnknown: false,
      } as VarietyRow);
    cur.initialStock += r.expectedPlants;
    cur.harvested += r.harvested ?? 0;
    if (r.remaining == null) {
      cur.remainingUnknown = true;
    } else {
      cur.remaining += r.remaining;
    }
    map.set(r.variety, cur);
  }
  return [...map.values()].sort((a, b) => b.initialStock - a.initialStock);
}

/**
 * One entry per location, in the order the SERVER sent the rows (PSTOCK-18).
 *
 * This used to sort by the digits inside the name — `T2` before `T10`, but also
 * `Sector 2` before `Field 12`, which is a number pulled out of a word. The
 * server now decides (tunnels by number, `Not assigned` first) and the phone
 * agrees, because neither client sorts any more.
 */
function groupByLocation(rows: PlantStockRow[]): LocationRow[] {
  const map = new Map<string, LocationRow>();
  for (const r of rows) {
    const loc = r.location || NOT_ASSIGNED_LOCATION;
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
      ? `${cur.varieties}, ${r.variety} ${r.code}`
      : `${r.variety} ${r.code}`;
    map.set(loc, cur);
  }
  return [...map.values()];
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
      // Trays STANDING IN A TUNNEL — `inTunnel`, not the batch's tray count.
      // A batch of 2000 with 500 sent to a tunnel shows a 500 row AND a 1500 row
      // for the trays still waiting (PSTOCK-22), and only the 500 are in a
      // tunnel. `numberOfTrays` counted the waiting ones as if they were.
      trays: rows.reduce((s, r) => s + (r.inTunnel ?? 0), 0),
      // Distinct BATCHES, not rows: one batch split over two tunnels is already
      // two rows, and with its waiting row it is three (PSTOCK-22).
      sowings: new Set(rows.map((r) => r.id)).size,
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
            {isSSM ? "Initial stock (plants)" : "Seeds sown"}
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
                {isSSM
                  ? "Remain = Initial Stock − Harvested"
                  : "Remain = plants counted − harvested (— until counted)"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                    <th className={thClass()}>Variety</th>
                    <th className={thClass()}>
                      {isSSM ? "Initial Stock" : "Seeds sown"}
                    </th>
                    <th className={thClass()}>Harvested</th>
                    <th className={thClass()}>Remain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {byVariety.map((v) => {
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
                          title={
                            v.remainingUnknown ? "Not counted yet" : undefined
                          }
                        >
                          {v.remainingUnknown
                            ? "—"
                            : v.remaining.toLocaleString()}
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
                    <th className={thClass()}>
                      {isSSM ? "Initial Stock" : "Seeds sown"}
                    </th>
                    <th className={thClass()}>Varieties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {byLocation.map((loc) => (
                    <tr
                      key={loc.location}
                      // The TYPE travels with the name (PSTOCK-20): the detail page
                      // cannot tell a tunnel from a sector by the name alone.
                      // `Not assigned` is not opened at all (PSTOCK-23).
                      onClick={
                        isPlace(loc.location)
                          ? () =>
                              router.push(
                                `/plant-stock/${encodeURIComponent(loc.location)}?type=${activeType}`,
                              )
                          : undefined
                      }
                      title={
                        isPlace(loc.location)
                          ? undefined
                          : "Trays that have not been transported yet — there is no place to open behind this line."
                      }
                      className={
                        isPlace(loc.location)
                          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          : ""
                      }
                    >
                      <td
                        className={`${tdClass()} font-medium text-gray-900 dark:text-white`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {isPlace(loc.location) ? (
                            <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <span className="w-4" />
                          )}
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
