"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdjustStock, useStockItem } from "@/app/lib/hooks/use-stock";
import {
  ArrowLeft,
  ChevronDown,
  Package,
  SlidersHorizontal,
} from "lucide-react";
import { DetailCardSkeleton, TableSkeleton } from "@/app/components/skeleton";
import {
  MOVEMENT_REASONS,
  MovementReason,
  movementReasonLabel,
  movementTypeLabel,
} from "@/app/lib/types/stock";
import { formatQuantity } from "@/app/lib/format-quantity";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import { useToast } from "@/app/lib/toast-context";
import { useState } from "react";

type Direction = "add" | "remove";

const FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

/**
 * A colour per movement type, so the badge means something.
 *
 * It used to be two-way — delivery green, EVERYTHING else orange — which painted
 * a sowing and a hand-written correction the same colour for no reason.
 */
const TYPE_BADGE: Record<string, string> = {
  delivery: "bg-green-100 text-green-800",
  sowing: "bg-blue-100 text-blue-800",
  manual: "bg-amber-100 text-amber-800",
};

export default function StockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isPending, error } = useStockItem(id);

  /**
   * Adjusting stock belongs HERE, not on the list.
   *
   * Moved 2026-10-05: this page IS the lot, so the operator cannot adjust the
   * wrong one and there is no lot dropdown to fill — which also means the list
   * page no longer has to download every lot of the season to populate one.
   * ADMIN-only (this is bookkeeping, not daily work) and the server refuses it
   * for anyone else regardless of this screen.
   */
  const { isAdmin } = usePermissions();
  const adjustStock = useAdjustStock();
  const { showToast } = useToast();
  const [direction, setDirection] = useState<Direction>("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<MovementReason>("opening");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <DetailCardSkeleton />
        <TableSkeleton rows={3} cols={5} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message || "Stock item not found"}
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

  // Only the reasons that make sense for the chosen direction. "correction"
  // works both ways, so it is always offered.
  const availableReasons = MOVEMENT_REASONS.filter(
    (r) => r.direction === direction || r.direction === "both",
  );

  async function onAdjust(e: React.FormEvent) {
    e.preventDefault();

    const amount = Number(quantity);
    if (!amount || amount <= 0) {
      showToast("Enter a quantity greater than zero", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (!item) {
        // we need to add an appropriate error.
        showToast(
         "This Stock item does not exist",
        "error",
      );
        return;
      }
      await adjustStock.mutateAsync({
        stockItemId: item.id,
        quantity: direction === "add" ? amount : -amount,
        reason,
        note: note.trim() || undefined,
      });
      showToast("Stock adjusted");
      setQuantity("");
      setNote("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <Package className="h-7 w-7 text-green-600" />
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
              {item.season && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  Season {item.season.code}
                </span>
              )}
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
              {formatQuantity(item.currentQuantity, item.productType)}
            </p>
          </div>
        </div>
      </div>

      {/* Adjust stock — ADMIN-only, and COLLAPSED by default: it is bookkeeping,
          not the reason anyone opens a lot, and an always-open form pushes the
          movement history off the first screen. A native `details`, the same
          disclosure the sowing list uses for "older sowings" (SSM-07) — it
          needs no state and the browser gives it keyboard and screen-reader
          behaviour for free. */}
      {isAdmin && (
        <details className="group rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {/*
            The chevron is drawn, not the browser's own marker. A `summary` laid
            out with `display: flex` loses its triangle — the marker is a
            list-item artefact — so the bar looked like a heading with nothing to
            click. `list-none` removes whatever the browser does render, and the
            icon rotates with the panel via `group-open:`.
          */}
          <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-6 py-4 text-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/30 [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="h-5 w-5 text-green-600 dark:text-green-400" />
            Adjust stock
            <ChevronDown className="ml-auto h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>

          <form
            onSubmit={onAdjust}
            className="space-y-4 border-t border-gray-200 p-6 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) => {
                    const next = e.target.value as Direction;
                    setDirection(next);
                    const first = MOVEMENT_REASONS.find(
                      (r) => r.direction === next || r.direction === "both",
                    );
                    if (first) setReason(first.value);
                  }}
                  className={FIELD_CLASS}
                >
                  <option value="add">Add to stock</option>
                  <option value="remove">Take out of stock</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as MovementReason)}
                  className={FIELD_CLASS}
                >
                  {availableReasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Note (optional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. counted in the warehouse"
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {submitting ? "Saving…" : "Save adjustment"}
            </button>
          </form>
        </details>
      )}

      {/* Movements Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Movements
          </h2>
          {item.season && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Every movement belongs to season {item.season.code} — a lot is
              never carried across seasons.
            </p>
          )}
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
                  <th className="px-6 py-3 text-left font-medium">By</th>
                  <th className="px-6 py-3 text-left font-medium">Reason</th>
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
                      {movement.quantity > 0 ? "+" : "-"}
                      {formatQuantity(
                        Math.abs(movement.quantity),
                        item.productType,
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_BADGE[movement.referenceType] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {movementTypeLabel(movement.referenceType)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {movement.createdByName}
                    </td>

                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {movementReasonLabel(movement.reason)}
                      {movement.note && (
                        <span className="block text-xs text-gray-400">
                          {movement.note}
                        </span>
                      )}
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
