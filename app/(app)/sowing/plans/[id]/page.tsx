"use client";

import { useState, Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useSowingPlan,
  useUpdatePlanStatus,
  useAddPlanEntry,
  useUpdatePlanEntry,
  useDeletePlanEntry,
  useClosePlanEntry,
  useReopenPlanEntry,
} from "@/app/lib/hooks/use-sowing-plans";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { PlanEntryForm } from "@/app/components/sowing/plan-entry-form";
import type {
  CreatePlanEntryDto,
  SowingLPM,
  SowingPlanEntry,
  SowingSSM,
} from "@/app/lib/types/sowing";
import { PlanStatus } from "@/app/lib/types/sowing";
import {
  ArrowLeft,
  Sprout,
  Play,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Plus,
  Pencil,
  ChevronDown,
} from "lucide-react";

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: plan, isPending, error } = useSowingPlan(id);
  const updateStatus = useUpdatePlanStatus();
  const addEntry = useAddPlanEntry();
  const updateEntry = useUpdatePlanEntry();
  const deleteEntry = useDeletePlanEntry();
  const closeEntry = useClosePlanEntry();
  const reopenEntry = useReopenPlanEntry();
  const caps = useCaps("sowing");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  // "Add a line" is the collapsible section; it doubles as its open/closed state,
  // so Cancel closes it as well as clearing the form.
  const [addingLine, setAddingLine] = useState(false);
  /** The line being corrected — the form itself is the same one that adds. */
  const [editingEntry, setEditingEntry] = useState<SowingPlanEntry | null>(
    null,
  );
  const [savingLine, setSavingLine] = useState(false);

  /**
   * Add one line to a plan that is already running (SOW-08).
   *
   * Nothing offered this before: the service function, the relay and the backend
   * route all existed and were simply never called, so a plan's lines were frozen
   * the moment the plan was created.
   */
  const handleAddLine = async (dto: CreatePlanEntryDto) => {
    setSavingLine(true);
    try {
      await addEntry.mutateAsync({ planId: id, ...dto });
      setAddingLine(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add the line");
    } finally {
      setSavingLine(false);
    }
  };

  /**
   * Correct an existing line (SOW-08).
   *
   * The backend **replaces** the entry and re-derives its status and executed
   * counters, so the form sends every field — a partial patch would quietly wipe
   * whatever it left out.
   */
  const handleSaveLine = async (dto: CreatePlanEntryDto) => {
    if (!editingEntry) return;
    setSavingLine(true);
    try {
      await updateEntry.mutateAsync({
        planId: id,
        entryId: editingEntry.id,
        dto,
      });
      setEditingEntry(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save the line");
    } finally {
      setSavingLine(false);
    }
  };

  const handleStatusChange = async (status: PlanStatus) => {
    setActionLoading(status);
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Delete this entry?")) return;
    setActionLoading(entryId);
    try {
      await deleteEntry.mutateAsync(entryId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseEntry = async (entryId: string) => {
    if (
      !confirm(
        "Close this entry without reaching the planned quantity? You can reopen it later if this was a mistake.",
      )
    )
      return;
    setActionLoading(`close-${entryId}`);
    try {
      await closeEntry.mutateAsync(entryId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to close entry");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Undo a manual close (SPLAN-12). Offers the way back that closing used to
   * lack — the entry returns to whatever its sowings say it is.
   */
  const handleReopenEntry = async (entryId: string) => {
    if (
      !confirm(
        "Reopen this entry? It goes back to what its sowings say it is, and it can be sown against again.",
      )
    )
      return;
    setActionLoading(`reopen-${entryId}`);
    try {
      await reopenEntry.mutateAsync(entryId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reopen entry");
    } finally {
      setActionLoading(null);
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
        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.DRAFT}`}
      >
        {status === "IN_PROGRESS"
          ? "In Progress"
          : status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const entryStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
      PARTIALLY_EXECUTED:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
      EXECUTED:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
      CLOSED:
        "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    };
    const labels: Record<string, string> = {
      PARTIALLY_EXECUTED: "Partial",
      CLOSED: "Closed",
    };
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.PLANNED}`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  if (isPending) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error?.message || "Plan not found"}
        </div>
        <button
          onClick={() => router.push("/sowing/plans")}
          className="mt-4 flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </button>
      </div>
    );
  }

  const isSSM = plan.planType === "SSM";
  const entries = plan.entries ?? [];

  // Multi-entry execution selection
  const pendingEntryIds = entries
    .filter((e) => !["EXECUTED", "CLOSED"].includes(e.status))
    .map((e) => e.id);
  const allPendingSelected =
    pendingEntryIds.length > 0 &&
    pendingEntryIds.every((id) => selectedEntryIds.includes(id));
  const toggleEntrySelection = (id: string) =>
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleAllSelection = () =>
    setSelectedEntryIds(allPendingSelected ? [] : pendingEntryIds);
  const executeRoute = (ids: string[]) =>
    `/sowing/create?planId=${plan.id}&planEntryIds=${ids.join(",")}`;

  return (
    <div className="p-4 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/sowing/plans")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plans
      </button>

      {/* Plan Header */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">
                  {isSSM ? "SSM (Tunnel)" : "LPM (Field)"}
                </span>
                {statusBadge(plan.status)}
                <span className="text-sm text-gray-400">
                  {entries.length} entries
                </span>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-2">
            {caps.edit && plan.status === PlanStatus.DRAFT && (
              <button
                onClick={() => handleStatusChange(PlanStatus.IN_PROGRESS)}
                disabled={actionLoading === PlanStatus.IN_PROGRESS}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
              >
                {actionLoading === PlanStatus.IN_PROGRESS ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start
              </button>
            )}
            {caps.edit &&
              (plan.status === PlanStatus.DRAFT ||
                plan.status === PlanStatus.IN_PROGRESS) && (
                <button
                  onClick={() => handleStatusChange(PlanStatus.COMPLETED)}
                  disabled={actionLoading === PlanStatus.COMPLETED}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition"
                >
                  {actionLoading === PlanStatus.COMPLETED ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Complete
                </button>
              )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Created{" "}
          {new Date(plan.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Entries Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Plan Entries
          </h2>
          {caps.create && pendingEntryIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(executeRoute(pendingEntryIds))}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Play className="h-4 w-4" />
                Execute all ({pendingEntryIds.length})
              </button>
              <button
                onClick={() =>
                  selectedEntryIds.length > 0 &&
                  router.push(executeRoute(selectedEntryIds))
                }
                disabled={selectedEntryIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition"
              >
                Execute selected ({selectedEntryIds.length})
              </button>
            </div>
          )}
        </div>

        {/*
          Add a line (SOW-08). Collapsible, and the same editor the create-plan
          form uses, so a line added later cannot obey different rules from one
          created with the plan.
        */}
        {caps.create && (
          <details
            open={addingLine}
            onToggle={(event) =>
              setAddingLine((event.target as HTMLDetailsElement).open)
            }
            className="group border-b border-gray-200 dark:border-gray-700"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-3 text-sm font-medium text-green-600 hover:text-green-700 [&::-webkit-details-marker]:hidden">
              <Plus className="h-4 w-4" />
              Add a line
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-5 pt-1">
              <PlanEntryForm
                planType={plan.planType as "SSM" | "LPM"}
                submitting={savingLine}
                onSubmit={handleAddLine}
                onCancel={() => setAddingLine(false)}
              />
            </div>
          </details>
        )}

        {/* Correcting a line opens the same editor over the table. */}
        {editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditingEntry(null)}
            />
            <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Correct line{" "}
                {entries.findIndex((e) => e.id === editingEntry.id) + 1} —{" "}
                {editingEntry.variety}
              </h3>
              <PlanEntryForm
                planType={plan.planType as "SSM" | "LPM"}
                entry={editingEntry}
                position={
                  entries.findIndex((e) => e.id === editingEntry.id) + 1
                }
                submitting={savingLine}
                onSubmit={handleSaveLine}
                onCancel={() => setEditingEntry(null)}
              />
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Sprout className="mx-auto h-10 w-10 mb-2" />
            <p>No entries in this plan yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleAllSelection}
                      disabled={pendingEntryIds.length === 0}
                      className="accent-green-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Variety</th>

                  {isSSM ? (
                    <>
                      <th className="px-4 py-3 text-center font-medium">
                        Peat
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Trays
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-right font-medium">Qty</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Sector
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Lines</th>
                      <th className="px-4 py-3 text-right font-medium">
                        m/Line
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Seeds/m
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry, idx) => (
                  <Fragment key={entry.id}>
                    <tr
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${
                        entry.status === "EXECUTED"
                          ? "bg-green-50/30 dark:bg-green-900/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 w-8">
                        {entry.status !== "EXECUTED" && (
                          <input
                            type="checkbox"
                            checked={selectedEntryIds.includes(entry.id)}
                            onChange={() => toggleEntrySelection(entry.id)}
                            className="accent-green-600"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {new Date(entry.plannedDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {entry.variety}
                      </td>

                      {isSSM ? (
                        <>
                          <td className="px-4 py-3 text-center">
                            {isSSM && entry.peat ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                                {entry.peat}
                              </span>
                            ) : isSSM ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {entry.plannedTrays ?? "—"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {entry.plannedQuantity?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {entry.sector?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {entry.lines ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                            {entry.metersPerLine ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                            {entry.seedsPerMeter ?? "—"}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center">
                        {entryStatusBadge(entry.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {caps.create &&
                            entry.status !== "EXECUTED" &&
                            entry.status !== "CLOSED" && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/sowing/create?planId=${plan.id}&planEntryId=${entry.id}&type=${plan.planType}`,
                                  )
                                }
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                              >
                                <Play className="h-3 w-3" />
                                Execute
                              </button>
                            )}
                          {/**
                            Correcting a line is offered while the line is still
                            work in progress. A manually CLOSED line has Reopen
                            right beside it, and an EXECUTED one is frozen by the
                            backend (`updateEntry` refuses it), so offering Edit
                            there would only produce a rejection.
                          */}
                          {caps.edit &&
                            (entry.status === "PLANNED" ||
                              entry.status === "PARTIALLY_EXECUTED") && (
                              <button
                                onClick={() => setEditingEntry(entry)}
                                title="Correct this line"
                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white font-medium"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                            )}
                          {caps.edit &&
                            entry.status !== "EXECUTED" &&
                            entry.status !== "CLOSED" && (
                              <button
                                onClick={() => handleCloseEntry(entry.id)}
                                disabled={actionLoading === `close-${entry.id}`}
                                title="Close without reaching the planned quantity"
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === `close-${entry.id}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Close
                              </button>
                            )}
                          {caps.edit && entry.status === "CLOSED" && (
                            <button
                              onClick={() => handleReopenEntry(entry.id)}
                              disabled={actionLoading === `reopen-${entry.id}`}
                              title="Reopen this entry so it can be sown against again"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === `reopen-${entry.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              Reopen
                            </button>
                          )}
                          {entry.status !== "PLANNED" &&
                            (entry.ssmSowings?.length ||
                              entry.lpmSowings?.length) && (
                              <button
                                onClick={() =>
                                  setExpandedEntryId(
                                    expandedEntryId === entry.id
                                      ? null
                                      : entry.id,
                                  )
                                }
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {expandedEntryId === entry.id ? "▾" : "▸"}{" "}
                                {entry.ssmSowings?.length ??
                                  entry.lpmSowings?.length ??
                                  0}{" "}
                                sowing
                                {(entry.ssmSowings?.length ??
                                  entry.lpmSowings?.length ??
                                  0) !== 1
                                  ? "s"
                                  : ""}
                              </button>
                            )}
                          {caps.delete && (
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={actionLoading === entry.id}
                              className="text-red-400 hover:text-red-600 disabled:opacity-50"
                            >
                              {actionLoading === entry.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedEntryId === entry.id && (
                      <tr
                        key={`${entry.id}-sowings`}
                        className="bg-blue-50/30 dark:bg-blue-900/10"
                      >
                        <td colSpan={isSSM ? 7 : 10} className="px-4 py-2">
                          <div className="space-y-1.5">
                            {(entry.ssmSowings ?? entry.lpmSowings ?? []).map(
                              (sowing) => {
                                const sowingDate = new Date(
                                  sowing.sowingDate,
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                });
                                const estPlants = Math.round(
                                  sowing.quantityUsed * (isSSM ? 0.82 : 0.8),
                                );
                                const location = isSSM
                                  ? (() => {
                                    const ssmSowing = sowing as SowingSSM;
                                      const tunnels = ssmSowing.tunnelAssignments 
                                        ?.map((a) => a.tunnel?.number)
                                        .filter(Boolean);
                                      return tunnels?.length
                                        ? `Tunnels ${tunnels.join(", ")}`
                                        : `Tunnel ${ssmSowing.tunnel?.number ?? "—"}`;
                                    })()
                                  : `Sector ${(sowing as SowingLPM).sector?.name ?? "—"}`;
                                return (
                                  <button
                                    key={sowing.id}
                                    onClick={() =>
                                      router.push(
                                        `/sowing/${sowing.id}?type=${plan.planType}`,
                                      )
                                    }
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition group"
                                  >
                                    <Sprout className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      Sown {sowingDate}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      · {location}
                                    </span>
                                    {isSSM && (sowing as SowingSSM).numberOfTrays && (
                                      <span className="text-xs text-gray-400">
                                        · {(sowing as SowingSSM).numberOfTrays} trays
                                      </span>
                                    )}
                                    <span className="text-xs font-medium text-blue-600 ml-auto">
                                      {estPlants.toLocaleString()} plants →
                                    </span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
