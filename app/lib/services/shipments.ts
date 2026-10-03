import { api } from "../api";
import type { Paginated } from "../types/harvest";
import type { CreateShipmentInput, Shipment } from "../types/shipment";

export async function getShipments(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Shipment>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return api<Paginated<Shipment>>(`/api/shipments?${search.toString()}`);
}

/**
 * Ship finished goods out. The server checks stock before writing and merges
 * duplicate products, so the plants figure sent here is never trusted blindly.
 */
export async function createShipment(
  dto: CreateShipmentInput,
): Promise<Shipment> {
  return api<Shipment>("/api/shipments", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function getShipment(id: string): Promise<Shipment> {
  return api<Shipment>(`/api/shipments/${id}`);
}

export async function deleteShipment(id: string) {
  return api<{ id: string }>(`/api/shipments/${id}`, { method: "DELETE" });
}

/**
 * Edit a shipment — header and lines. The server puts the old lines back into
 * stock BEFORE checking the new ones, so re-shipping the same amount succeeds,
 * and the whole edit rolls back if the new lines exceed stock.
 */
export async function updateShipment(
  id: string,
  dto: CreateShipmentInput,
): Promise<Shipment> {
  return api<Shipment>(`/api/shipments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}
