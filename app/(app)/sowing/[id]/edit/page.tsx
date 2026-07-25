"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSowing, updateSowing } from "@/app/lib/services/sowing";
import { FieldLocation } from "@/app/lib/types/sowing";
import { ProductType, StockType } from "@/app/lib/types/delivery";
import { ArrowLeft, Info } from "lucide-react";

const DEFAULT_SEEDS_PER_TRAY = 285;

const editSowingSchema = z
  .object({
    cropType: z.string().min(1, "Crop type is required"),
    sowingDate: z.string().min(1, "Sowing date is required"),
    greenhouse: z.enum(["GREENHOUSE", "FIELD"], {
      message: "Location is required",
    }),
    lotNumber: z.string().min(1, "Lot number is required"),
    productType: z.enum(["SEEDS", "PEAT"], {
      message: "Product type is required",
    }),
    stockType: z.enum(["BIO", "CVT"], {
      message: "Stock type is required",
    }),
    numberOfTrays: z.coerce.number().int().min(1).default(1),
    seedsPerTray: z.coerce
      .number()
      .int()
      .min(1)
      .default(DEFAULT_SEEDS_PER_TRAY),
    quantityUsed: z.coerce.number().int().min(0).default(0),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.greenhouse === "GREENHOUSE") {
        return (data.numberOfTrays ?? 0) > 0;
      }
      return (data.quantityUsed ?? 0) > 0;
    },
    {
      message: "Please enter number of trays (Greenhouse) or quantity (Field)",
      path: ["greenhouse"],
    },
  );

type EditSowingFormData = z.input<typeof editSowingSchema>;

export default function EditSowingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditSowingFormData>({
    resolver: zodResolver(editSowingSchema),
    defaultValues: {
      cropType: "",
      sowingDate: "",
      greenhouse: "GREENHOUSE",
      lotNumber: "",
      productType: "SEEDS",
      stockType: "BIO",
      numberOfTrays: 0,
      seedsPerTray: DEFAULT_SEEDS_PER_TRAY,
      quantityUsed: 0,
      remarks: "",
    },
  });

  const greenhouse = useWatch({ control, name: "greenhouse" }) as
    | "GREENHOUSE"
    | "FIELD";
  const numberOfTrays = useWatch({ control, name: "numberOfTrays" }) as
    | number
    | undefined;
  const seedsPerTray = useWatch({ control, name: "seedsPerTray" }) as
    | number
    | undefined;

  const calculatedTotal =
    greenhouse === "GREENHOUSE" && numberOfTrays && seedsPerTray
      ? numberOfTrays * seedsPerTray
      : null;

  useEffect(() => {
    async function load() {
      try {
        const sowing = await getSowing(id);
        if (sowing.numberOfTrays) {
          // Greenhouse sowing
          reset({
            cropType: sowing.cropType,
            sowingDate: sowing.sowingDate
              ? new Date(sowing.sowingDate).toISOString().split("T")[0]
              : "",
            greenhouse: sowing.greenhouse as "GREENHOUSE" | "FIELD",
            lotNumber: sowing.lotNumber,
            productType: sowing.productType as "SEEDS" | "PEAT",
            stockType: sowing.stockType as "BIO" | "CVT",
            numberOfTrays: sowing.numberOfTrays,
            seedsPerTray: sowing.seedsPerTray ?? DEFAULT_SEEDS_PER_TRAY,
            quantityUsed: 0,
            remarks: sowing.remarks ?? "",
          });
        } else {
          // Field sowing
          reset({
            cropType: sowing.cropType,
            sowingDate: sowing.sowingDate
              ? new Date(sowing.sowingDate).toISOString().split("T")[0]
              : "",
            greenhouse: sowing.greenhouse as "GREENHOUSE" | "FIELD",
            lotNumber: sowing.lotNumber,
            productType: sowing.productType as "SEEDS" | "PEAT",
            stockType: sowing.stockType as "BIO" | "CVT",
            numberOfTrays: undefined,
            seedsPerTray: DEFAULT_SEEDS_PER_TRAY,
            quantityUsed: sowing.quantityUsed,
            remarks: sowing.remarks ?? "",
          });
        }
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Failed to load sowing record",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, reset]);

  async function onSubmit(data: EditSowingFormData) {
    setSubmitting(true);
    setServerError(null);

    try {
      const dto: any = {
        cropType: data.cropType,
        sowingDate: new Date(data.sowingDate),
        greenhouse: data.greenhouse as FieldLocation,
        lotNumber: data.lotNumber,
        productType: data.productType as ProductType,
        stockType: data.stockType as StockType,
      };

      if (data.greenhouse === "GREENHOUSE") {
        dto.numberOfTrays = data.numberOfTrays;
        dto.seedsPerTray = data.seedsPerTray ?? DEFAULT_SEEDS_PER_TRAY;
        const numTrays = Number(data.numberOfTrays ?? 0);
        const seedsPerTray = Number(
          data.seedsPerTray ?? DEFAULT_SEEDS_PER_TRAY,
        );
        dto.quantityUsed = numTrays * seedsPerTray;
      } else {
        dto.quantityUsed = Number(data.quantityUsed ?? 0);
      }

      if (data.remarks) {
        dto.remarks = data.remarks;
      }

      await updateSowing(id, dto);
      router.push(`/sowing/${id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to update sowing record",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push(`/sowing/${id}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sowing Record
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Page Header + Submit */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Sowing
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update this sowing record
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
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

        {/* Form Fields */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sowing Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Crop Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Crop Type *
              </label>
              <input
                type="text"
                {...register("cropType")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="e.g. Tomato, Cucumber"
              />
              {errors.cropType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.cropType.message}
                </p>
              )}
            </div>

            {/* Sowing Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sowing Date *
              </label>
              <input
                type="date"
                {...register("sowingDate")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              {errors.sowingDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.sowingDate.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <select
                {...register("greenhouse")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="GREENHOUSE">Greenhouse</option>
                <option value="FIELD">Field</option>
              </select>
              {errors.greenhouse && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.greenhouse.message}
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
                {...register("lotNumber")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="e.g. L-2024-001"
              />
              {errors.lotNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.lotNumber.message}
                </p>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Type *
              </label>
              <select
                {...register("productType")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="SEEDS">Seeds</option>
                <option value="PEAT">Peat</option>
              </select>
              {errors.productType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.productType.message}
                </p>
              )}
            </div>

            {/* Stock Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Type *
              </label>
              <select
                {...register("stockType")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="BIO">BIO</option>
                <option value="CVT">CVT</option>
              </select>
              {errors.stockType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.stockType.message}
                </p>
              )}
            </div>

            {/* Conditional fields: Greenhouse vs Field */}
            {greenhouse === "GREENHOUSE" ? (
              <>
                {/* Number of Trays */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Trays *
                  </label>
                  <input
                    type="number"
                    {...register("numberOfTrays")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="e.g. 50"
                    min={1}
                  />
                  {errors.numberOfTrays && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.numberOfTrays.message}
                    </p>
                  )}
                </div>

                {/* Seeds per Tray */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seeds per Tray
                  </label>
                  <input
                    type="number"
                    {...register("seedsPerTray")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder={`${DEFAULT_SEEDS_PER_TRAY}`}
                    min={1}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Default: {DEFAULT_SEEDS_PER_TRAY} seeds/tray
                  </p>
                  {errors.seedsPerTray && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.seedsPerTray.message}
                    </p>
                  )}
                </div>

                {/* Calculated Total */}
                {calculatedTotal && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-3">
                      <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Seeds to deduct from stock:{" "}
                          <span className="font-bold">
                            {calculatedTotal.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {numberOfTrays} trays × {seedsPerTray} seeds/tray
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Quantity Used (Field) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity of Seeds *
                  </label>
                  <input
                    type="number"
                    {...register("quantityUsed")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="e.g. 500"
                    min={1}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Direct sowing in soil
                  </p>
                  {errors.quantityUsed && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.quantityUsed.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Remarks */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks
                <span className="text-gray-400 font-normal"> (optional)</span>
              </label>
              <textarea
                {...register("remarks")}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                placeholder="Any additional notes..."
              />
              {errors.remarks && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.remarks.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
