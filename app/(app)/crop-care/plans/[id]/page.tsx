"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarClock,
  MapPin,
  Play,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { LocationMultiSelect } from "@/app/components/location-multi-select";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { useToast } from "@/app/lib/toast-context";
import {
  usePlan,
  useUpdatePlanStatus,
  useDeletePlan,
  useAddPlanEntry,
  useDeletePlanEntry,
  useExecutePlanEntry,
} from "@/app/lib/hooks/use-crop-care";
import { useSeasonProducts } from "@/app/lib/hooks/use-agri-inputs";
import { cropCareTypeLabel } from "@/app/lib/types/crop-care";
import type { LocationTarget } from "@/app/lib/types/crop-care";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const caps = useCaps("crop-care");

  const { data: plan, isLoading } = usePlan(id);
  // Only what this season is allowed to use.
  const { data: products = [] } = useSeasonProducts();

  const updateStatus = useUpdatePlanStatus();
  const deletePlan = useDeletePlan();
  const addEntry = useAddPlanEntry();
  const deleteEntry = useDeletePlanEntry();
  const executeEntry = useExecutePlanEntry();

  // Execute modal state
  const [executingEntryId, setExecutingEntryId] = useState<string | null>(null);
  const [performedAt, setPerformedAt] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [execLocations, setExecLocations] = useState<LocationTarget[]>([]);
  const [executing, setExecuting] = useState(false);

  // Add entry form
  const [newDate, setNewDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [newProductId, setNewProductId] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const [deletingPlan, setDeletingPlan] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  if (isLoading) {
    return (
      <div className="p-4">
        <PageHeader
          title="Plan"
          description="Loading…"
          backTo="/crop-care/plans"
          backLabel="Back to Plans"
        />
      </div>
    );
  }

  if (!plan) return null;

  const locationNames = (
    locs: {
      tunnel?: { number: string } | null;
      sector?: { name: string } | null;
      targetType: string;
    }[],
  ) =>
    locs
      .map(
        (l) =>
          (l.targetType === "TUNNEL" ? l.tunnel?.number : l.sector?.name) ??
          "?",
      )
      .join(", ");

  const planned = plan.entries.filter((e) => e.status === "PLANNED");
  const executed = plan.entries.filter((e) => e.status === "EXECUTED");
  // The entry being executed — its product carries the unit to ask in.
  const executingEntry = plan.entries.find((e) => e.id === executingEntryId);

  function openExecute(entryId: string) {
    if (!plan) return;
    setExecutingEntryId(entryId);
    setPerformedAt(new Date().toLocaleDateString("en-CA"));
    setQuantity("");
    setNotes("");
    setExecLocations(
      plan.locations.map((l) =>
        l.targetType === "TUNNEL"
          ? { targetType: "TUNNEL", tunnelId: l.tunnel?.id }
          : { targetType: "SECTOR", sectorId: l.sector?.id },
      ),
    );
  }

  async function confirmExecute() {
    if (!executingEntryId) return;
    if (execLocations.length === 0) {
      showToast("Select at least one location", "error");
      return;
    }
    setExecuting(true);
    try {
      await executeEntry.mutateAsync({
        entryId: executingEntryId,
        dto: {
          performedAt,
          locations: execLocations,
          quantity: quantity ? Number(quantity) : undefined,
          notes: notes.trim() || undefined,
        },
      });
      showToast("Entry executed");
      setExecutingEntryId(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to execute",
        "error",
      );
    } finally {
      setExecuting(false);
    }
  }

  async function submitAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setAdding(true);
    try {
      await addEntry.mutateAsync({
        planId: plan.id,
        dto: {
          plannedDate: newDate,
          productId: newProductId || undefined,
          quantity: newQty ? Number(newQty) : undefined,
          notes: newNotes.trim() || undefined,
        },
      });
      showToast("Entry added");
      setNewProductId("");
      setNewQty("");
      setNewNotes("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add entry",
        "error",
      );
    } finally {
      setAdding(false);
    }
  }

  async function confirmDeleteEntry() {
    if (!deletingEntryId) return;
    try {
      await deleteEntry.mutateAsync(deletingEntryId);
      showToast("Entry deleted");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete entry",
        "error",
      );
    } finally {
      setDeletingEntryId(null);
    }
  }

  async function confirmDeletePlan() {
    if (!plan) return;
    try {
      await deletePlan.mutateAsync(plan.id);
      showToast("Plan deleted");
      router.push("/crop-care/plans");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete plan",
        "error",
      );
    } finally {
      setDeletingPlan(false);
    }
  }

  const entryRow = (entry: (typeof plan.entries)[number]) => (
    <div
      key={entry.id}
      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${
        entry.status === "EXECUTED"
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-white">
            {new Date(entry.plannedDate).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            })}
          </span>
          {entry.product && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              {entry.product.name}
            </span>
          )}
          {entry.quantity != null && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {entry.quantity} {entry.product?.unit ?? ""}
            </span>
          )}
          {entry.status === "EXECUTED" && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              {entry.executedAt
                ? new Date(entry.executedAt).toLocaleDateString("en-GB")
                : "executed"}
            </span>
          )}
        </div>
        {entry.notes && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {entry.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {caps.create && entry.status === "PLANNED" ? (
          <button
            onClick={() => openExecute(entry.id)}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Play className="h-3.5 w-3.5" /> Execute
          </button>
        ) : null}
        {caps.delete && (
          <button
            onClick={() => setDeletingEntryId(entry.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6 max-w-4xl">
      <PageHeader
        title={plan.name}
        description={`${cropCareTypeLabel(plan.planType)} plan`}
        backTo="/crop-care/plans"
        backLabel="Back to Plans"
      />

      {/* Header card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${statusColors[plan.status] ?? statusColors.DRAFT}`}
                >
                  {plan.status}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {cropCareTypeLabel(plan.planType)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400" />
                {locationNames(plan.locations)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {caps.edit && plan.status === "DRAFT" && (
              <button
                onClick={() =>
                  updateStatus.mutateAsync({ id: plan.id, status: "ACTIVE" })
                }
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Activate
              </button>
            )}
            {caps.edit && plan.status === "ACTIVE" && (
              <button
                onClick={() =>
                  updateStatus.mutateAsync({ id: plan.id, status: "COMPLETED" })
                }
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Complete
              </button>
            )}
            {caps.delete && (
              <button
                onClick={() => setDeletingPlan(true)}
                className="flex items-center gap-1 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Planned entries */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Planned ({planned.length})
        </h2>
        {planned.length === 0 ? (
          <p className="text-sm text-gray-400">No planned entries.</p>
        ) : (
          <div className="space-y-2">{planned.map(entryRow)}</div>
        )}
      </div>

      {/* Executed entries */}
      {executed.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Executed ({executed.length})
          </h2>
          <div className="space-y-2">{executed.map(entryRow)}</div>
        </div>
      )}

      {/* Add entry */}
      <form
        onSubmit={submitAddEntry}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
      >
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Plus className="h-5 w-5 text-green-600" /> Add scheduled entry
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="date"
            className={inputClass}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
          <select
            className={inputClass}
            value={newProductId}
            onChange={(e) => setNewProductId(e.target.value)}
          >
            <option value="">No product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            className={inputClass}
            placeholder="Quantity"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Notes"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={adding || !caps.create}
          className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add entry"}
        </button>
      </form>

      {/* Execute modal */}
      {executingEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setExecutingEntryId(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Execute entry
              </h3>
              <button
                onClick={() => setExecutingEntryId(null)}
                className="text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Performed on *
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={performedAt}
                  onChange={(e) => setPerformedAt(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity{" "}
                  {executingEntry?.product?.unit
                    ? `(${executingEntry.product.unit})`
                    : plan.planType === "IRRIGATION"
                      ? "(liters)"
                      : "(dose)"}
                </label>
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <input
                  className={inputClass}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <LocationMultiSelect
                  value={execLocations}
                  onChange={setExecLocations}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setExecutingEntryId(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExecute}
                  disabled={executing}
                  className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {executing ? "Executing…" : "Confirm execution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deletingPlan}
        title="Delete plan"
        message={`Delete "${plan.name}" and all its entries? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDeletePlan}
        onCancel={() => setDeletingPlan(false)}
      />
      <ConfirmModal
        open={!!deletingEntryId}
        title="Delete entry"
        message="Delete this scheduled entry?"
        confirmLabel="Delete"
        onConfirm={confirmDeleteEntry}
        onCancel={() => setDeletingEntryId(null)}
      />
    </div>
  );
}
