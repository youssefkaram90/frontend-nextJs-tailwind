"use client";

import { useState } from "react";
import Link from "next/link";
import { Droplets, Plus, Trash2, MapPin, CalendarDays } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { useToast } from "@/app/lib/toast-context";
import { cropCareTypeLabel } from "@/app/lib/types/crop-care";
import {
  useOperations,
  useDeleteOperation,
} from "@/app/lib/hooks/use-crop-care";

export default function OperationsPage() {
  const { showToast } = useToast();
  const [operationType, setOperationType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useOperations({
    operationType: operationType === "ALL" ? undefined : operationType,
    page,
    pageSize: 20,
  });
  const caps = useCaps("crop-care");
  const deleteOperation = useDeleteOperation();

  const operations = data?.items ?? [];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteOperation.mutateAsync(deleting);
      showToast("Operation deleted");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error",
      );
    } finally {
      setDeleting(null);
    }
  }

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

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Crop Operations"
        description="Irrigation & treatment log for tunnels and sectors"
        backTo="/crop-care"
        backLabel="Back to Crop Care"
      >
        {caps.create && (
          <Link
            href="/crop-care/operations/create"
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> Log operation
          </Link>
        )}
      </PageHeader>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "IRRIGATION", "TREATMENT", "FERTILISATION"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setOperationType(t);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              operationType === t
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            }`}
          >
            {t === "ALL" ? "All" : cropCareTypeLabel(t)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : operations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Droplets className="mx-auto h-10 w-10 mb-2" />
            No operations found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {operations.map((op) => (
              <div
                key={op.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center ${
                      op.operationType === "IRRIGATION"
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : op.operationType === "FERTILISATION"
                          ? "bg-emerald-100 dark:bg-emerald-900/50"
                          : "bg-purple-100 dark:bg-purple-900/50"
                    }`}
                  >
                    <Droplets
                      className={`h-5 w-5 ${
                        op.operationType === "IRRIGATION"
                          ? "text-blue-600 dark:text-blue-400"
                          : op.operationType === "FERTILISATION"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-purple-600 dark:text-purple-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {op.operationType === "IRRIGATION"
                          ? "Irrigation"
                          : (op.product?.name ??
                            cropCareTypeLabel(op.operationType))}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                          op.source === "PLAN"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {op.source === "PLAN"
                          ? `from ${op.planEntry?.plan.name ?? "plan"}`
                          : "standalone"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{" "}
                        {locationNames(op.locations)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(op.performedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {op.quantity != null && (
                        <span>
                          {op.quantity} {op.product?.unit ?? ""}
                        </span>
                      )}
                      {op.notes && (
                        <span className="text-gray-400">— {op.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
                {caps.delete && (
                  <button
                    onClick={() => setDeleting(op.id)}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            ))}
          </div>
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
        title="Delete operation"
        message="Delete this operation? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
