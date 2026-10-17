import { api } from "@/app/lib/api";

/**
 * One setting, as the server reports it.
 *
 * `label`, `help`, `min` and `max` come from the server's registry rather than
 * being repeated here: the wording that explains a figure belongs next to the code
 * that uses it, and a copy on this side would drift from it (SOW-11).
 */
export interface SettingView {
  key: string;
  /** The figure in force: the stored row, or the built-in default. */
  value: number;
  /** `null` when no row exists — the app is running on its built-in figure. */
  storedValue: string | null;
  label: string;
  help: string;
  min: number;
  max: number;
  default: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export async function getSettings(): Promise<SettingView[]> {
  return api<SettingView[]>("/api/settings");
}

export async function updateSetting(
  key: string,
  value: number,
): Promise<SettingView> {
  return api<SettingView>(`/api/settings/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}
