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
  updateTunnel,
  deleteTunnel as deleteTunnelApi,
} from "@/app/lib/services/sowing";
import type { TunnelAssignment } from "@/app/lib/services/sowing";
import type {
  Tunnel,
  PendingTransportGroup,
  PendingTransportSowing,
} from "@/app/lib/types/sowing";
import { Banner } from "@/app/components/ui/banner";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  Save,
  CheckCircle,
} from "lucide-react";

export default function TrayTransportPage() {
  const router = useRouter();
  // Tray assignments and tunnel management live on this page.
  // Moving trays is part of sowing, so it is gated by `sowing.*` (TRAY-05).
  const caps = useCaps("sowing");
  const tunnelCaps = useCaps("tunnels");

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

  /**
   * The tunnel being corrected, or null while the form is adding a new one (TNL-1).
   *
   * Only an EMPTY tunnel can be corrected, and the server is the one that says so
   * (`canEdit` on each row): a tunnel's number is copied onto the sowings recorded
   * in it, so changing it after the fact would leave those copies behind.
   */
  const [editingTunnel, setEditingTunnel] = useState<Tunnel | null>(null);

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
  async function handleSubmitTunnel(e: React.FormEvent) {
    e.preventDefault();
    if (!tunnelNumber.trim() || !tunnelCapacity) return;
    setError(null);
    try {
      const dto = {
        number: tunnelNumber.trim(),
        location: tunnelLocation.trim() || undefined,
        capacity: Number(tunnelCapacity),
      };

      if (editingTunnel) {
        await updateTunnel(editingTunnel.id, dto);
        setSuccess(`Tunnel "${dto.number}" corrected`);
      } else {
        await createTunnel(dto);
        setSuccess(`Tunnel "${dto.number}" created`);
      }

      closeTunnelForm();
      const updated = await getTunnels();
      setTunnels(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingTunnel
            ? "Failed to correct tunnel"
            : "Failed to create tunnel",
      );
    }
  }

  /** Empty the form and leave correcting mode. */
  function closeTunnelForm() {
    setEditingTunnel(null);
    setTunnelNumber("");
    setTunnelLocation("");
    setTunnelCapacity("");
  }

  /**
   * Open the form on a tunnel that can still be corrected.
   *
   * The button that calls this is disabled for a tunnel that is already used, so
   * the server's refusal is never the first thing the operator learns.
   */
  function handleEditTunnel(tunnel: Tunnel) {
    setEditingTunnel(tunnel);
    setTunnelNumber(tunnel.number);
    setTunnelLocation(tunnel.location ?? "");
    setTunnelCapacity(String(tunnel.capacity));
    setError(null);
    setSuccess(null);
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
      // Reload data — including the TUNNELS (TRAY-08).
      //
      // `canEdit` is the server's answer (TNL-1), and sending trays into a tunnel
      // changes it: the tunnel is no longer empty, so it may no longer be
      // corrected. Without this re-read the figure stayed as it was at page load.
      const [allAssignments, tunnelList, pending] = await Promise.all([
        getTunnelAssignments(),
        getTunnels(),
        getPendingTransport(),
      ]);
      setAssignments(allAssignments);
      setTunnels(tunnelList);
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
      // The tunnels are re-read here for the same reason as on assign (TRAY-08), and
      // this is the one that matters: taking the LAST transport out makes the tunnel
      // empty again, so the server's `canEdit` flips back to true and the Pencil
      // becomes usable. A stale list kept it disabled, which looked exactly like the
      // emptying had not worked (TRAY-07).
      const [allAssignments, tunnelList, pending] = await Promise.all([
        getTunnelAssignments(),
        getTunnels(),
        getPendingTransport(),
      ]);
      setAssignments(allAssignments);
      setTunnels(tunnelList);
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
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-8 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              All sowings are fully assigned. Nothing needs transport.
            </p>
          </div>
        ) : (
          pendingGroups.map((group) => (
            <div
              key={group.planId}
              className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
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
                          {sowing.variety + " " + sowing.code}
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
                                  disabled={!caps.delete}
                                  title={
                                    caps.delete
                                      ? undefined
                                      : "You don't have permission to remove assignments"
                                  }
                                  className="ml-0.5 text-green-500 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
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
                          className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
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
                          className="w-20 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            !caps.create ||
                            submitting ||
                            assigningFor.sowingId !== sowing.id ||
                            !assigningFor.tunnelId ||
                            assigningFor.trays <= 0
                          }
                          title={
                            caps.create
                              ? undefined
                              : "You don't have permission to assign trays"
                          }
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg transition whitespace-nowrap disabled:cursor-not-allowed"
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
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tunnels ({tunnels.length})
        </h2>
        {editingTunnel && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Correcting tunnel {editingTunnel.number} — it is still empty, so
            nothing else has to change with it.
          </p>
        )}
        <form
          onSubmit={handleSubmitTunnel}
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
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-24"
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
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-32"
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
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-28"
            />
          </div>
          <button
            type="submit"
            disabled={editingTunnel ? !tunnelCaps.edit : !tunnelCaps.create}
            title={
              editingTunnel
                ? tunnelCaps.edit
                  ? undefined
                  : "You don't have permission to correct tunnels"
                : tunnelCaps.create
                  ? undefined
                  : "You don't have permission to add tunnels"
            }
            className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingTunnel ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingTunnel ? "Save" : "Add"}
          </button>
          {editingTunnel && (
            <button
              type="button"
              onClick={closeTunnelForm}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm"
            >
              Cancel
            </button>
          )}
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
                        <div className="flex items-center justify-end gap-3">
                          {tunnelCaps.edit && (
                            <button
                              type="button"
                              onClick={() => handleEditTunnel(t)}
                              disabled={!t.canEdit}
                              title={
                                t.canEdit
                                  ? "Correct this tunnel"
                                  : "Only an empty tunnel can be corrected — once a sowing or a harvest points at it, its number is part of that history."
                              }
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTunnel(t.id, t.number)}
                            disabled={!tunnelCaps.delete}
                            title={
                              tunnelCaps.delete
                                ? undefined
                                : "You don't have permission to delete tunnels"
                            }
                            className="text-red-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
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
                        disabled={!caps.delete}
                        title={
                          caps.delete
                            ? undefined
                            : "You don't have permission to remove assignments"
                        }
                        className="text-red-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
