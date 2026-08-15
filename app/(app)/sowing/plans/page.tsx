"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useSowingPlans,
  useDeleteSowingPlan,
} from "@/app/lib/hooks/use-sowing-plans";
import {
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  Sprout,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useSearch } from "@/app/lib/use-search";

export default function PlansPage() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useSearch();
  const {
    data: plans = [],
    isPending,
    error,
  } = useSowingPlans(debouncedQuery || undefined);
  const deletePlan = useDeleteSowingPlan();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { activePlans, completedPlans } = useMemo(() => {
    const active: typeof plans = [];
    const completed: typeof plans = [];
    for (const p of plans) {
      if (p.status === "COMPLETED") {
        completed.push(p);
      } else {
        active.push(p);
      }
    }
    return { activePlans: active, completedPlans: completed };
  }, [plans]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deletePlan.mutateAsync(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setDeleting(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      IN_PROGRESS:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
      COMPLETED:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    };
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.DRAFT}`}
      >
        {status === "IN_PROGRESS"
          ? "In Progress"
          : status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const renderPlanCard = (plan: (typeof plans)[0]) => {
    const total = plan._count?.entries ?? 0;
    const progressPct = plan.progressPercent ?? 0;
    const executedTotal = plan.executedTotal ?? 0;
    const plannedTotal = plan.plannedTotal ?? 0;

    return (
      <div
        key={plan.id}
        className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
      >
        <div
          className="p-5 cursor-pointer"
          onClick={() => router.push(`/sowing/plans/${plan.id}`)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                <Sprout className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {plan.planType === "SSM" ? "SSM (Tunnel)" : "LPM (Field)"}
                  {plan.location ? ` · ${plan.location}` : ""}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            {statusBadge(plan.status)}
            <span className="text-xs text-gray-400">{total} entries</span>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>
                  {executedTotal.toLocaleString()} of{" "}
                  {plannedTotal.toLocaleString()}{" "}
                  {plan.planType === "SSM" ? "trays" : "seeds"}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-400">
            Created{" "}
            {new Date(plan.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-2 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(plan.id, plan.name);
            }}
            disabled={deleting === plan.id}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 py-1 px-2 rounded transition"
          >
            <Trash2 className="h-3 w-3" />
            {deleting === plan.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    );
  };

  if (isPending) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sowing Plans
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Weekly planning for tunnels & fields
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/sowing/plans/create?tab=import")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 text-sm"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => router.push("/sowing/plans/create")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            New Plan
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search plans by name, type, status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
        />
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-16">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            No plans found.
          </p>
          <button
            onClick={() => router.push("/sowing/plans/create")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm"
          >
            <Plus className="h-4 w-4" />
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Plans */}
          {activePlans.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Active Plans ({activePlans.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activePlans.map(renderPlanCard)}
              </div>
            </section>
          )}

          {/* Completed Plans */}
          {completedPlans.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Completed ({completedPlans.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
                {completedPlans.map(renderPlanCard)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
