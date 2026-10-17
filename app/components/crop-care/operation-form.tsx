"use client";

import { useState } from "react";
import { Beaker, Droplets, FlaskConical } from "lucide-react";
import { LocationMultiSelect } from "@/app/components/location-multi-select";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import {
  useCreateOperation,
  useUpdateOperation,
} from "@/app/lib/hooks/use-crop-care";
import { useSeasonProducts } from "@/app/lib/hooks/use-agri-inputs";
import type {
  CropCareType,
  CropOperation,
  LocationTarget,
} from "@/app/lib/types/crop-care";

/**
 * The log form for a crop operation — ONE copy, shared (user, 2026-10-11).
 *
 * It used to live inside `(app)/crop-care/operations/create/page.tsx`. The log
 * form and the operations list now sit on the same page, so the form moved out
 * of the page it was written in and that address now points here.
 *
 * Three kinds, and only the two that consume something name a product: an
 * irrigation schedules water, while a treatment and a fertilisation name what
 * went into the soil and how much of it — which is what the warehouse deducts.
 *
 * The kind is NOT this component's own state: the page owns it, because the list
 * below shows the same kind (user, 2026-10-11). One choice, one place — and so
 * the kind is not reset after saving either, or the list would jump back to
 * another kind while the operator is still working through one.
 *
 * TWO jobs since CROP-14: logging a new operation, and correcting a logged one.
 * Passing `editing` fills every field from that operation and switches the submit
 * from POST to PUT. The fields, the validation and the sentences stay the same,
 * because a correction is the same fact written again — not a second form that
 * would drift away from this one.
 *
 * The kind is shown but NOT editable there: a treatment is not an irrigation, and
 * the server refuses the change outright. It is shown rather than hidden because
 * the one field that cannot change is exactly the one you would wonder about.
 */
export function OperationForm({
  kind,
  onKindChange,
  editing,
  onDone,
}: {
  kind: CropCareType;
  /** Chosen by the page, which the list below follows. Editing never changes it. */
  onKindChange?: (kind: CropCareType) => void;
  /** The operation being corrected, if this form is editing rather than logging. */
  editing?: CropOperation;
  /** Called after a successful correction, so whoever opened this can close. */
  onDone?: () => void;
}) {
  const { showToast } = useToast();
  const caps = useCaps("crop-care");
  // Only what this season is allowed to use — a product with no season row
  // would be refused by the server anyway.
  const { data: products = [] } = useSeasonProducts();

  // The operation's own kind when editing: with the list on "All", the row you
  // pressed the pencil on need not be the kind the page is currently on, and
  // sending the page's kind would move the record to a kind it never was.
  const formKind = editing ? editing.operationType : kind;

  const [productId, setProductId] = useState(editing?.productId ?? "");
  const [quantity, setQuantity] = useState(
    editing?.quantity != null ? String(editing.quantity) : "",
  );
  const [performedAt, setPerformedAt] = useState(
    editing
      ? new Date(editing.performedAt).toLocaleDateString("en-CA")
      : new Date().toLocaleDateString("en-CA"),
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [locations, setLocations] = useState<LocationTarget[]>(
    editing
      ? editing.locations.map((l) => ({
          targetType: l.targetType,
          tunnelId: l.tunnelId ?? undefined,
          sectorId: l.sectorId ?? undefined,
        }))
      : [],
  );
  const [submitting, setSubmitting] = useState(false);

  const createOperation = useCreateOperation();
  const updateOperation = useUpdateOperation();

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locations.length === 0) {
      showToast("Select at least one tunnel or sector", "error");
      return;
    }
    // A treatment and a fertilisation both name a product (P6-07); irrigation
    // names nothing.
    if (formKind !== "IRRIGATION" && !productId) {
      showToast("Choose the product that was used", "error");
      return;
    }
    setSubmitting(true);
    try {
      const dto = {
        operationType: formKind,
        productId: formKind === "IRRIGATION" ? undefined : productId,
        quantity: quantity ? Number(quantity) : undefined,
        performedAt,
        notes: notes.trim() || undefined,
        locations,
      };

      if (editing) {
        await updateOperation.mutateAsync({ id: editing.id, dto });
        showToast("Operation corrected");
        onDone?.();
      } else {
        await createOperation.mutateAsync(dto);
        showToast("Operation logged");
        // The next operation is a different place and amount, so those are emptied
        // — the kind and the date stay, because the list below is showing that kind
        // and it is still the same day.
        setProductId("");
        setQuantity("");
        setNotes("");
        setLocations([]);
      }
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : editing
            ? "Failed to correct the operation"
            : "Failed to log operation",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Logging needs `create`, correcting needs `edit` — the same gate the server
  // applies, so a button can never appear for something it would refuse.
  if (editing ? !caps.edit : !caps.create) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-xl space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {editing ? "What was done — fixed once logged" : "What was done"}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => !editing && onKindChange?.("IRRIGATION")}
            disabled={!!editing}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
              formKind === "IRRIGATION"
                ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            <Droplets className="h-4 w-4" /> Irrigation
          </button>
          <button
            type="button"
            onClick={() => !editing && onKindChange?.("TREATMENT")}
            disabled={!!editing}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
              formKind === "TREATMENT"
                ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            <FlaskConical className="h-4 w-4" /> Treatment
          </button>
          <button
            type="button"
            onClick={() => !editing && onKindChange?.("FERTILISATION")}
            disabled={!!editing}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
              formKind === "FERTILISATION"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            <Beaker className="h-4 w-4" /> Fertilisation
          </button>
        </div>
      </div>

      {formKind !== "IRRIGATION" && (
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
            {/* Naming a product means saying how much — the server refuses a
                treatment or a fertilisation without one. */}
            {formKind === "IRRIGATION" ? "(liters)" : "(dose) *"}
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
        disabled={submitting}
        className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? editing
            ? "Saving…"
            : "Logging…"
          : editing
            ? "Save changes"
            : "Log operation"}
      </button>
    </form>
  );
}
