"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import {
  CalendarClock,
  Plus,
  Trash2,
  Droplets,
  FlaskConical,
  Beaker,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { LocationMultiSelect } from "@/app/components/location-multi-select";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { useCreatePlan } from "@/app/lib/hooks/use-crop-care";
import { useSeasonProducts } from "@/app/lib/hooks/use-agri-inputs";
import type { LocationTarget } from "@/app/lib/types/crop-care";

type Entry = {
  plannedDate: string;
  productId: string;
  quantity: string;
  notes: string;
};

type FormData = {
  planType: "IRRIGATION" | "TREATMENT" | "FERTILISATION";
  name: string;
  entries: Entry[];
};

export default function CreatePlanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const caps = useCaps("crop-care");
  // Only what this season is allowed to use.
  const { data: products = [] } = useSeasonProducts();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      planType: "IRRIGATION",
      name: "",
      entries: [
        {
          plannedDate: new Date().toLocaleDateString("en-CA"),
          productId: "",
          quantity: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });
  const planType = watch("planType");
  const [locations, setLocations] = useState<LocationTarget[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const createPlan = useCreatePlan();

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  async function onSubmit(data: FormData) {
    if (locations.length === 0) {
      showToast("Select at least one tunnel or sector", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createPlan.mutateAsync({
        planType: data.planType,
        name: data.name.trim(),
        locations,
        entries: data.entries.map((e) => ({
          plannedDate: e.plannedDate,
          // Irrigation schedules water, not a product — the other two name one.
          productId:
            data.planType === "IRRIGATION"
              ? undefined
              : e.productId || undefined,
          quantity: e.quantity ? Number(e.quantity) : undefined,
          notes: e.notes.trim() || undefined,
        })),
      });
      showToast("Plan created");
      router.push("/crop-care/plans");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create plan",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="New Crop Care Plan"
        description="Schedule irrigation, treatment or fertilisation for tunnels/sectors"
        backTo="/crop-care/plans"
        backLabel="Back to Plans"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-5"
      >
        {/* Type */}
        <div className="grid grid-cols-3 gap-2 max-w-xl">
          <button
            type="button"
            onClick={() => setValue("planType", "IRRIGATION")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              planType === "IRRIGATION"
                ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            <Droplets className="h-4 w-4" /> Irrigation
          </button>
          <button
            type="button"
            onClick={() => setValue("planType", "TREATMENT")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              planType === "TREATMENT"
                ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            <FlaskConical className="h-4 w-4" /> Treatment
          </button>
          <button
            type="button"
            onClick={() => setValue("planType", "FERTILISATION")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              planType === "FERTILISATION"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            <Beaker className="h-4 w-4" /> Fertilisation
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Plan name *
          </label>
          <input
            className={inputClass}
            placeholder="e.g. Weekly fungicide T1-T3"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Locations (default scope) */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <LocationMultiSelect
            value={locations}
            onChange={setLocations}
            label="Default locations"
          />
        </div>

        {/* Entries */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Scheduled entries
            </label>
            <button
              type="button"
              onClick={() =>
                append({
                  plannedDate: new Date().toLocaleDateString("en-CA"),
                  productId: "",
                  quantity: "",
                  notes: "",
                })
              }
              className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400"
            >
              <Plus className="h-4 w-4" /> Add entry
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Date *
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      {...register(`entries.${index}.plannedDate`, {
                        required: true,
                      })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Product{planType === "IRRIGATION" ? "" : " *"}
                    </label>
                    <select
                      className={inputClass}
                      {...register(`entries.${index}.productId`)}
                    >
                      <option value="">—</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      className={inputClass}
                      placeholder={
                        planType === "IRRIGATION" ? "liters" : "dose"
                      }
                      {...register(`entries.${index}.quantity`)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <input
                      className={inputClass}
                      placeholder="Notes"
                      {...register(`entries.${index}.notes`)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 disabled:opacity-40 dark:bg-red-900/30 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !caps.create}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarClock className="h-4 w-4" />
          {submitting ? "Creating…" : "Create plan"}
        </button>
      </form>
    </div>
  );
}
