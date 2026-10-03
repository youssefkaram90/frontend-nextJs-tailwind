import { api } from "../api";
import type { ActiveSeason, ClosePreview, Season } from "../types/season";

/** The one open season. Open to any signed-in user — every screen shows it. */
export async function getActiveSeason(): Promise<ActiveSeason | null> {
  return api<ActiveSeason | null>("/api/seasons/active");
}

/** Every season, newest first. ADMIN only — closed seasons are restricted. */
export async function getSeasons(): Promise<Season[]> {
  return api<Season[]>("/api/seasons");
}

/** Creates the season CLOSED; open it with activateSeason. */
export async function createSeason(code: string): Promise<Season> {
  return api<Season>("/api/seasons", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function activateSeason(id: string): Promise<Season> {
  return api<Season>(`/api/seasons/${id}/activate`, { method: "PATCH" });
}

/**
 * What closing this season would do. The server runs the same checks again
 * inside the close, so what the admin is shown is what actually gates it.
 */
export async function getClosePreview(id: string): Promise<ClosePreview> {
  return api<ClosePreview>(`/api/seasons/${id}/close-preview`);
}

/** Closes the season and answers with the NEW season the server opened. */
export async function closeSeason(id: string): Promise<Season> {
  return api<Season>(`/api/seasons/${id}/close`, { method: "POST" });
}
