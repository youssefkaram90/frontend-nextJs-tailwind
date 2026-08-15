"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDelivery, useDeleteDelivery } from "@/app/lib/hooks/use-deliveries";
import { ArrowLeft, Truck, Pencil, Trash2 } from "lucide-react";
import { DetailCardSkeleton, TableSkeleton } from "@/app/components/skeleton";

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: delivery, isPending, error } = useDelivery(id);
  const deleteDelivery = useDeleteDelivery();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDelivery.mutateAsync(id);
      router.push("/deliveries");
    } catch (err) {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <DetailCardSkeleton />
        <TableSkeleton rows={3} cols={6} />
      </div>
    );
  }

  if (error && !delivery) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Delivery not found"}
        </div>
      </div>
    );
  }

  if (!delivery) return null;

  const seedsTotal = delivery.lots
    .filter((l) => l.productType === "SEEDS")
    .reduce((sum, lot) => sum + lot.quantity, 0);
  const peatTotal = delivery.lots
    .filter((l) => l.productType === "PEAT")
    .reduce((sum, lot) => sum + lot.quantity, 0);

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/deliveries")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deliveries
      </button>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md mx-4 w-full"
          >
            <h3
              id="delete-dialog-title"
              className="text-lg font-bold text-gray-900 dark:text-white mb-2"
            >
              Delete Delivery?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete this delivery and its lots. Stock
              quantities will be adjusted accordingly. This action cannot be
              undone.
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
      {/* Delivery Header Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <Truck className="h-7 w-7 text-indigo-600" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Delivery
            </h1>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {delivery.deliveryCode}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Delivery Date
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date(delivery.deliveryDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {delivery.lots.length} lot{delivery.lots.length !== 1 ? "s" : ""}
              {seedsTotal > 0 && (
                <span className="ml-2">
                  Seeds: {seedsTotal.toLocaleString()}
                </span>
              )}
              {peatTotal > 0 && (
                <span className="ml-2">Peat: {peatTotal.toFixed(2)}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.push(`/deliveries/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition"
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
      </div>
      {/* Error banner (non-critical) */}
      {error && !showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* Lots Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lots
            </h2>
            <p className="text-right">Remark : {delivery.remark}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <th className="px-6 py-3 text-left font-medium">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left font-medium">Lot #</th>
                <th className="px-6 py-3 text-left font-medium">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left font-medium">Stock Type</th>

                <th className="px-6 py-3 text-right font-medium">Quantity</th>
                <th className="px-6 py-3 text-left font-medium">Supplier</th>
                <th className="px-6 py-3 text-right font-medium">TSPG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {delivery.lots.map((lot) => (
                <tr key={lot.id}>
                  {/**Product Name */}
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {lot.productName}
                  </td>

                  {/** Product Lot */}
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {lot.lotNumber}
                  </td>

                  {/**Product Type */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        lot.productType === "SEEDS"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {lot.productType}
                    </span>
                  </td>

                  {/**Stock Type */}
                  <td className="px-6 py-6">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium  ${
                        lot.stockType === "CVT"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {lot.stockType}
                    </span>
                  </td>
                  {/**Quantity */}
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                    {lot.quantity}
                  </td>
                  {/**Supplier Name */}
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {lot.supplierName}
                  </td>
                  {/**thousand seeds per gram */}
                  <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                    {lot.thousandSeedsPerGram ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
