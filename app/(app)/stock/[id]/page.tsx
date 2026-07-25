"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStockItem } from "@/app/lib/services/stock";
import type { StockItem } from "@/app/lib/types/stock";
import { ArrowLeft, Package } from "lucide-react";
import { DetailCardSkeleton, TableSkeleton } from "@/app/components/skeleton";

export default function StockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStockItem(id);
        setItem(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load stock item",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <DetailCardSkeleton />
        <TableSkeleton rows={3} cols={4} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Stock item not found"}
        </div>
      </div>
    );
  }

  const productBadgeColor =
    item.productType === "SEEDS"
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  const stockBadgeColor =
    item.stockType === "BIO"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/stock")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stock
      </button>

      {/* Item Details Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <Package className="h-7 w-7 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.lotNumber}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {item.productName}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${productBadgeColor}`}
              >
                {item.productType}
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${stockBadgeColor}`}
              >
                {item.stockType}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supplier: {item.supplierName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current Quantity
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {item.currentQuantity}
            </p>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Movements
          </h2>
        </div>

        {!item.movements || item.movements.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No movements recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-right font-medium">Quantity</th>
                  <th className="px-6 py-3 text-left font-medium">Type</th>
                  <th className="px-6 py-3 text-left font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {item.movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(movement.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${
                        movement.quantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          movement.referenceType === "delivery"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {movement.referenceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {movement.referenceId
                        ? movement.referenceId.slice(0, 12) + "…"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
