"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDeliveries } from "@/app/lib/services/deliveries";
import type { Delivery } from "@/app/lib/types/delivery";
import { Plus } from "lucide-react";

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeliveries();
        setDeliveries(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load deliveries",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
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
          {error}
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
                  <th className="px-6 py-3 text-right font-medium">
                    Total Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {deliveries.map((delivery) => {
                  const totalQty = delivery.lots.reduce(
                    (sum, lot) => sum + lot.quantity,
                    0,
                  );
                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-150 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/deliveries/${delivery.id}`)
                      }
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
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          {delivery.deliveryCode}
                        </span>
                      </td>
                       

                      <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                        {delivery.lots.length}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {totalQty}
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
