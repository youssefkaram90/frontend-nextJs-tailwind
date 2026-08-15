"use client";

import { useRouter } from "next/navigation";
import { useStockItems, useStockSummary } from "@/app/lib/hooks/use-stock";
import type { StockSummary } from "@/app/lib/types/stock";
import { Search } from "lucide-react";
import { useSearch } from "@/app/lib/use-search";

export default function StockPage() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useSearch();
  const {
    data: items = [],
    isPending,
    error,
  } = useStockItems(debouncedQuery || undefined);
  const { data: summary = {} as StockSummary } = useStockSummary();

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

  const productTypes = [
    { key: "SEEDS", label: "Seeds", color: "bg-amber-500" },
    { key: "PEAT", label: "Peat", color: "bg-emerald-500" },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Stock
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Inventory overview and lot management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {productTypes.map(({ key, label, color }) => {
          const data = summary[key];
          return (
            <div
              key={key}
              className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-lg font-bold`}
                >
                  {label.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {key === "PEAT"
                      ? (data?.totalQuantity ?? 0).toFixed(2)
                      : (data?.totalQuantity ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {data?.lots ?? 0} lot{data?.lots !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search stock by name, lot, supplier, type…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
        />
      </div>

      {/* Stock Items Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Stock Items
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No stock items found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">
                    Lot Number
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    Stock Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium">Supplier</th>
                  <th className="px-6 py-3 text-right font-medium">
                    Current Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-150 cursor-pointer"
                    tabIndex={0}
                    role="row"
                    onClick={() => router.push(`/stock/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/stock/${item.id}`);
                      }
                    }}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.lotNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.productType === "SEEDS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.productType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.stockType === "BIO"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {item.stockType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {item.supplierName}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {item.productType === "PEAT"
                        ? item.currentQuantity.toFixed(2)
                        : item.currentQuantity.toLocaleString()}
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
