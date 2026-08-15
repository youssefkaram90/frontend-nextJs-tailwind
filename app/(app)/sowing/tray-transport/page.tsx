"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getTunnels,
  getTunnelAssignments,
  getPendingTransport,
  createTunnelAssignments,
  deleteTunnelAssignment,
  createTunnel,
  deleteTunnel as deleteTunnelApi,
} from "@/app/lib/services/sowing";
import type { TunnelAssignment } from "@/app/lib/services/sowing";
import type {
  Tunnel,
  PendingTransportGroup,
  PendingTransportSowing,
} from "@/app/lib/types/sowing";
import { Banner } from "@/app/components/ui/banner";
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function TrayTransportPage() {
  const router = useRouter();

  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [assignments, setAssignments] = useState<TunnelAssignment[]>([]);
  const [pendingGroups, setPendingGroups] = useState<PendingTransportGroup[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tunnel create form
  const [tunnelNumber, setTunnelNumber] = useState("");
  const [tunnelLocation, setTunnelLocation] = useState("");
  const [tunnelCapacity, setTunnelCapacity] = useState("");

  // Inline assignment form (per sowing)
  const [assigningFor, setAssigningFor] = useState<{
    sowingId: string;
    tunnelId: string;
    trays: number;
  }>({ sowingId: "", tunnelId: "", trays: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tunnelList, allAssignments, pending] = await Promise.all([
        getTunnels(),
        getTunnelAssignments(),
        getPendingTransport(),
      ]);
      setTunnels(tunnelList);
      setAssignments(allAssignments);
      setPendingGroups(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // ── Tunnel CRUD ──
  async function handleCreateTunnel(e: React.FormEvent) {
    e.preventDefault();
    if (!tunnelNumber.trim() || !tunnelCapacity) return;
    setError(null);
    try {
      await createTunnel({
        number: tunnelNumber.trim(),
        location: tunnelLocation.trim() || undefined,
        capacity: Number(tunnelCapacity),
      });
      setSuccess(`Tunnel "${tunnelNumber.trim()}" created`);
      setTunnelNumber("");
      setTunnelLocation("");
      setTunnelCapacity("");
      const updated = await getTunnels();
      setTunnels(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tunnel");
    }
  }

  async function handleDeleteTunnel(id: string, number: string) {
    if (!confirm(`Delete Tunnel ${number}?`)) return;
    try {
      await deleteTunnelApi(id);
      setTunnels((prev) => prev.filter((t) => t.id !== id));
      setSuccess(`Tunnel ${number} deleted`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tunnel");
    }
  }

  // ── Inline Assign ──
  async function handleInlineAssign(
    sowing: PendingTransportSowing,
    tunnelId: string,
    trays: number,
  ) {
    if (!tunnelId || trays <= 0) {
      setError("Select a tunnel and enter tray count");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createTunnelAssignments({
        assignments: [
          { ssmSowingId: sowing.id, tunnelId, numberOfTrays: trays },
        ],
      });
      setSuccess(`${trays} trays of "${sowing.variety}" assigned`);
      // Reload data
      const [allAssignments, pending] = await Promise.all([
        getTunnelAssignments(),
        getPendingTransport(),
      ]);
      setAssignments(allAssignments);
      setPendingGroups(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    try {
      await deleteTunnelAssignment(assignmentId);
      const [allAssignments, pending] = await Promise.all([
        getTunnelAssignments(),
        getPendingTransport(),
      ]);
      setAssignments(allAssignments);
      setPendingGroups(pending);
      setSuccess("Assignment removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  // ── Stats ──
  const tunnelStats = useMemo(() => {
    const map: Record<
      string,
      { capacity: number; used: number; available: number }
    > = {};
    for (const t of tunnels)
      map[t.id] = { capacity: t.capacity, used: 0, available: t.capacity };
    for (const a of assignments) {
      if (map[a.tunnelId]) {
        map[a.tunnelId].used += a.numberOfTrays;
        map[a.tunnelId].available =
          map[a.tunnelId].capacity - map[a.tunnelId].used;
      }
    }
    return map;
  }, [tunnels, assignments]);

  const totalPending = pendingGroups.reduce(
    (sum, g) => sum + g.sowings.length,
    0,
  );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );

  return (
    <div className="p-4 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tray Transport
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Assign trays to tunnels
        </p>
      </div>
      {error && <Banner message={error} variant="error" />}
      {success && <Banner message={success} variant="success" />}

      {/* ═══ NEEDS TRANSPORT ═══ */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Needs Transport ({totalPending} sowings)
        </h2>

        {pendingGroups.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              All sowings are fully assigned. Nothing needs transport.
            </p>
          </div>
        ) : (
          pendingGroups.map((group) => (
            <div
              key={group.planId}
              className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {group.planName}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {group.sowings.length} sowing
                  {group.sowings.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.sowings.map((sowing) => (
                  <div key={sowing.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {sowing.variety}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Lot: {sowing.lotNumber} · {sowing.stockType} ·{" "}
                          {sowing.numberOfTrays} trays total
                        </p>
                        {/* Progress bar */}
                        <div className="mt-2 w-full max-w-xs">
                          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                            <span>
                              {sowing.assignedTrays} / {sowing.numberOfTrays}{" "}
                              assigned
                            </span>
                            <span>{sowing.remainingTrays} left</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${(sowing.assignedTrays / sowing.numberOfTrays) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        {/* Existing assignments */}
                        {sowing.assignments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {sowing.assignments.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              >
                                {a.tunnelNumber}: {a.numberOfTrays} trays
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  className="ml-0.5 text-green-500 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Inline assignment form */}
                      <div className="flex items-end gap-2 flex-shrink-0">
                        <select
                          value={
                            assigningFor.sowingId === sowing.id
                              ? assigningFor.tunnelId
                              : ""
                          }
                          onChange={(e) =>
                            setAssigningFor({
                              sowingId: sowing.id,
                              tunnelId: e.target.value,
                              trays: assigningFor.trays,
                            })
                          }
                          className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Tunnel</option>
                          {tunnels.map((t) => {
                            const st = tunnelStats[t.id];
                            return (
                              <option key={t.id} value={t.id}>
                                {t.number} ({st?.available ?? t.capacity} free)
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={sowing.remainingTrays}
                          placeholder="Trays"
                          value={
                            assigningFor.sowingId === sowing.id
                              ? assigningFor.trays || ""
                              : ""
                          }
                          onChange={(e) =>
                            setAssigningFor({
                              sowingId: sowing.id,
                              tunnelId:
                                assigningFor.sowingId === sowing.id
                                  ? assigningFor.tunnelId
                                  : "",
                              trays: Number(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineAssign(
                              sowing,
                              assigningFor.tunnelId,
                              assigningFor.trays,
                            )
                          }
                          disabled={
                            submitting ||
                            assigningFor.sowingId !== sowing.id ||
                            !assigningFor.tunnelId ||
                            assigningFor.trays <= 0
                          }
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg transition whitespace-nowrap"
                        >
                          {submitting && assigningFor.sowingId === sowing.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Assign"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ═══ TUNNELS ═══ */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tunnels ({tunnels.length})
        </h2>
        <form
          onSubmit={handleCreateTunnel}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Number</label>
            <input
              type="text"
              value={tunnelNumber}
              onChange={(e) => setTunnelNumber(e.target.value)}
              placeholder="e.g. T1"
              required
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Location
            </label>
            <input
              type="text"
              value={tunnelLocation}
              onChange={(e) => setTunnelLocation(e.target.value)}
              placeholder="e.g. Block A"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-32"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Capacity
            </label>
            <input
              type="number"
              value={tunnelCapacity}
              onChange={(e) => setTunnelCapacity(e.target.value)}
              placeholder="5000"
              required
              min="1"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-28"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
        {tunnels.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Number
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Location
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Cap.
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Used
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Free
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tunnels.map((t) => {
                  const s = tunnelStats[t.id];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {t.number}
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                        {t.location || "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                        {t.capacity.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400">
                        {s?.used.toLocaleString() ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">
                        {s?.available.toLocaleString() ??
                          t.capacity.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteTunnel(t.id, t.number)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ ALL ASSIGNMENTS ═══ */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Assignments ({assignments.length})
          </h2>
        </div>
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Truck className="mx-auto h-10 w-10 mb-2" />
            <p>No assignments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    Variety
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    Lot #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    Tunnel
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    Trays
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[120px] truncate">
                      {a.ssmSowing?.plan?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {a.ssmSowing?.variety ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {a.ssmSowing?.lotNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                        {a.tunnel?.number ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {a.numberOfTrays}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(a.transportDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
