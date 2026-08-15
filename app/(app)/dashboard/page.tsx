"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStockSummary } from "@/app/lib/hooks/use-stock";
import { useDeliveries } from "@/app/lib/hooks/use-deliveries";
import { useSowingSSMs, useSowingLPMs } from "@/app/lib/hooks/use-sowing";
import type { SowingSSM, SowingLPM } from "@/app/lib/types/sowing";
import { Warehouse, Truck, Sprout, ArrowRight } from "lucide-react";

function formatPeat(value: number): string {
  return value.toFixed(2);
}

export default function Dashboard() {
  const { data: summary } = useStockSummary();
  const { data: deliveries = [] } = useDeliveries();
  const { data: ssmData = [] } = useSowingSSMs();
  const { data: lpmData = [] } = useSowingLPMs();

  const isLoading = !summary;

  const recentDeliveries = useMemo(() => deliveries.slice(0, 5), [deliveries]);
  const recentSowings = useMemo<(SowingSSM | SowingLPM)[]>(() => {
    return [...ssmData, ...lpmData]
      .sort(
        (a, b) =>
          new Date(b.sowingDate).getTime() - new Date(a.sowingDate).getTime(),
      )
      .slice(0, 5);
  }, [ssmData, lpmData]);

  const seedsStock = summary?.SEEDS;
  const peatStock = summary?.PEAT;

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your farm operations
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/stock"
              className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl hover:shadow-2xl transition-shadow block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                  <Warehouse className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Stock
                  </p>
                  {seedsStock && (
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {seedsStock.totalQuantity.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        Seeds ({seedsStock.lots} lot
                        {seedsStock.lots !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                  {peatStock && (
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatPeat(peatStock.totalQuantity)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        Peat ({peatStock.lots} lot
                        {peatStock.lots !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                  <Truck className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Deliveries
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recentDeliveries.length}
                  </p>
                  <p className="text-xs text-gray-400">Recent</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sowings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recentSowings.length}
                  </p>
                  <p className="text-xs text-gray-400">Recent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Deliveries
              </h2>
              <Link
                href="/deliveries"
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentDeliveries.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                No deliveries yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentDeliveries.map((delivery) => {
                  const seedsTotal = delivery.lots
                    .filter((l) => l.productType === "SEEDS")
                    .reduce((sum, lot) => sum + lot.quantity, 0);
                  const peatTotal = delivery.lots
                    .filter((l) => l.productType === "PEAT")
                    .reduce((sum, lot) => sum + lot.quantity, 0);
                  return (
                    <Link
                      key={delivery.id}
                      href={`/deliveries/${delivery.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {delivery.deliveryCode}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {delivery.lots.length} lot
                          {delivery.lots.length !== 1 ? "s" : ""}
                        </span>
                        {seedsTotal > 0 && (
                          <span className="font-medium text-gray-900 dark:text-white ml-2">
                            S: {seedsTotal.toLocaleString()}
                          </span>
                        )}
                        {peatTotal > 0 && (
                          <span className="font-medium text-gray-900 dark:text-white ml-2">
                            P: {formatPeat(peatTotal)}
                          </span>
                        )}
                        <span className="ml-2">
                          {new Date(delivery.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Sowings */}
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Sowings
              </h2>
              <Link
                href="/sowing"
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentSowings.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                No sowings recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentSowings.map((sowing) => {
                  const typeTag = "tunnelId" in sowing ? "SSM" : "LPM";
                  return (
                    <Link
                      key={sowing.id}
                      href={`/sowing/${sowing.id}?type=${typeTag}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Sprout className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {sowing.variety}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {sowing.quantityUsed}
                        </span>
                        <span className="ml-2">
                          {new Date(sowing.sowingDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
