"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wheat,
  Plus,
  Trash2,
  Boxes,
  Package,
  MapPin,
  Send,
  Ban,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { SeasonEmptyState } from "@/app/components/ui/season-empty-state";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import {
  useHarvestRecords,
  useDeleteHarvestRecord,
  useHarvestedProducts,
  useHarvestSummary,
  useWriteOffHarvestedProduct,
} from "@/app/lib/hooks/use-harvest";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import { MOVEMENT_REASONS, type MovementReason } from "@/app/lib/types/stock";
import type { HarvestedProduct } from "@/app/lib/types/harvest";

/**
 * A finished-goods product is identified by name + plant code + box size — all
 * three, so a 410 and a 430 pack of one variety never merge. The card carries
 * no id, so this is how it finds the stock row behind it.
 */
const productKey = (name: string, planteCode: string, plantsPerBox: number) =>
  `${name.trim().toLowerCase()}|${planteCode}|${plantsPerBox}`;

export default function HarvestPage() {
  const { showToast } = useToast();
  const { isAdmin } = usePermissions();
  const caps = useCaps("harvest");
  const truckCaps = useCaps("trucks");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Write-off — the way out for boxes that spoiled or were counted wrong, so a
  // season can be closed instead of staying blocked for ever. ADMIN-only on
  // purpose (it moves stock with no sale behind it), so there is no permission
  // for it: `caps` cannot switch it on for anyone.
  const writeOff = useWriteOffHarvestedProduct();
  const [writeOffProduct, setWriteOffProduct] =
    useState<HarvestedProduct | null>(null);
  const [writeOffReason, setWriteOffReason] = useState<MovementReason>("waste");
  const [writeOffNote, setWriteOffNote] = useState("");
  const [writeOffBusy, setWriteOffBusy] = useState(false);

  const { data, isLoading } = useHarvestRecords({ page, pageSize: 20 });
  const { data: summary = [] } = useHarvestSummary();
  // True finished-goods stock. The summary above only adds up harvests, so on
  // its own it would keep counting plants that have already been shipped.
  const { data: products = [] } = useHarvestedProducts();
  const deleteRecord = useDeleteHarvestRecord();

  // Keyed by name, plant code AND box size, because those three are what make
  // a product a product — the same lookup the card below uses. Looking up by
  // name alone would credit the wrong Krypton.
  const productByPacking = new Map<string, HarvestedProduct>(
    products.map((p) => [productKey(p.name, p.planteCode, p.plantsPerBox), p]),
  );

  const records = data?.items ?? [];

  const fieldClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  // A write-off always REMOVES stock, so "opening balance" is never offered —
  // the server would refuse it anyway, and there is no reason to make someone
  // discover that. The rule itself still lives on the server.
  const writeOffReasons = MOVEMENT_REASONS.filter((r) => r.direction !== "add");

  /**
   * Empty the whole remaining quantity. There is no amount to type: a part
   * write-off would leave a figure nobody can justify, so the server clears the
   * product and records one movement with the reason.
   */
  async function confirmWriteOff() {
    if (!writeOffProduct) return;
    setWriteOffBusy(true);
    try {
      const result = await writeOff.mutateAsync({
        id: writeOffProduct.id,
        reason: writeOffReason,
        note: writeOffNote.trim() || undefined,
      });
      showToast(
        `Wrote off ${result.writtenOff.toLocaleString()} ${writeOffProduct.name}`,
      );
      setWriteOffProduct(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to write off",
        "error",
      );
    } finally {
      setWriteOffBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteRecord.mutateAsync(deleting);
      showToast("Harvest record deleted");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error",
      );
    } finally {
      setDeleting(null);
    }
  }

  const locationName = (r: (typeof records)[number]) =>
    r.targetType === "TUNNEL" ? r.tunnel?.number : r.sector?.name;

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Harvest"
        description="Log harvested produce & finished-goods stock"
        backTo="/dashboard"
        backLabel="Dashboard"
      >
        <div className="flex items-center gap-2">
          {truckCaps.view && (
            <Link
              href="/trucks"
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700/40"
            >
              <Send className="h-4 w-4" /> Trucks &amp; Shipments
            </Link>
          )}
          {caps.create && (
            <Link
              href="/harvest/log"
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" /> Log harvest
            </Link>
          )}
        </div>
      </PageHeader>

      {/* Finished-goods stock */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Boxes className="h-5 w-5 text-green-600" /> Finished-goods stock
        </h2>
        {summary.length === 0 ? (
          <p className="text-sm text-gray-400">
            <SeasonEmptyState
              what="harvested stock"
              action="Log a harvest to create it."
            />
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {summary.map((g) => {
              const product = productByPacking.get(
                productKey(g.productName, g.planteCode, g.plantsPerBox),
              );
              const inStock = product?.currentQuantity;

              return (
                <div
                  key={`${g.productName}-${g.planteCode}-${g.targetType}-${g.stockType}-${g.plantsPerBox}`}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                    {`${g.productName} ${g.planteCode}`}
                  </p>

                  <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {g.targetType === "TUNNEL" ? "SSM" : "LPM"}
                    {g.stockType ? ` · ${g.stockType}` : ""}
                  </span>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {g.boxCount} boxes × {g.plantsPerBox}/box
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {inStock != null ? inStock.toLocaleString() : "—"}
                  </p>
                  <p className="text-xs text-gray-400">plants in stock</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {g.totalPlants.toLocaleString()} harvested
                  </p>

                  {/* A card can show stock from a product shared with another
                      card (same product, different location or pack type), so
                      the modal names the product and the total it will clear. */}
                  {isAdmin && product && inStock != null && inStock > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setWriteOffProduct(product);
                        setWriteOffReason("waste");
                        setWriteOffNote("");
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Ban className="h-3.5 w-3.5" /> Write off
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Records */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Wheat className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Harvest records
          </h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Wheat className="mx-auto h-10 w-10 mb-2" />
            <SeasonEmptyState
              what="harvests"
              action="Log a harvest to start."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <th className="px-6 py-3 text-left font-medium">Product</th>
                <th className="px-6 py-3 text-left font-medium">Location</th>
                <th className="px-6 py-3 text-right font-medium">Boxes</th>
                <th className="px-6 py-3 text-right font-medium">Plants/box</th>
                <th className="px-6 py-3 text-right font-medium">
                  Total plants
                </th>
                <th className="px-6 py-3 text-right font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {`${r.productName} ${r.planteCode}`}
                    {r.stockType && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {r.stockType}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {locationName(r)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">
                    {r.boxCount}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">
                    {r.plantsPerBox}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {r.totalPlants.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500 dark:text-gray-400">
                    {new Date(r.harvestedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end">
                      {caps.delete && (
                        <button
                          onClick={() => setDeleting(r.id)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {data.items.length} of {data.total} shown
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
              disabled={!data.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete harvest"
        message="Delete this harvest record? The finished-goods stock will be reduced."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* Write-off — ADMIN only, so it is not tied to a permission */}
      {writeOffProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !writeOffBusy && setWriteOffProduct(null)}
          />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Ban className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  Write off {writeOffProduct.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {writeOffProduct.currentQuantity.toLocaleString()} plants
                  (code {writeOffProduct.planteCode},{" "}
                  {writeOffProduct.plantsPerBox}
                  /box) will be taken out of stock. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason
                </label>
                <select
                  value={writeOffReason}
                  onChange={(e) =>
                    setWriteOffReason(e.target.value as MovementReason)
                  }
                  className={fieldClass}
                >
                  {writeOffReasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Note (optional)
                </label>
                <input
                  value={writeOffNote}
                  onChange={(e) => setWriteOffNote(e.target.value)}
                  placeholder="e.g. spoiled in the heat"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setWriteOffProduct(null)}
                disabled={writeOffBusy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmWriteOff}
                disabled={writeOffBusy}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {writeOffBusy ? "Writing off…" : "Write off"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
