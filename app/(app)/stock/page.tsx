"use client";

import { useRouter } from "next/navigation";
import { useStockItemsPage, useStockSummary } from "@/app/lib/hooks/use-stock";
import { type StockSummary } from "@/app/lib/types/stock";
import { SeasonEmptyState } from "@/app/components/ui/season-empty-state";
import { useSearch } from "@/app/lib/use-search";
import { SearchBar } from "@/app/components/ui";
import { formatQuantity } from "@/app/lib/format-quantity";
import { useState } from "react";

export default function StockPage() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useSearch();
  const [page, setPage] = useState(1);

  // A new search starts at page 1. Without this the user types something
  // shorter and lands on "page 4 of 1", which reads as an empty result.

  const {
    data: pageData,
    isPending,
    error,
  } = useStockItemsPage(debouncedQuery || undefined, page);
  const items = pageData?.items ?? [];

  const { data: summary = {} as StockSummary } = useStockSummary();

  if (isPending) {
    return (
      <div className="p-4">
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
                    {formatQuantity(data?.totalQuantity ?? 0, key)}
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

      {/* Search Bar — the query lives here, the box is shared (STOCK-05) */}
      <SearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Search stock by name, lot, supplier, type…"
      />

      {/* Stock Items Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Stock Items
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center">
            <SeasonEmptyState
              what="stock lots"
              action="Add a delivery, or enter an opening balance above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    Lot Number
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
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {item.lotNumber}
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
                      {formatQuantity(item.currentQuantity, item.productType)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paging — the endpoint only pages when `page` is sent, so this is what
          keeps a filled season off a single response (STOCK-07). */}
      {pageData && pageData.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {items.length} of {pageData.total} shown
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              disabled={!pageData.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
