"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { updateDelivery } from "@/app/lib/services/deliveries";
import { useDelivery } from "@/app/lib/hooks/use-deliveries";
import { useToast } from "@/app/lib/toast-context";
import { StockType, ProductType } from "@/app/lib/types/delivery";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  editDeliverySchema,
  type EditDeliveryFormData,
} from "@/app/schemas/delivery.schema";

export default function EditDeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: delivery, isPending, error: loadError } = useDelivery(id);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditDeliveryFormData>({
    resolver: zodResolver(editDeliverySchema),
    defaultValues: {
      deliveryCode: "",
      deliveryDate: new Date().toISOString().split("T")[0],
      lots: [
        {
          stockType: "CVT",
          lotNumber: "",
          quantity: 0,
          productType: "SEEDS",
          productName: "",
          supplierName: "",
          thousandSeedsPerGram: "",
          remark: "",
        },
      ],
    },
  });

  const { showToast } = useToast();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lots",
  });

  useEffect(() => {
    if (!delivery) return;
    reset({
      deliveryCode: delivery.deliveryCode,
      deliveryDate: delivery.deliveryDate.split("T")[0],
      lots: delivery.lots.map((lot) => ({
        stockType: lot.stockType as "BIO" | "CVT",
        lotNumber: lot.lotNumber,
        quantity: lot.quantity,
        productType: lot.productType as "SEEDS" | "PEAT",
        productName: lot.productName,
        supplierName: lot.supplierName,
        thousandSeedsPerGram: lot.thousandSeedsPerGram ?? "",
        remark: lot.remark ?? "",
      })),
    });
  }, [delivery, reset]);

  async function onSubmit(data: EditDeliveryFormData) {
    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        deliveryCode: data.deliveryCode,
        deliveryDate: data.deliveryDate,
        lots: data.lots.map((lot) => ({
          stockType: lot.stockType as StockType,
          lotNumber: lot.lotNumber,
          quantity: Number(lot.quantity),
          productType: lot.productType as ProductType,
          productName: lot.productName,
          supplierName: lot.supplierName,
          ...(typeof lot.thousandSeedsPerGram === "number" &&
          lot.thousandSeedsPerGram > 0
            ? { thousandSeedsPerGram: lot.thousandSeedsPerGram }
            : {}),
          ...(lot.remark ? { remark: lot.remark } : {}),
        })),
      };

      await updateDelivery(id, payload);
      showToast("Delivery updated successfully!", "success");
      router.push(`/deliveries/${id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to update delivery",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isPending) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4">
        <button
          onClick={() => router.push(`/deliveries/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Delivery
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {loadError instanceof Error
            ? loadError.message
            : "Failed to load delivery"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push(`/deliveries/${id}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Delivery
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Page Header + Submit */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Delivery
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update this delivery record
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {/* Delivery Details */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delivery Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/*Delivery Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Code *
              </label>
              <input
                type="text"
                {...register("deliveryCode")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {errors.deliveryCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.deliveryCode.message}
                </p>
              )}
            </div>

            {/**Delivery Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                {...register("deliveryDate")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {errors.deliveryDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.deliveryDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lots */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lots
            </h2>
            <button
              type="button"
              onClick={() =>
                append({
                  stockType: "CVT",
                  lotNumber: "",
                  quantity: 0,
                  productType: "SEEDS",
                  productName: "",
                  supplierName: "",
                  thousandSeedsPerGram: "",
                  remark: "",
                })
              }
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
              Add Lot
            </button>
          </div>

          {errors.lots?.root && (
            <p className="text-sm text-red-600">{errors.lots.root.message}</p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Lot #{index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    {...register(`lots.${index}.productName`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Tomato Roma"
                  />
                  {errors.lots?.[index]?.productName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lots[index]?.productName?.message}
                    </p>
                  )}
                </div>

                {/* Lot Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lot Number *
                  </label>
                  <input
                    type="text"
                    {...register(`lots.${index}.lotNumber`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. L-2024-001"
                  />
                  {errors.lots?.[index]?.lotNumber && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lots[index]?.lotNumber?.message}
                    </p>
                  )}
                </div>
                {/**Stock Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Type
                  </label>
                  <div className="flex gap-4">
                    {(["CVT", "BIO"] as const).map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          value={type}
                          {...register(`lots.${index}.stockType`)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.lots?.[index]?.stockType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lots[index]?.stockType.message}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    {...register(`lots.${index}.quantity`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="0"
                  />
                  {errors.lots?.[index]?.quantity && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lots[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Type *
                  </label>
                  <select
                    {...register(`lots.${index}.productType`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="SEEDS">Seeds</option>
                    <option value="PEAT">Peat</option>
                  </select>
                  {errors.lots?.[index]?.productType && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lots[index]?.productType?.message}
                    </p>
                  )}
                </div>

                {/* Supplier Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    {...register(`lots.${index}.supplierName`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Supplier"
                  />
                  {errors.lots?.[index]?.supplierName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lots[index]?.supplierName?.message}
                    </p>
                  )}
                </div>

                {/* TSPG */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    TSPG
                    <span className="text-gray-400 font-normal">
                      {" "}
                      (optional)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register(`lots.${index}.thousandSeedsPerGram`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. 2.56"
                  />
                </div>

                {/* Remark */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Remark
                    <span className="text-gray-400 font-normal">
                      {" "}
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register(`lots.${index}.remark`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Any notes"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
