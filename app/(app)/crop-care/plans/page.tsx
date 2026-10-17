"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Plus,
  Search,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { useToast } from "@/app/lib/toast-context";
import { usePlans, useDeletePlan } from "@/app/lib/hooks/use-crop-care";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};

export default function PlansPage() {
  const { showToast } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = usePlans({
    q: debounced || undefined,
    page,
    pageSize: 20,
  });
  const caps = useCaps("crop-care");
  const deletePlan = useDeletePlan();

  const plans = data?.items ?? [];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deletePlan.mutateAsync(deleting);
      showToast("Plan deleted");
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
        title="Crop Care Plans"
        description="Scheduled irrigation & treatment plans"
        backTo="/crop-care"
        backLabel="Back to Crop Care"
      >
        {caps.create && (
          <Link
            href="/crop-care/plans/create"
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> New plan
          </Link>
        )}
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search plans…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
            const t = setTimeout(() => setDebounced(e.target.value), 300);
            return () => clearTimeout(t);
          }}
        />
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : plans.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <CalendarClock className="mx-auto h-10 w-10 mb-2" />
            No plans found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {plans.map((plan) => (
              <div key={plan.id} className="px-6 py-4 flex items-center gap-4">
                <Link
                  href={`/crop-care/plans/${plan.id}`}
                  className="flex-1 flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600">
                        {plan.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                          statusColors[plan.status] ?? statusColors.DRAFT
                        }`}
                      >
                        {plan.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {plan.planType === "IRRIGATION"
                          ? "Irrigation"
                          : plan.planType === "FERTILISATION"
                            ? "Fertilisation"
                            : "Treatment"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 max-w-xs rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${plan.progressPercent ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.executedCount ?? 0}/{plan.entryCount ?? 0}{" "}
                        executed
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-green-600" />
                </Link>
                {caps.delete && (
                  <button
                    onClick={() => setDeleting(plan.id)}
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
        title="Delete plan"
        message="Delete this plan and all its entries? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
