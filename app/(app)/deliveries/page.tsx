"use client";

import { useRouter } from "next/navigation";
import { useDeliveries } from "@/app/lib/hooks/use-deliveries";
import { Plus, Search } from "lucide-react";
import { useSearch } from "@/app/lib/use-search";

export default function DeliveriesPage() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useSearch();
  const {
    data: deliveries = [],
    isPending,
    error,
  } = useDeliveries(debouncedQuery || undefined);

  if (isPending) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
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

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deliveries
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track incoming stock deliveries
          </p>
        </div>
        <button
          onClick={() => router.push("/deliveries/create")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          New Delivery
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search deliveries by code, product, lot, supplier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
        />
      </div>

      {/* Deliveries Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Deliveries
          </h2>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No deliveries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-left font-medium">
                    Delivery Code
                  </th>
                  <th className="px-6 py-3 text-right font-medium">Lots</th>
                  <th className="px-6 py-3 text-right font-medium">Seeds</th>
                  <th className="px-6 py-3 text-right font-medium">Peat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {deliveries.map((delivery) => {
                  const seedsTotal = delivery.lots
                    .filter((l) => l.productType === "SEEDS")
                    .reduce((sum, lot) => sum + lot.quantity, 0);
                  const peatTotal = delivery.lots
                    .filter((l) => l.productType === "PEAT")
                    .reduce((sum, lot) => sum + lot.quantity, 0);
                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-150 cursor-pointer"
                      tabIndex={0}
                      onClick={() => router.push(`/deliveries/${delivery.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/deliveries/${delivery.id}`);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {new Date(delivery.deliveryDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                          {delivery.deliveryCode}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                        {delivery.lots.length}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {seedsTotal > 0 ? seedsTotal.toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {peatTotal > 0 ? peatTotal.toFixed(2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
