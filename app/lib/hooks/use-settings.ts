import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSettings,
  updateSetting,
} from "@/app/lib/services/settings";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
}

/**
 * The figure in force for one setting, with the compiled constant as a fallback.
 *
 * The fallback is not decoration: it covers the moment before the fetch lands, and
 * a client that cannot reach the server. The setting remains the authority — this is
 * what a screen shows while it is being asked (SOW-11, phase 3).
 *
 * Readable by anyone signed in (the server allows reads deliberately), so this
 * works on a form a non-admin uses too.
 */
export function useSettingValue(key: string, fallback: number): number {
  const { data } = useSettings();
  return data?.find((setting) => setting.key === key)?.value ?? fallback;
}

/**
 * Saving one setting refreshes the list, so every row shows the figure that is
 * actually in force — including after someone else changed a different one.
 */
export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      updateSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
