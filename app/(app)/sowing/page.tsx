"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSowings } from "@/app/lib/services/sowing";
import type { Sowing } from "@/app/lib/types/sowing";
import { Sprout, Plus } from "lucide-react";
import { TableSkeleton } from "@/app/components/skeleton";

export default function SowingsPage() {
  const router = useRouter();
  const [sowings, setSowings] = useState<Sowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSowings();
        setSowings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sowings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
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
            Sowing
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Record and track sowing activities
          </p>
        </div>
        <button
          onClick={() => router.push("/sowing/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Sowing
        </button>
      </div>

      {/* Sowings Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Sowings
          </h2>
        </div>

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
                  <th className="px-6 py-3 text-left font-medium">Crop Type</th>
                  <th className="px-6 py-3 text-left font-medium">Location</th>
                  <th className="px-6 py-3 text-left font-medium">Trays</th>
                  <th className="px-6 py-3 text-left font-medium">Lot #</th>
                  <th className="px-6 py-3 text-left font-medium">Product</th>
                  <th className="px-6 py-3 text-right font-medium">
                    Plants Expected
                  </th>
                  <th className="px-6 py-3 text-right font-medium">
                    Seeds Used
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sowings.map((sowing) => (
                  <tr
                    key={sowing.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-150 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/sowing/${sowing.id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {new Date(sowing.sowingDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {sowing.cropType}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          sowing.greenhouse === "GREENHOUSE"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {sowing.greenhouse === "GREENHOUSE"
                          ? "Greenhouse"
                          : "Field"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {sowing.numberOfTrays ? (
                        <span className="font-semibold">
                          {sowing.numberOfTrays}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                      {sowing.lotNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          sowing.productType === "SEEDS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {sowing.productType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {sowing.plantStock?.expectedPlants?.toLocaleString() ?? (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {sowing.quantityUsed?.toLocaleString()}
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
