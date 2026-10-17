"use client";

import { useState } from "react";
import {
  FlaskConical,
  Pencil,
  Trash2,
  Search,
  X,
  PackageSearch,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { useCaps } from "@/app/lib/hooks/use-permissions";
import { useToast } from "@/app/lib/toast-context";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/app/lib/hooks/use-crop-care";
import type { PhytosanitaryProduct } from "@/app/lib/types/crop-care";

const CATEGORIES = [
  "FUNGICIDE",
  "INSECTICIDE",
  "HERBICIDE",
  "ACARICIDE",
  "BACTERICIDE",
  "OTHER",
];

const emptyForm = {
  name: "",
  activeIngredient: "",
  category: "",
  unit: "",
  notes: "",
};

export default function ProductsPage() {
  const { showToast } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PhytosanitaryProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: products = [], isLoading } = useProducts(
    debounced || undefined,
  );
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const caps = useCaps("phytosanitary");
  const deleteProduct = useDeleteProduct();

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        activeIngredient: form.activeIngredient.trim() || undefined,
        category: form.category || undefined,
        unit: form.unit.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, dto: payload });
        showToast("Product updated");
      } else {
        await createProduct.mutateAsync(payload);
        showToast("Product created");
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(p: PhytosanitaryProduct) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      activeIngredient: p.activeIngredient ?? "",
      category: p.category ?? "",
      unit: p.unit ?? "",
      notes: p.notes ?? "",
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteProduct.mutateAsync(deleting.id);
      showToast("Product deleted");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error",
      );
    } finally {
      setDeleting(null);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Phytosanitary Products"
        description="Catalog of crop protection products"
        backTo="/crop-care"
        backLabel="Back to Crop Care"
      />

      {/* Create / edit form */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? "Edit product" : "New product"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
            </label>
            <input
              className={inputClass}
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Fungicide X"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Active ingredient
            </label>
            <input
              className={inputClass}
              value={form.activeIngredient}
              onChange={set("activeIngredient")}
              placeholder="e.g. Chlorothalonil"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              className={inputClass}
              value={form.category}
              onChange={set("category")}
            >
              <option value="">— Select —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit
            </label>
            <input
              className={inputClass}
              value={form.unit}
              onChange={set("unit")}
              placeholder="e.g. L, kg, g"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={set("notes")}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting || !(editingId ? caps.edit : caps.create)}
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Add product"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
            Products ({products.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Search…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                const t = setTimeout(() => setDebounced(e.target.value), 300);
                return () => clearTimeout(t);
              }}
            />
            {q && (
              <button
                onClick={() => {
                  setQ("");
                  setDebounced("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <PackageSearch className="mx-auto h-10 w-10 mb-2" />
            No products found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">
                  Active ingredient
                </th>
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-left font-medium">Unit</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {p.activeIngredient ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    {p.category ? (
                      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {p.category}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {p.unit ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      {caps.edit && (
                        <button
                          onClick={() => startEdit(p)}
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      {caps.delete && (
                        <button
                          onClick={() => setDeleting(p)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={!!deleting}
        title="Delete product"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
