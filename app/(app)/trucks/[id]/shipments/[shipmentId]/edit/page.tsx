"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { useToast } from "@/app/lib/toast-context";
import { useHarvestedProducts } from "@/app/lib/hooks/use-harvest";
import { useUpdateShipment } from "@/app/lib/hooks/use-shipments";
import { useTruck } from "@/app/lib/hooks/use-trucks";

/** Only the boxes — plants per box belongs to the product. */
type Line = {
  harvestedProductId: string;
  boxCount: string;
};

const emptyLine = (): Line => ({ harvestedProductId: "", boxCount: "" });

export default function EditShipmentPage() {
  const { id, shipmentId } = useParams<{
    id: string;
    shipmentId: string;
  }>();
  const router = useRouter();
  const { showToast } = useToast();

  // The truck response already carries its shipments, so one request covers both.
  const { data: truck, isLoading } = useTruck(id);
  const shipment = truck?.shipments.find((s) => s.id === shipmentId);

  const { data: products = [] } = useHarvestedProducts();
  const updateShipment = useUpdateShipment();

  const [shipmentNumber, setShipmentNumber] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!shipment) return;
    setShipmentNumber(shipment.shipmentNumber);
    setShipmentDate(shipment.shipmentDate.split("T")[0]);
    setLines(
      shipment.lines.length > 0
        ? shipment.lines.map((l) => ({
            harvestedProductId: l.harvestedProductId,
            boxCount: String(l.boxCount),
          }))
        : [emptyLine()],
    );
  }, [shipment]);

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  const productOf = (productId: string) =>
    products.find((p) => p.id === productId);

  /**
   * What this shipment already holds, per product. Those plants are out of
   * stock until the shipment is deleted, so they are NOT in `currentQuantity`.
   *
   * The server puts the old lines back into stock before it checks the new
   * ones. The screen has to mirror that, or re-saving an unchanged shipment
   * whose stock is now 0 would look like overshipping and block the save.
   */
  const alreadyHeld = new Map<string, number>();
  for (const l of shipment?.lines ?? []) {
    alreadyHeld.set(
      l.harvestedProductId,
      (alreadyHeld.get(l.harvestedProductId) ?? 0) + l.totalPlants,
    );
  }

  const availableOf = (productId: string) =>
    (productOf(productId)?.currentQuantity ?? 0) +
    (alreadyHeld.get(productId) ?? 0);

  const plantsOf = (l: Line) =>
    (parseInt(l.boxCount, 10) || 0) *
    (productOf(l.harvestedProductId)?.plantsPerBox ?? 0);

  const totalPlants = lines.reduce((sum, l) => sum + plantsOf(l), 0);

  /** Merged per product, matching how the server checks stock. */
  const requested = new Map<string, number>();
  for (const l of lines) {
    if (!l.harvestedProductId) continue;
    requested.set(
      l.harvestedProductId,
      (requested.get(l.harvestedProductId) ?? 0) + plantsOf(l),
    );
  }

  const overShipped = [...requested.entries()].filter(
    ([productId, plants]) => plants > availableOf(productId),
  );

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!shipmentNumber.trim()) {
      showToast("Shipment number is required", "error");
      return;
    }

    const usable = lines.filter((l) => l.harvestedProductId && plantsOf(l) > 0);
    if (usable.length === 0) {
      showToast("Add at least one product with a number of boxes", "error");
      return;
    }
    if (overShipped.length > 0) {
      showToast(
        "Some products are being shipped beyond the stock available",
        "error",
      );
      return;
    }

    setSubmitting(true);
    try {
      await updateShipment.mutateAsync({
        id: shipmentId,
        dto: {
          shipmentNumber: shipmentNumber.trim(),
          shipmentDate: new Date(shipmentDate).toISOString(),
          truckId: id,
          lines: usable.map((l) => ({
            harvestedProductId: l.harvestedProductId,
            boxCount: parseInt(l.boxCount, 10),
          })),
        },
      });
      showToast("Shipment updated");
      router.push(`/trucks/${id}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update shipment",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!truck || !shipment) {
    return (
      <div className="p-4 space-y-6">
        <PageHeader
          title="Edit Shipment"
          description="This shipment could not be loaded"
          backTo={`/trucks/${id}`}
          backLabel="Back to Truck"
        />
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-xl dark:bg-gray-800 dark:text-gray-400">
          This shipment was not found on {truck?.name ?? "this truck"}. It may
          have been deleted.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title={`Edit ${shipment.shipmentNumber}`}
        description="Changing the lines moves stock — the old lines go back first"
        backTo={`/trucks/${truck.id}`}
        backLabel="Back to Truck"
      />

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Truck
            </label>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
              {truck.name}
              {truck.trailerPlateNumber && (
                <span className="text-gray-500 dark:text-gray-400">
                  {" "}
                  · {truck.trailerPlateNumber}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shipment number *
            </label>
            <input
              className={inputClass}
              value={shipmentNumber}
              onChange={(e) => setShipmentNumber(e.target.value)}
              placeholder="e.g. SHP-0012"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shipment date *
            </label>
            <input
              type="date"
              className={inputClass}
              value={shipmentDate}
              onChange={(e) => setShipmentDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Products *
            </label>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
            >
              <Plus className="h-4 w-4" /> Add product
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((l, i) => {
              const product = productOf(l.harvestedProductId);
              const requestedHere = l.harvestedProductId
                ? (requested.get(l.harvestedProductId) ?? 0)
                : 0;
              const available = l.harvestedProductId
                ? availableOf(l.harvestedProductId)
                : 0;
              const over = !!product && requestedHere > available;

              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-6">
                      <label className="mb-1 block text-xs text-gray-500">
                        Product
                      </label>
                      <select
                        className={inputClass}
                        value={l.harvestedProductId}
                        onChange={(e) =>
                          updateLine(i, { harvestedProductId: e.target.value })
                        }
                      >
                        <option value="">— Select product —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.planteCode} · {p.plantsPerBox}/box ·{" "}
                            {p.currentQuantity.toLocaleString()} in stock
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs text-gray-500">
                        Number of boxes
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={inputClass}
                        value={l.boxCount}
                        onChange={(e) =>
                          updateLine(i, { boxCount: e.target.value })
                        }
                        placeholder="e.g. 20"
                      />
                      {/* Read-only: it belongs to the product, not the shipment. */}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {product
                          ? `${product.plantsPerBox} plants per box`
                          : "Pick a product first"}
                      </p>
                    </div>
                    <div className="flex items-end sm:col-span-2">
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {plantsOf(l).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLines((prev) =>
                              prev.length === 1
                                ? [emptyLine()]
                                : prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          aria-label="Remove product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {over && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Only {available.toLocaleString()} of {product.name}{" "}
                      {product.planteCode} available, but{" "}
                      {requestedHere.toLocaleString()} is being shipped
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-center text-sm text-green-700 dark:text-green-300">
            Total plants on this shipment
          </p>
          <p className="text-center text-3xl font-bold text-green-600 dark:text-green-400">
            {totalPlants.toLocaleString()}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || overShipped.length > 0}
          className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save shipment"}
        </button>
      </form>
    </div>
  );
}
