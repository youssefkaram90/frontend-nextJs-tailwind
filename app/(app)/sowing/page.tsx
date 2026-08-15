"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSowingSSMs, useSowingLPMs } from "@/app/lib/hooks/use-sowing";
import { getPendingPlanEntries } from "@/app/lib/services/sowing";
import type {
  SowingSSM,
  SowingLPM,
  PendingPlanGroup,
} from "@/app/lib/types/sowing";
import {
  Plus,
  Search,
  FileSpreadsheet,
  Play,
  Sprout,
  Loader2,
} from "lucide-react";
import { TableSkeleton } from "@/app/components/skeleton";
import { useSearch } from "@/app/lib/use-search";

type UnifiedSowing =
  | (SowingSSM & { _type: "SSM"; _location: string })
  | (SowingLPM & { _type: "LPM"; _location: string });

export default function SowingsPage() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useSearch();
  const {
    data: ssmData = [],
    isPending: ssmLoading,
    error: ssmError,
  } = useSowingSSMs(debouncedQuery || undefined);
  const {
    data: lpmData = [],
    isPending: lpmLoading,
    error: lpmError,
  } = useSowingLPMs(debouncedQuery || undefined);

  const [pendingGroups, setPendingGroups] = useState<PendingPlanGroup[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    getPendingPlanEntries()
      .then(setPendingGroups)
      .catch(() => setPendingGroups([]))
      .finally(() => setPendingLoading(false));
  }, []);

  const isPending = ssmLoading || lpmLoading;
  const error = ssmError || lpmError;

  const sowings = useMemo<UnifiedSowing[]>(() => {
    const unified: UnifiedSowing[] = [
      ...ssmData.map((s) => {
        // Build location from tunnel assignments, fall back to single tunnel
        const assignedTunnels = s.tunnelAssignments
          ?.map((a) => a.tunnel?.number)
          .filter(Boolean);
        const location =
          assignedTunnels && assignedTunnels.length > 0
            ? assignedTunnels.join(", ")
            : (s.tunnel?.number ?? "—");

        return {
          ...s,
          _type: "SSM" as const,
          _location: location,
        };
      }),
      ...lpmData.map((s) => ({
        ...s,
        _type: "LPM" as const,
        _location: s.sector?.name ?? "—",
      })),
    ].sort(
      (a, b) =>
        new Date(b.sowingDate).getTime() - new Date(a.sowingDate).getTime(),
    );
    return unified;
  }, [ssmData, lpmData]);

  // Split into recent (last 7 days) and older
  const { recentSowings, olderSowings } = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent: UnifiedSowing[] = [];
    const older: UnifiedSowing[] = [];
    for (const s of sowings) {
      if (new Date(s.sowingDate) >= weekAgo) recent.push(s);
      else older.push(s);
    }
    return { recentSowings: recent, olderSowings: older };
  }, [sowings]);

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={5} cols={8} />
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sowing
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            What needs to be done today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/sowing/plans")}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Plans
          </button>
          <button
            onClick={() => router.push("/sowing/create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 text-sm"
          >
            <Plus className="h-4 w-4" /> New Sowing
          </button>
        </div>
      </div>

      {/* ═══ PENDING TASKS ═══ */}
      {pendingLoading ? (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : pendingGroups.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            Pending —{" "}
            {pendingGroups.reduce((sum, g) => sum + g.entries.length, 0)}{" "}
            entries across {pendingGroups.length} plans
          </h2>
          {pendingGroups.map((group) => (
            <div
              key={group.planId}
              className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {group.planName}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {group.planType === "SSM"
                        ? "SSM (Tunnel)"
                        : "LPM (Field)"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {group.entries.length} pending
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-5 py-2 text-left font-medium">Date</th>
                      <th className="px-5 py-2 text-left font-medium">
                        Variety
                      </th>
                      <th className="px-5 py-2 text-left font-medium">Type</th>
                      {group.planType === "SSM" ? (
                        <>
                          <th className="px-5 py-2 text-right font-medium">
                            Done
                          </th>
                          <th className="px-5 py-2 text-right font-medium">
                            Planned
                          </th>
                          <th className="px-5 py-2 text-right font-medium">
                            Left
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-5 py-2 text-right font-medium">
                            Done
                          </th>
                          <th className="px-5 py-2 text-right font-medium">
                            Planned
                          </th>
                          <th className="px-5 py-2 text-right font-medium">
                            Left
                          </th>
                          <th className="px-5 py-2 text-left font-medium">
                            Sector
                          </th>
                        </>
                      )}
                      <th className="px-5 py-2 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {group.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-5 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {new Date(entry.plannedDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                          {entry.variety}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            {entry.stockType}
                          </span>
                        </td>
                        {group.planType === "SSM" ? (
                          <>
                            <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">
                              {entry.executedTrays ?? 0}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                              {entry.plannedTrays ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {entry.plannedTrays != null ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    entry.plannedTrays -
                                      (entry.executedTrays ?? 0) >
                                    0
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                                  }`}
                                >
                                  {entry.plannedTrays -
                                    (entry.executedTrays ?? 0)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">
                              {(entry.executedQuantity ?? 0).toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                              {entry.plannedQuantity?.toLocaleString() ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {entry.plannedQuantity != null ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    entry.plannedQuantity -
                                      (entry.executedQuantity ?? 0) >
                                    0
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                                  }`}
                                >
                                  {(
                                    entry.plannedQuantity -
                                    (entry.executedQuantity ?? 0)
                                  ).toLocaleString()}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                              {entry.sector?.name ?? "—"}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() =>
                              router.push(
                                `/sowing/create?planId=${group.planId}&planEntryId=${entry.id}`,
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Execute
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
          <Sprout className="mx-auto h-10 w-10 text-green-300 dark:text-green-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            All plan entries have been executed. Great job!
          </p>
        </div>
      )}

      {/* ═══ RECENTLY COMPLETED ═══ */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recently Completed
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sowings by variety, lot, location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
          />
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {sowings.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No sowings recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Plan</th>
                    <th className="px-6 py-3 text-left font-medium">Variety</th>
                    <th className="px-6 py-3 text-left font-medium">Type</th>
                    <th className="px-6 py-3 text-left font-medium">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left font-medium">Trays</th>
                    <th className="px-6 py-3 text-left font-medium">Lot #</th>
                    <th className="px-6 py-3 text-right font-medium">
                      Seeds Used
                    </th>
                    <th className="px-6 py-3 text-right font-medium">
                      Est. Plants
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentSowings.map((sowing) => (
                    <tr
                      key={sowing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-150 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/sowing/${sowing.id}?type=${sowing._type}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {new Date(sowing.sowingDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-[140px] truncate"
                        title={sowing.plan?.name}
                      >
                        {sowing.plan?.name ?? (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {sowing.variety}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sowing._type === "SSM" ? "bg-teal-100 text-teal-800" : "bg-yellow-100 text-yellow-800"}`}
                        >
                          {sowing._type === "SSM"
                            ? "SSM (Tunnel)"
                            : "LPM (Field)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {sowing._location}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {sowing._type === "SSM" &&
                        (sowing as SowingSSM).numberOfTrays ? (
                          <span className="font-semibold">
                            {(sowing as SowingSSM).numberOfTrays}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {sowing.lotNumber}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {sowing.quantityUsed?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {Math.round(
                          sowing.quantityUsed *
                            (sowing._type === "SSM" ? 0.82 : 0.8),
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentSowings.length === 0 && sowings.length > 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-4 text-center text-gray-400"
                      >
                        No sowings in the last 7 days. Showing all below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Older sowings */}
        {olderSowings.length > 0 && (
          <details className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none">
              Older sowings ({olderSowings.length})
            </summary>
            <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {olderSowings.map((sowing) => (
                    <tr
                      key={sowing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-150 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/sowing/${sowing.id}?type=${sowing._type}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {new Date(sowing.sowingDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td
                        className="px-6 py-4 max-w-[140px] truncate"
                        title={sowing.plan?.name}
                      >
                        {sowing.plan?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {sowing.variety}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sowing._type === "SSM" ? "bg-teal-100 text-teal-800" : "bg-yellow-100 text-yellow-800"}`}
                        >
                          {sowing._type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {sowing._location}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sowing._type === "SSM"
                          ? ((sowing as SowingSSM).numberOfTrays ?? "—")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">{sowing.lotNumber}</td>
                      <td className="px-6 py-4 text-right">
                        {sowing.quantityUsed?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {Math.round(
                          sowing.quantityUsed *
                            (sowing._type === "SSM" ? 0.82 : 0.8),
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
