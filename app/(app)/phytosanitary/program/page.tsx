"use client";

import { useState } from "react";
import { ListChecks, Check } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { useToast } from "@/app/lib/toast-context";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import {
  useProgram,
  useCreateProgram,
  useUpdateProgram,
} from "@/app/lib/hooks/use-crop-care";
import { useSeasonProducts } from "@/app/lib/hooks/use-agri-inputs";

export default function ProgramPage() {
  const { showToast } = useToast();
  const caps = useCaps("phytosanitary");
  const { data: program, isLoading: loadingProgram } = useProgram();
  // The program's products are stored against this season's rows, so the picker
  // may only offer what the season allows — the server resolves every
  // productId against the program's own season.
  const { data: products = [], isLoading: loadingProducts } =
    useSeasonProducts();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Sync local selection when the program loads
  if (!initialized && program && !loadingProgram) {
    setSelected(new Set(program.entries.map((e) => e.product.id)));
    setName(program.name);
    setInitialized(true);
  }

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const productIds = [...selected];
      if (program) {
        await updateProgram.mutateAsync({
          id: program.id,
          dto: { name: name.trim() || program.name, productIds },
        });
        showToast("Program updated");
      } else {
        const created = await createProgram.mutateAsync({
          name: name.trim() || "Growing period program",
        });
        await updateProgram.mutateAsync({
          id: created.id,
          dto: { productIds },
        });
        showToast("Program created");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save program",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  if (loadingProgram || loadingProducts) {
    return (
      <div className="p-4">
        <PageHeader
          title="Phytosanitary Program"
          description="Products that must be applied before harvest"
          backTo="/crop-care"
          backLabel="Back to Crop Care"
        />
        <div className="mt-6 text-gray-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Phytosanitary Program"
        description="The products that must be applied during the growing period before harvest"
        backTo="/crop-care"
        backLabel="Back to Crop Care"
      />

      <form
        onSubmit={save}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {program ? `Program: ${program.name}` : "No program yet"}
          </h2>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Program name
          </label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Growing period 2026"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select the products required before harvest
          </label>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400">
              No products yet — add some in the{" "}
              <a
                href="/phytosanitary/products"
                className="text-green-600 underline"
              >
                product catalog
              </a>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {products.map((p) => {
                const on = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    disabled={!caps.edit}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      on
                        ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "border-gray-200 bg-white text-gray-700 hover:border-green-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {on ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <span className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600" />
                    )}
                    <span className="flex-1 text-left">{p.name}</span>
                    {p.category && (
                      <span className="text-[10px] uppercase text-gray-400">
                        {p.category}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !(program ? caps.edit : caps.create)}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : program ? "Save program" : "Create program"}
        </button>
      </form>
    </div>
  );
}
