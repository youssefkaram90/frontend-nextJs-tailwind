"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSowing, deleteSowing } from "@/app/lib/services/sowing";
import type { Sowing } from "@/app/lib/types/sowing";
import {
  ArrowLeft,
  Sprout,
  Pencil,
  Trash2,
  Layers,
  LeafyGreen,
} from "lucide-react";
import { DetailCardSkeleton } from "@/app/components/skeleton";

export default function SowingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sowing, setSowing] = useState<Sowing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSowing(id);
        setSowing(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sowing record",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSowing(id);
      router.push("/sowing");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete sowing record",
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <DetailCardSkeleton />
      </div>
    );
  }

  if (error && !sowing) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Sowing record not found"}
        </div>
      </div>
    );
  }

  if (!sowing) return null;

  const ps = sowing.plantStock;

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/sowing")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sowings
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md mx-4 w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete Sowing Record?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete this sowing record and its plant
              stock. Stock quantities will be adjusted accordingly. This action
              cannot be undone.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sowing Detail Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <Sprout className="h-7 w-7 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {sowing.cropType}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sowing Record
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => router.push(`/sowing/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg transition"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sowing Date
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
              {new Date(sowing.sowingDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Location
            </p>
            <p className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sowing.greenhouse === "GREENHOUSE"
                    ? "bg-teal-100 text-teal-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {sowing.greenhouse === "GREENHOUSE"
                  ? "Greenhouse (Plastic Tunnel)"
                  : "Field (Direct Sowing)"}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Lot Number
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white font-mono">
              {sowing.lotNumber}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Product Type
            </p>
            <p className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sowing.productType === "SEEDS"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {sowing.productType}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stock Type
            </p>
            <p className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sowing.stockType === "BIO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {sowing.stockType}
              </span>
            </p>
          </div>

          {/* Greenhouse-specific: Trays info */}
          {sowing.numberOfTrays && (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Number of Trays
                </p>
                <p className="mt-1 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                  <Layers className="h-4 w-4 text-teal-500" />
                  {sowing.numberOfTrays} trays
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Seeds per Tray
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  {sowing.seedsPerTray}
                </p>
              </div>
            </>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Seeds Used (from stock)
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {sowing.quantityUsed.toLocaleString()}
            </p>
          </div>

          {sowing.remarks && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Remarks
              </p>
              <p className="mt-1 text-base text-gray-700 dark:text-gray-300">
                {sowing.remarks}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created At
            </p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {new Date(sowing.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Plant Stock Card */}
      {ps && (
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border-t-4 border-green-500">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <LeafyGreen className="h-7 w-7 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Plant Stock
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Growing from this sowing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expected Plants
              </p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {ps.expectedPlants.toLocaleString()}
              </p>
            </div>

            {ps.numberOfTrays && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trays
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  {ps.numberOfTrays} × {ps.seedsPerTray} seeds
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Current Stage
              </p>
              <p className="mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {ps.currentStage}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {ps.location === "GREENHOUSE" ? "Greenhouse" : "Field"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Seed Lot
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white font-mono">
                {ps.lotNumber}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock Type
              </p>
              <p className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ps.stockType === "BIO"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {ps.stockType}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
