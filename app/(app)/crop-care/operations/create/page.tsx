"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Beaker, Droplets, FlaskConical } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { LocationMultiSelect } from "@/app/components/location-multi-select";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { useCreateOperation } from "@/app/lib/hooks/use-crop-care";
import { useSeasonProducts } from "@/app/lib/hooks/use-agri-inputs";
import type { LocationTarget } from "@/app/lib/types/crop-care";

export default function CreateOperationPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const caps = useCaps("crop-care");
  // Only what this season is allowed to use — a product with no season row
  // would be refused by the server anyway.
  const { data: products = [] } = useSeasonProducts();

  const [operationType, setOperationType] = useState<
    "IRRIGATION" | "TREATMENT" | "FERTILISATION"
  >("IRRIGATION");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [performedAt, setPerformedAt] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [notes, setNotes] = useState("");
  const [locations, setLocations] = useState<LocationTarget[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const createOperation = useCreateOperation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locations.length === 0) {
      showToast("Select at least one tunnel or sector", "error");
      return;
    }
    // A treatment and a fertilisation both name a product (P6-07); irrigation
    // names nothing.
    if (operationType !== "IRRIGATION" && !productId) {
      showToast("Choose the product that was used", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createOperation.mutateAsync({
        operationType,
        productId: operationType === "IRRIGATION" ? undefined : productId,
        quantity: quantity ? Number(quantity) : undefined,
        performedAt,
        notes: notes.trim() || undefined,
        locations,
      });
      showToast("Operation logged");
      router.push("/crop-care/operations");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to log operation",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Log Crop Operation"
        description="Standalone irrigation, treatment or fertilisation — no plan required"
        backTo="/crop-care/operations"
        backLabel="Back to Operations"
      />

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-5"
      >
        {/* Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Operation type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOperationType("IRRIGATION")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                operationType === "IRRIGATION"
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              <Droplets className="h-4 w-4" /> Irrigation
            </button>
            <button
              type="button"
              onClick={() => setOperationType("TREATMENT")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                operationType === "TREATMENT"
                  ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              <FlaskConical className="h-4 w-4" /> Treatment
            </button>
            <button
              type="button"
              onClick={() => setOperationType("FERTILISATION")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                operationType === "FERTILISATION"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              <Beaker className="h-4 w-4" /> Fertilisation
            </button>
          </div>
        </div>

        {operationType !== "IRRIGATION" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product *
            </label>
            <select
              className={inputClass}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">— Select product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.category ? ` (${p.category})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date *
            </label>
            <input
              type="date"
              className={inputClass}
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity{" "}
              {/* Naming a product means saying how much — the server refuses
                  a treatment or a fertilisation without one. */}
              {operationType === "IRRIGATION" ? "(liters)" : "(dose) *"}
            </label>
            <input
              type="number"
              step="any"
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <LocationMultiSelect value={locations} onChange={setLocations} />
        </div>

        <button
          type="submit"
          disabled={submitting || !caps.create}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Logging…" : "Log operation"}
        </button>
      </form>
    </div>
  );
}
