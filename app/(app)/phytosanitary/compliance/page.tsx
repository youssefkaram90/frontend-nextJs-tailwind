"use client";

import { useState } from "react";
import { ClipboardCheck, Check, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { useCompliance } from "@/app/lib/hooks/use-crop-care";

export default function CompliancePage() {
  const { data, isLoading } = useCompliance();
  const [filterType, setFilterType] = useState<"ALL" | "TUNNEL" | "SECTOR">(
    "ALL",
  );
  const [filterLocation, setFilterLocation] = useState<string>("ALL");

  if (isLoading) {
    return (
      <div className="p-4">
        <PageHeader
          title="Compliance"
          description="Product × location application matrix"
          backTo="/phytosanitary"
          backLabel="Back to Phytosanitary"
        />
        <div className="mt-6 text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!data) return null;

  const { program, products, locations, applied } = data;

  const visibleLocations = locations.filter(
    (l) =>
      (filterType === "ALL" || l.targetType === filterType) &&
      (filterLocation === "ALL" || l.key === filterLocation),
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });

  const locationStatus = (locKey: string) => {
    let appliedCount = 0;
    for (const p of products) {
      if (applied[p.id]?.[locKey]) appliedCount += 1;
    }
    return { appliedCount, total: products.length };
  };

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Compliance"
        description="Which required products were applied to tunnels & sectors"
        backTo="/phytosanitary"
        backLabel="Back to Phytosanitary"
      />

      {!program ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>
              No active program defined yet.{" "}
              <a
                href="/phytosanitary/program"
                className="underline font-medium"
              >
                Set up the program
              </a>{" "}
              first.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as typeof filterType);
                setFilterLocation("ALL");
              }}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="ALL">All locations</option>
              <option value="TUNNEL">Tunnels only</option>
              <option value="SECTOR">Sectors only</option>
            </select>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="ALL">
                All{" "}
                {filterType === "TUNNEL"
                  ? "tunnels"
                  : filterType === "SECTOR"
                    ? "sectors"
                    : "locations"}
              </option>
              {locations
                .filter(
                  (l) => filterType === "ALL" || l.targetType === filterType,
                )
                .map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.name}
                  </option>
                ))}
            </select>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-10 text-center text-gray-400 shadow-xl">
              <ClipboardCheck className="mx-auto h-10 w-10 mb-2" />
              No products in the program yet.
            </div>
          ) : visibleLocations.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-10 text-center text-gray-400 shadow-xl">
              No locations match the filter.
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                    <th className="px-6 py-3 text-left font-medium">Product</th>
                    {visibleLocations.map((l) => (
                      <th
                        key={l.key}
                        className="px-4 py-3 text-center font-medium"
                      >
                        {l.name}
                        <span className="block text-[10px] font-normal text-gray-400">
                          {l.targetType === "TUNNEL" ? "Tunnel" : "Sector"}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {p.name}
                        </span>
                        {p.category && (
                          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                            {p.category}
                          </span>
                        )}
                      </td>
                      {visibleLocations.map((l) => {
                        const last = applied[p.id]?.[l.key];
                        const on = !!last;
                        return (
                          <td key={l.key} className="px-4 py-3 text-center">
                            {on ? (
                              <div className="flex flex-col items-center text-green-600 dark:text-green-400">
                                <Check className="h-5 w-5" />
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {fmtDate(last)}
                                </span>
                              </div>
                            ) : (
                              <X className="mx-auto h-5 w-5 text-red-400" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Per-location summary */}
          {visibleLocations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleLocations.map((l) => {
                const { appliedCount, total } = locationStatus(l.key);
                const allDone = appliedCount === total;
                return (
                  <div
                    key={l.key}
                    className={`rounded-2xl p-4 shadow-sm ${
                      allDone
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-amber-50 dark:bg-amber-900/20"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {l.name}
                    </p>
                    <p
                      className={`text-sm ${allDone ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                    >
                      {appliedCount}/{total} products applied
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
