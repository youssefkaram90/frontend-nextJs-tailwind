"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Beaker,
  History,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  useAddAgriInput,
  useAdjustAgriInput,
  useAgriInputMovements,
  useAgriInputs,
  useRemoveAgriInput,
} from "@/app/lib/hooks/use-agri-inputs";
import { useProducts } from "@/app/lib/hooks/use-crop-care";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import { useSearch } from "@/app/lib/use-search";
import { useToast } from "@/app/lib/toast-context";
import { SeasonEmptyState } from "@/app/components/ui/season-empty-state";
import {
  categoryBadgeClass,
  type AgriInputSeasonRow,
} from "@/app/lib/types/agri-input";
import {
  AGRI_INPUT_REASONS,
  movementReasonLabel,
  type MovementReason,
} from "@/app/lib/types/stock";

type Direction = "add" | "remove";

const fieldClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

const buttonClass =
  "inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

const quietButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700";

const cardClass =
  "rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-xl border border-gray-100 dark:border-gray-700";

/** "4.5 L", or just "4.5" when the product has no unit. */
function withUnit(quantity: number, unit: string | null | undefined) {
  return unit ? `${quantity} ${unit}` : `${quantity}`;
}

export default function AgriInputsPage() {
  const { can, isAdmin } = usePermissions();
  const { showToast } = useToast();
  const { query, setQuery, debouncedQuery } = useSearch();

  const {
    data: rows = [],
    isPending,
    error,
  } = useAgriInputs(debouncedQuery || undefined);
  const { data: catalogue = [] } = useProducts();

  const addInput = useAddAgriInput();
  const adjustInput = useAdjustAgriInput();
  const removeInput = useRemoveAgriInput();

  const [productId, setProductId] = useState("");
  const [opening, setOpening] = useState("");
  const [adding, setAdding] = useState(false);

  const [adjusting, setAdjusting] = useState<AgriInputSeasonRow | null>(null);
  const [direction, setDirection] = useState<Direction>("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<MovementReason>("received");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [historyFor, setHistoryFor] = useState<string | null>(null);

  // Only what is genuinely free: a product already allowed this season has a
  // row, and adding it twice is refused by the server anyway.
  const taken = new Set(rows.map((row) => row.productId));
  const selectable = catalogue.filter((product) => !taken.has(product.id));

  // "correction" works both ways, so it is always offered.
  const availableReasons = AGRI_INPUT_REASONS.filter(
    (r) => r.direction === direction || r.direction === "both",
  );

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();

    if (!productId) {
      showToast("Choose a product to add", "error");
      return;
    }

    setAdding(true);
    try {
      await addInput.mutateAsync({
        productId,
        openingQuantity: opening.trim() ? Number(opening) : undefined,
      });
      showToast("Added to this season");
      setProductId("");
      setOpening("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setAdding(false);
    }
  }

  async function onAdjust(e: React.FormEvent) {
    e.preventDefault();

    const amount = Number(quantity);
    if (!amount || amount <= 0) {
      showToast("Enter a quantity greater than zero", "error");
      return;
    }

    setSubmitting(true);
    try {
      await adjustInput.mutateAsync({
        id: adjusting!.id,
        dto: {
          quantity: direction === "add" ? amount : -amount,
          reason,
          note: note.trim() || undefined,
        },
      });
      showToast("Stock updated");
      setAdjusting(null);
      setQuantity("");
      setNote("");
    } catch (err) {
      // The server refuses an over-use with a readable sentence — show it as-is.
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onRemove(row: AgriInputSeasonRow) {
    try {
      await removeInput.mutateAsync(row.id);
      showToast(`${row.product.name} removed from this season`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    }
  }

  if (!can("phytosanitary.view")) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You do not have access to this screen. Ask an administrator.
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/*
        This screen is reached from Crop Care, not from the sidebar (user,
        2026-10-11) — so it says where "back" goes, like every other screen.
      */}
      <Link
        href="/crop-care"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Crop Care
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Agri-inputs
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The products this season is allowed to use, and what is left of each.
          Stock is per season — nothing is carried over.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a product…"
          className={`${fieldClass} pl-9`}
        />
      </div>

      {/* Add a product to this season — ADMIN only */}
      {isAdmin && (
        <form onSubmit={onAdd} className={`${cardClass} space-y-4`}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Add a product to this season
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A product only becomes usable once it is on this list. Leave the
            opening balance empty if you are only allowing it for now.
          </p>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Choose from the catalogue…</option>
              {selectable.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.category ? ` · ${product.category}` : ""}
                </option>
              ))}
            </select>
            <input
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              inputMode="decimal"
              placeholder="Opening balance"
              className={fieldClass}
            />
            <button type="submit" disabled={adding} className={buttonClass}>
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {selectable.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Every product in the catalogue is already on this season&apos;s list.
            </p>
          )}
        </form>
      )}

      {/* This season's list */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          This season&apos;s products
        </h2>

        {rows.length === 0 ? (
          <SeasonEmptyState
            what="products"
            action="Add the ones you will use this season."
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row) => (
              <li key={row.id} className="py-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Beaker className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {row.product.name}
                  </span>
                  {row.product.category && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadgeClass(
                        row.product.category,
                      )}`}
                    >
                      {row.product.category}
                    </span>
                  )}
                  {row.product.activeIngredient && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {row.product.activeIngredient}
                    </span>
                  )}

                  <span className="ml-auto text-lg font-semibold text-gray-900 dark:text-white">
                    {withUnit(row.currentQuantity, row.product.unit)}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjusting(row);
                          setDirection("add");
                          setReason("received");
                          setQuantity("");
                          setNote("");
                        }}
                        className={quietButtonClass}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Adjust
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHistoryFor(historyFor === row.id ? null : row.id)
                        }
                        className={quietButtonClass}
                      >
                        <History className="h-3.5 w-3.5" />
                        History
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(row)}
                        className={quietButtonClass}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {row.product.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {row.product.notes}
                  </p>
                )}

                {/* The adjust form, opened on the row it belongs to */}
                {isAdmin && adjusting?.id === row.id && (
                  <form
                    onSubmit={onAdjust}
                    className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3"
                  >
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDirection("add");
                          setReason("received");
                        }}
                        className={
                          direction === "add"
                            ? "rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                            : "rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200"
                        }
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDirection("remove");
                          setReason("waste");
                        }}
                        className={
                          direction === "remove"
                            ? "rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                            : "rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200"
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        inputMode="decimal"
                        placeholder={`Quantity${
                          row.product.unit ? ` (${row.product.unit})` : ""
                        }`}
                        className={fieldClass}
                      />
                      <select
                        value={reason}
                        onChange={(e) =>
                          setReason(e.target.value as MovementReason)
                        }
                        className={fieldClass}
                      >
                        {availableReasons.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Note (optional)"
                      className={fieldClass}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={buttonClass}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjusting(null)}
                        className={quietButtonClass}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Usage history — the ledger, with who did it */}
                {historyFor === row.id && (
                  <MovementHistory id={row.id} unit={row.product.unit} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Everything that moved one product's stock, newest first. */
function MovementHistory({ id, unit }: { id: string; unit: string | null }) {
  const { data: movements = [], isPending, error } = useAgriInputMovements(id);

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4">
      {isPending && (
        <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
      )}

      {error && <p className="text-xs text-red-500">{error.message}</p>}

      {!isPending && !error && movements.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Nothing has moved this product yet.
        </p>
      )}

      {movements.length > 0 && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Reason</th>
              <th className="pb-2 font-medium text-right">Amount</th>
              <th className="pb-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td className="py-2 text-gray-600 dark:text-gray-300">
                  {new Date(movement.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="py-2 text-gray-900 dark:text-white">
                  {movementReasonLabel(movement.reason)}
                  {movement.note && (
                    <span className="block text-gray-500 dark:text-gray-400">
                      {movement.note}
                    </span>
                  )}
                </td>
                <td
                  className={`py-2 text-right font-medium ${
                    movement.quantity < 0
                      ? "text-red-500"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {movement.quantity > 0 ? "+" : ""}
                  {withUnit(movement.quantity, unit)}
                </td>
                <td className="py-2 text-gray-600 dark:text-gray-300">
                  {movement.createdByName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
