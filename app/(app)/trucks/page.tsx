"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Truck, Trash2, X } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { SeasonEmptyState } from "@/app/components/ui/season-empty-state";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { useToast } from "@/app/lib/toast-context";
import {
  useCreateTruck,
  useDeleteTruck,
  useTrucks,
  useUpdateTruck,
} from "@/app/lib/hooks/use-trucks";
import type { Truck as TruckModel } from "@/app/lib/types/shipment";

const emptyForm = {
  name: "",
  trailerPlateNumber: "",
  truckPlateNumber: "",
};

export default function TrucksPage() {
  const { showToast } = useToast();
  const caps = useCaps("trucks");
  const { data: trucks = [], isLoading } = useTrucks();
  const createTruck = useCreateTruck();
  const updateTruck = useUpdateTruck();
  const deleteTruck = useDeleteTruck();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TruckModel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function startEdit(t: TruckModel) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      trailerPlateNumber: t.trailerPlateNumber,
      truckPlateNumber: t.truckPlateNumber ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("Truck name is required", "error");
      return;
    }
    if (!form.trailerPlateNumber.trim()) {
      showToast("Trailer plate number is required", "error");
      return;
    }

    // Plates go in upper case so "ab-123" and "AB-123" can never become two
    // entries that look different but mean the same trailer.
    const payload = {
      name: form.name.trim(),
      trailerPlateNumber: form.trailerPlateNumber.trim().toUpperCase(),
      truckPlateNumber: form.truckPlateNumber.trim().toUpperCase(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateTruck.mutateAsync({ id: editingId, dto: payload });
        showToast("Truck updated");
      } else {
        await createTruck.mutateAsync(payload);
        showToast("Truck added");
      }
      cancelEdit();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTruck.mutateAsync(deleting.id);
      showToast(`${deleting.name} deleted`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Trucks"
        description="Open a truck to see the shipments it carries"
        backTo="/dashboard"
        backLabel="Dashboard"
      />

      {/* Add / edit */}
      {(caps.create || (editingId !== null && caps.edit)) && (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit truck" : "New truck"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Truck name *
              </label>
              <input
                className={inputClass}
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Truck 1"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trailer plate *
              </label>
              <input
                className={inputClass}
                value={form.trailerPlateNumber}
                onChange={set("trailerPlateNumber")}
                placeholder="e.g. AB-123-CD"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Truck plate
              </label>
              <input
                className={inputClass}
                value={form.truckPlateNumber}
                onChange={set("truckPlateNumber")}
                placeholder="Optional"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {submitting ? "Saving…" : editingId ? "Save changes" : "Add truck"}
          </button>
        </form>
      )}

      {/* Fleet */}
      {isLoading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-xl dark:bg-gray-800 dark:text-gray-400">
          Loading…
        </div>
      ) : trucks.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-xl dark:bg-gray-800 dark:text-gray-400">
          <SeasonEmptyState
            what="trucks"
            action="Add the first one above — a shipment always needs one."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {trucks.map((t) => {
            const shipmentCount = t._count?.shipments ?? 0;
            const inUse = shipmentCount > 0;

            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800"
              >
                {/* The left side opens this truck's shipments. */}
                <Link
                  href={`/trucks/${t.id}`}
                  className="flex min-w-[14rem] flex-1 items-center gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 hover:text-green-700 dark:text-white dark:hover:text-green-400">
                      {t.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        Trailer {t.trailerPlateNumber || "—"}
                      </span>
                      {t.truckPlateNumber && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          Truck {t.truckPlateNumber}
                        </span>
                      )}
                      {!t.trailerPlateNumber && (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          Needs a trailer plate — use Edit
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/trucks/${t.id}`}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {shipmentCount} shipment{shipmentCount === 1 ? "" : "s"} ›
                </Link>

                {caps.edit && (
                  <button
                    onClick={() => startEdit(t)}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                )}

                {caps.delete && (
                  <button
                    onClick={() => setDeleting(t)}
                    disabled={inUse}
                    title={
                      inUse
                        ? "Move or delete this truck's shipments first"
                        : undefined
                    }
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={deleting !== null}
        title="Delete truck"
        message={`Delete ${deleting?.name ?? "this truck"}? It carries no shipments, so nothing else changes.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
