import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAgriInput,
  adjustAgriInput,
  getAgriInputMovements,
  getAgriInputs,
  removeAgriInput,
} from "@/app/lib/services/agri-inputs";
import type {
  AddAgriInputInput,
  AdjustAgriInputInput,
} from "../types/agri-input";
import type { PhytosanitaryProduct } from "../types/crop-care";

export function useAgriInputs(q?: string) {
  return useQuery({
    queryKey: ["agri-inputs", "list", q ?? ""],
    queryFn: () => getAgriInputs(q || undefined),
  });
}

/**
 * The products this season may use, shaped like the catalogue product the
 * crop-care pickers already render.
 *
 * Those pickers used to list the **global** catalogue, so they could offer a
 * product the server would then refuse — a product with no row for this season
 * is not allowed this season, not merely hidden.
 *
 * `id` is the CATALOGUE product id on purpose: that is what a treatment or a
 * plan entry sends, and the season row's own id never leaves the backend
 * (P6-03). `currentQuantity` is **this season's** stock rather than the
 * superseded column on the catalogue, so a screen showing a remaining quantity
 * becomes right as a side effect.
 */
export function useSeasonProducts(q?: string) {
  return useQuery({
    // The same key as `useAgriInputs`, so the two share one cache entry.
    queryKey: ["agri-inputs", "list", q ?? ""],
    queryFn: () => getAgriInputs(q || undefined),
    select: (rows): PhytosanitaryProduct[] =>
      rows.map((row) => ({
        ...row.product,
        currentQuantity: row.currentQuantity,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
  });
}

export function useAgriInputMovements(id: string) {
  return useQuery({
    queryKey: ["agri-inputs", "movements", id],
    queryFn: () => getAgriInputMovements(id),
    enabled: !!id,
  });
}

/** Any write changes both the stock and the ledger, so both keys go stale. */
function useAgriInputWrite<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agri-inputs"] });
    },
  });
}

export function useAddAgriInput() {
  return useAgriInputWrite((dto: AddAgriInputInput) => addAgriInput(dto));
}

export function useAdjustAgriInput() {
  return useAgriInputWrite(
    ({ id, dto }: { id: string; dto: AdjustAgriInputInput }) =>
      adjustAgriInput(id, dto),
  );
}

export function useRemoveAgriInput() {
  return useAgriInputWrite((id: string) => removeAgriInput(id));
}
