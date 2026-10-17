import { api } from "../api";
import type {
  ActiveSeason,
  ClosePreview,
  CloseResult,
  Season,
  SeasonAlignment,
  SeasonToOpen,
} from "../types/season";

/** The one open season. Open to any signed-in user — every screen shows it. */
export async function getActiveSeason(): Promise<ActiveSeason | null> {
  return api<ActiveSeason | null>("/api/seasons/active");
}

/** Every season, newest first. ADMIN only — closed seasons are restricted. */
export async function getSeasons(): Promise<Season[]> {
  return api<Season[]>("/api/seasons");
}

/**
 * Does the open season still match today's date?
 *
 * One sentence, worded for the caller by the backend (an administrator gets the
 * actionable version). It never blocks anything — it is a banner.
 */
export async function getSeasonAlignment(): Promise<SeasonAlignment> {
  return api<SeasonAlignment>("/api/seasons/alignment");
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

/**
 * Closes the season, then opens `open` — the next season, a chosen season id,
 * or none. The server creates the next season if it does not exist yet.
 */
export async function closeSeason(
  id: string,
  open: SeasonToOpen,
): Promise<CloseResult> {
  return api<CloseResult>(`/api/seasons/${id}/close`, {
    method: "POST",
    body: JSON.stringify({ open }),
  });
}
