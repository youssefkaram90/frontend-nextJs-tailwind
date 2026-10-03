import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateSeason,
  closeSeason,
  createSeason,
  getActiveSeason,
  getClosePreview,
  getSeasons,
} from "../services/seasons";

/**
 * The open season. `staleTime` is long because it changes about once a year —
 * the mutations below invalidate it explicitly, so it never goes stale after a
 * create or an activate.
 */
export function useActiveSeason() {
  return useQuery({
    queryKey: ["seasons", "active"],
    queryFn: getActiveSeason,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Every season, newest first. `enabled` is REQUIRED on purpose: this endpoint is
 * ADMIN-only, and a 403 fires the permissions-stale refresh, so a non-admin must
 * never trigger it by accident. Pass `isAdmin`.
 */
export function useSeasons(enabled: boolean) {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: getSeasons,
    enabled,
  });
}

function useRefreshSeasons() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["seasons"] });
  };
}

export function useCreateSeason() {
  const refresh = useRefreshSeasons();
  return useMutation({
    mutationFn: (code: string) => createSeason(code),
    onSuccess: refresh,
  });
}

export function useActivateSeason() {
  const refresh = useRefreshSeasons();
  return useMutation({
    mutationFn: (id: string) => activateSeason(id),
    onSuccess: refresh,
  });
}

/**
 * The close report for one season. Disabled until `id` is set, because the
 * report is a real check — it runs when the wizard opens, not on page view.
 */
export function useClosePreview(id: string | null) {
  return useQuery({
    queryKey: ["seasons", "close-preview", id],
    queryFn: () => getClosePreview(id as string),
    enabled: !!id,
  });
}

/**
 * Close a season and open the next one.
 *
 * Everything in this app belongs to a season, so a close invalidates every
 * cached list at once — otherwise the screens would keep showing the season
 * that was just closed until a manual reload.
 */
export function useCloseSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeSeason(id),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
