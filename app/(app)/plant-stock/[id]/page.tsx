"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlantStocks } from "@/app/lib/hooks/use-plant-stock";
import { ArrowLeft, MapPin, Sprout } from "lucide-react";
import { DetailCardSkeleton } from "@/app/components/skeleton";

export default function PlantStockLocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data = [], isPending, error } = usePlantStocks();

  const rows = useMemo(
    () => data.filter((r) => (r.location || "Not assigned") === id),
    [data, id],
  );

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <DetailCardSkeleton />
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

  if (rows.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <button
          onClick={() => router.push("/plant-stock")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plant Stock
        </button>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-10 text-center text-gray-500 dark:text-gray-400 shadow-xl">
          No plant stock found for “{id}”.
        </div>
      </div>
    );
  }

  const isSSM = !!rows[0].ssmSowingId;
  const totals = {
    initialStock: rows.reduce((s, r) => s + r.expectedPlants, 0),
    trays: rows.reduce((s, r) => s + (r.numberOfTrays ?? 0), 0),
    sowings: rows.length,
  };
  const varieties = [...new Set(rows.map((r) => r.variety))];

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/plant-stock")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Plant Stock
      </button>

      {/* Header card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <MapPin className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {id}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isSSM ? "Tunnel (SSM)" : "Sector (LPM)"} · {varieties.join(", ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Initial Stock
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totals.initialStock.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sowings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totals.sowings.toLocaleString()}
            </p>
          </div>
          {isSSM && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Trays</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {totals.trays.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Varieties
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {varieties.length}
            </p>
          </div>
        </div>
      </div>

      {/* Sowings in location */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Sprout className="h-4 w-4 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sowings in {id}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <th className="px-6 py-3 text-left font-medium">Variety</th>
                <th className="px-6 py-3 text-left font-medium">Lot</th>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                {isSSM && (
                  <th className="px-6 py-3 text-left font-medium">Trays</th>
                )}
                <th className="px-6 py-3 text-left font-medium">Stage</th>
                <th className="px-6 py-3 text-right font-medium">
                  Initial Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    isSSM && r.ssmSowingId
                      ? router.push(`/sowing/${r.ssmSowingId}?type=SSM`)
                      : r.lpmSowingId
                        ? router.push(`/sowing/${r.lpmSowingId}?type=LPM`)
                        : undefined
                  }
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-6 py-3 font-medium text-green-600 dark:text-green-400">
                    {r.variety}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {r.lotNumber}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {r.stockType}
                  </td>
                  {isSSM && (
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                      {r.numberOfTrays?.toLocaleString() ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      {r.currentStage}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {r.expectedPlants.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
