import { api } from "../api";
import type {
  AddAgriInputInput,
  AdjustAgriInputInput,
  AgriInputMovement,
  AgriInputSeasonRow,
} from "../types/agri-input";

/**
 * This season's agri-inputs — the products it is allowed to use, with their
 * stock. The season is decided server-side (the open one), so nothing here has
 * to know which season that is.
 */
export async function getAgriInputs(q?: string): Promise<AgriInputSeasonRow[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<AgriInputSeasonRow[]>(`/api/agri-inputs${params}`);
}

/** Everything that moved this product's stock, newest first. */
export async function getAgriInputMovements(
  id: string,
): Promise<AgriInputMovement[]> {
  return api<AgriInputMovement[]>(`/api/agri-inputs/${id}/movements`);
}

/** Put a catalogue product on this season's list (ADMIN-only). */
export async function addAgriInput(
  dto: AddAgriInputInput,
): Promise<AgriInputSeasonRow> {
  return api<AgriInputSeasonRow>("/api/agri-inputs", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/** A signed stock movement — stock in, a return, a write-off or a correction. */
export async function adjustAgriInput(
  id: string,
  dto: AdjustAgriInputInput,
): Promise<AgriInputSeasonRow> {
  return api<AgriInputSeasonRow>(`/api/agri-inputs/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/** Take a product off this season's list (ADMIN-only). */
export async function removeAgriInput(id: string): Promise<unknown> {
  return api(`/api/agri-inputs/${id}`, { method: "DELETE" });
}
