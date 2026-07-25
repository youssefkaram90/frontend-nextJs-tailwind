"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStockSummary } from "@/app/lib/services/stock";
import { getDeliveries } from "@/app/lib/services/deliveries";
import { getSowings } from "@/app/lib/services/sowing";
import type { StockSummary } from "@/app/lib/types/stock";
import type { Delivery } from "@/app/lib/types/delivery";
import type { Sowing } from "@/app/lib/types/sowing";
import { Warehouse, Truck, Sprout, ArrowRight, Package } from "lucide-react";

export default function Dashboard() {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [recentSowings, setRecentSowings] = useState<Sowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, deliveriesData, sowingsData] = await Promise.all([
          getStockSummary().catch(() => null),
          getDeliveries().catch(() => [] as Delivery[]),
          getSowings().catch(() => [] as Sowing[]),
        ]);

        setSummary(summaryData);
        setRecentDeliveries(deliveriesData.slice(0, 5));
        setRecentSowings(sowingsData.slice(0, 5));
      } catch {
        // Silently handle — partial data is fine
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalStockQty = summary
    ? Object.values(summary).reduce((sum, s) => sum + s.totalQuantity, 0)
    : 0;

  const totalStockLots = summary
    ? Object.values(summary).reduce((sum, s) => sum + s.lots, 0)
    : 0;

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

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                  <Warehouse className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Stock
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalStockQty}
                  </p>
                  <p className="text-xs text-gray-400">
                    {totalStockLots} lot{totalStockLots !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

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
                  const totalQty = delivery.lots.reduce(
                    (sum, lot) => sum + lot.quantity,
                    0,
                  );
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
                          {delivery.lots.length !== 1 ? "s" : ""},{" "}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {totalQty}
                        </span>
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
                {recentSowings.map((sowing) => (
                  <Link
                    key={sowing.id}
                    href={`/sowing/${sowing.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Sprout className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {sowing.cropType}
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
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
