"use client";

import { useState } from "react";
import { CalendarDays, Droplets, MapPin, Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import {
  useDeleteOperation,
  useOperations,
} from "@/app/lib/hooks/use-crop-care";
import { cropCareTypeLabel } from "@/app/lib/types/crop-care";
import type { CropCareType, CropOperation } from "@/app/lib/types/crop-care";
import { OperationForm } from "@/app/components/crop-care/operation-form";

/**
 * The operations list, showing the kind chosen on the form above — with a single
 * **All** button to step back and read the whole log (user, 2026-10-11).
 *
 * There are deliberately NO kinds listed here: the three kinds are chosen on the
 * form, and the list follows that choice, so a second set of buttons would be a
 * second answer to the same question. **All** is the one thing the form cannot
 * say — "show me everything" — so it is the one control that lives here.
 *
 * Choosing a kind on the form turns All back off: the form is "what I am doing
 * now", and the list is the record of that same kind.
 *
 * The search text arrives as a PROP, because the box sits up under the page's
 * links; this component only asks the server with it.
 *
 * One copy, shared by the page and by the old `/crop-care/operations` address.
 *
 * Each row carries two actions since CROP-14: **Edit** — correct a wrong dose,
 * date, place or note (`crop-care.edit`) — and **Delete** (`crop-care.delete`).
 * They are the two ways to be wrong about a record already filed, and each is
 * gated on what the server would actually allow.
 */
export function OperationsList({
  kind,
  query,
}: {
  kind: CropCareType;
  query?: string;
}) {
  const { showToast } = useToast();
  const caps = useCaps("crop-care");

  const [showAllState, setShowAllState] = useState<{
    kind: CropCareType;
    value: boolean;
  }>({ kind, value: false });

  const showAll = showAllState.kind === kind && showAllState.value;

  const [pageState, setPageState] = useState<{
    scope: string;
    page: number;
  }>({ scope: "", page: 1 });

  const scope = `${kind}|${query ?? ""}|${showAll}`;
  const page = pageState.scope === scope ? pageState.page : 1;

  const changePage = (nextPage: number) => {
    setPageState({ scope, page: nextPage });
  };

  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<CropOperation | null>(null);

  const { data, isLoading } = useOperations({
    q: query || undefined,
    operationType: showAll ? undefined : kind,
    page,
    pageSize: 20,
  });
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
    <div className="space-y-4">
      {/*
        ONE control: All. The three kinds are on the form above, and the list
        already follows them — so this button is only the thing the form cannot
        say: "everything". Its tooltip spells out what the list is showing when it
        is off.
      */}
      <div className="inline-flex rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
        <button
          onClick={() => setShowAllState({kind,value:!showAll})}
          title={
            showAll
              ? "Showing every kind — click to go back to what the form is on"
              : `Showing ${cropCareTypeLabel(kind).toLowerCase()} only — click for every kind`
          }
          className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
            showAll
              ? "bg-green-600 text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          All
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : operations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Droplets className="mx-auto h-10 w-10 mb-2" />
            {showAll
              ? "No operations found."
              : `No ${cropCareTypeLabel(kind).toLowerCase()} found.`}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {operations.map((op) => (
              <div
                key={op.id}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  {/*
                    The kind marker is on every row: with "All" selected the row is
                    the only place that says whether this was an irrigation, a
                    treatment or a fertilisation.
                  */}
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
                <div className="flex items-center gap-2">
                  {caps.edit && (
                    <button
                      onClick={() => setEditing(op)}
                      title="Correct this operation — a wrong dose, date, place or note"
                      className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  {caps.delete && (
                    <button
                      onClick={() => setDeleting(op.id)}
                      title="Delete this operation — the stock it used is given back"
                      className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {data.items.length} of {data.total} shown
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              disabled={!data.hasMore}
              onClick={() => changePage(page + 1)}
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
        message="Delete this operation? The stock it used is given back, and this cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/*
        Correcting happens in the same form that logs, prefilled (CROP-14). The
        `key` is what makes that work: the form takes its fields from the
        operation once, on mount, so opening a second row has to be a fresh mount
        or it would still be showing the first row's numbers.
      */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          />
          <div className="relative z-10 my-8 w-full max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white drop-shadow">
                Correct this operation
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Cancel
              </button>
            </div>
            <OperationForm
              key={editing.id}
              kind={kind}
              editing={editing}
              onDone={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
