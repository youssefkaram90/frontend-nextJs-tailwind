"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createDelivery } from "@/app/lib/services/deliveries";
import { useToast } from "@/app/lib/toast-context";
import { StockType, ProductType } from "@/app/lib/types/delivery";
import { ArrowLeft, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import {
  createDeliverySchema,
  type CreateDeliveryFormData,
} from "@/app/schemas/delivery.schema";

export default function CreateDeliveryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CreateDeliveryFormData>({
    resolver: zodResolver(createDeliverySchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      deliveryDate: new Date().toLocaleDateString("en-CA"),
      deliveryCode: "",
      remark: "",
      lots: [
        {
          stockType: "CVT",
          lotNumber: "",
          quantity: undefined as unknown as number,
          productType: "SEEDS",
          productName: "",
          supplierName: "",
          thousandSeedsPerGram: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lots",
  });

  const watchedLots = useWatch({ control, name: "lots" });

  const [expandedLot, setExpandedLot] = useState<number | null>(0);

  const { seedsTotal, peatTotal } = useMemo(() => {
    if (!watchedLots) return { seedsTotal: 0, peatTotal: 0 };
    let seeds = 0;
    let peat = 0;
    for (const lot of watchedLots) {
      const qty =
        typeof lot?.quantity === "number" && !isNaN(lot.quantity)
          ? lot.quantity
          : 0;
      if (lot?.productType === "PEAT") peat += qty;
      else seeds += qty;
    }
    return { seedsTotal: seeds, peatTotal: peat };
  }, [watchedLots]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const { showToast } = useToast();

  async function onSubmit(data: CreateDeliveryFormData) {
    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        deliveryDate: data.deliveryDate,
        deliveryCode: data.deliveryCode,
        ...(data.remark ? { remark: data.remark } : {}),
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
        })),
      };

      await createDelivery(payload);
      showToast("Delivery created successfully!", "success");
      router.push("/deliveries");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create delivery",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => {
          if (
            isDirty &&
            !window.confirm(
              "You have unsaved changes. Are you sure you want to leave?",
            )
          )
            return;
          router.push("/deliveries");
        }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deliveries
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Page Header + Submit */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Delivery
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Record an incoming stock delivery
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting ? "Creating..." : "Create Delivery"}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/*Delivery Date */}
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

            {/* Remark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remark
                <span className="text-gray-400 font-normal"> (optional)</span>
              </label>
              <input
                type="text"
                {...register(`remark`)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Mark your notes"
              />
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
                  quantity: undefined as unknown as number,
                  productType: "SEEDS",
                  productName: "",
                  supplierName: "",
                  thousandSeedsPerGram: "",
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

          {fields.map((field, index) => {
            const productType = watchedLots?.[index]?.productType;
            const isCollapsed = expandedLot !== index;
            const lot = watchedLots?.[index];

            return (
              <div
                key={field.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4 relative"
              >
                {/* Lot header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLot((prev) => (prev === index ? null : index))
                    }
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    />
                    Lot #{index + 1}
                    {isCollapsed && lot && (
                      <span className="font-normal text-gray-400 dark:text-gray-500 truncate max-w-[300px]">
                        — {lot.productName || "…"}
                        {lot.lotNumber && ` · ${lot.lotNumber}`}
                        {typeof lot.quantity === "number" &&
                          lot.quantity > 0 &&
                          ` · ${lot.quantity}`}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const source = watchedLots?.[index];
                        append({
                          stockType:
                            (source?.stockType as "BIO" | "CVT") ?? "CVT",
                          lotNumber: "",
                          quantity: undefined as unknown as number,
                          productType:
                            (source?.productType as "SEEDS" | "PEAT") ??
                            "SEEDS",
                          productName: source?.productName ?? "",
                          supplierName: source?.supplierName ?? "",
                          thousandSeedsPerGram:
                            source?.thousandSeedsPerGram ?? "",
                        });
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                      title="Duplicate lot"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedLot((prev) => {
                            if (prev === null) return null;
                            if (prev === index)
                              return index > 0 ? index - 1 : 0;
                            return prev > index ? prev - 1 : prev;
                          });
                          remove(index);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                    {/*Stock Type (CVT | BIO*/}
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
                          {errors.lots[index].stockType.message}
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
                        {...register(`lots.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
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
                        {...register(`lots.${index}.productType`, {
                          onChange: (e) => {
                            if (e.target.value === "PEAT") {
                              setValue(
                                `lots.${index}.thousandSeedsPerGram`,
                                "",
                              );
                            }
                          },
                        })}
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

                    {/* TSPG — only shown for SEEDS */}
                    {productType === "SEEDS" && (
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {fields.length} lot{fields.length !== 1 ? "s" : ""}
              {seedsTotal > 0 && ` · Seeds: ${seedsTotal.toLocaleString()}`}
              {peatTotal > 0 && ` · Peat: ${peatTotal.toFixed(2)}`}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
            >
              {submitting ? "Creating..." : "Create Delivery"}
            </button>
          </div>
        </div>{" "}
      </form>
    </div>
  );
}
