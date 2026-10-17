"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Package, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { useDeleteShipment } from "@/app/lib/hooks/use-shipments";
import { useTruck } from "@/app/lib/hooks/use-trucks";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default function TruckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const caps = useCaps("trucks");
  const { data: truck, isLoading, isError, error } = useTruck(id);
  const deleteShipment = useDeleteShipment();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteShipment.mutateAsync(deleting);
      showToast("Shipment deleted — the plants are back in stock");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error",
      );
    } finally {
      setDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="p-4 space-y-6">
        <PageHeader
          title="Truck"
          description="This truck could not be loaded"
          backTo="/trucks"
          backLabel="Back to Trucks"
        />
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-xl dark:bg-gray-800 dark:text-gray-400">
          {isError && error instanceof Error
            ? error.message
            : "This truck was not found. It may have been deleted."}
        </div>
      </div>
    );
  }

  const shipments = truck.shipments;
  const totalBoxes = shipments.reduce(
    (sum, s) => sum + s.lines.reduce((x, l) => x + l.boxCount, 0),
    0,
  );
  const totalPlants = shipments.reduce(
    (sum, s) => sum + s.lines.reduce((x, l) => x + l.totalPlants, 0),
    0,
  );

  const plates = [
    truck.trailerPlateNumber ? `Trailer ${truck.trailerPlateNumber}` : null,
    truck.truckPlateNumber ? `Truck ${truck.truckPlateNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title={truck.name}
        description={plates || "No plate recorded yet"}
        backTo="/trucks"
        backLabel="Back to Trucks"
      >
        {caps.create && (
          <Link
            href={`/trucks/${truck.id}/shipments/new`}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> New shipment
          </Link>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label={shipments.length === 1 ? "Shipment" : "Shipments"}
          value={String(shipments.length)}
        />
        <Stat label="Boxes" value={totalBoxes.toLocaleString()} />
        <Stat label="Plants" value={totalPlants.toLocaleString()} />
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-xl dark:bg-gray-800 dark:text-gray-400">
          {truck.name} has no shipments yet.
          {caps.create && " Use New shipment to add the first one."}
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => {
            const boxes = s.lines.reduce((sum, l) => sum + l.boxCount, 0);
            const plants = s.lines.reduce((sum, l) => sum + l.totalPlants, 0);

            return (
              <div
                key={s.id}
                className="rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {s.shipmentNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(s.shipmentDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {boxes.toLocaleString()} boxes
                    </p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {plants.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {caps.edit && (
                      <Link
                        href={`/trucks/${truck.id}/shipments/${s.id}/edit`}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    )}
                    {caps.delete && (
                      <button
                        onClick={() => setDeleting(s.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 dark:border-gray-700">
                  {s.lines.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {l.harvestedProduct?.name ?? "—"}
                        {l.harvestedProduct?.planteCode && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Code {l.harvestedProduct.planteCode}
                          </span>
                        )}
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {l.plantsPerBox}/box
                        </span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {l.boxCount} × {l.plantsPerBox} ={" "}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {l.totalPlants.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={deleting !== null}
        title="Delete shipment"
        message="Delete this shipment? The plants go back into finished-goods stock."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
