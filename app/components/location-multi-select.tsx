"use client";

import { Check, MapPin } from "lucide-react";
import { useTunnels, useSectors } from "@/app/lib/hooks/use-sowing";
import type { LocationTarget } from "@/app/lib/types/crop-care";

type Props = {
  value: LocationTarget[];
  onChange: (value: LocationTarget[]) => void;
  label?: string;
};

/**
 * Multi-select grid of tunnels + sectors (by name).
 * Used when logging operations or creating/executing care plans —
 * an operation may target one or more locations.
 */
export function LocationMultiSelect({
  value,
  onChange,
  label = "Locations",
}: Props) {
  const { data: tunnels = [], isLoading: loadingTunnels } = useTunnels();
  const { data: sectors = [], isLoading: loadingSectors } = useSectors();

  const loading = loadingTunnels || loadingSectors;

  const isTunnelSelected = (id: string) =>
    value.some((l) => l.targetType === "TUNNEL" && l.tunnelId === id);

  const isSectorSelected = (id: string) =>
    value.some((l) => l.targetType === "SECTOR" && l.sectorId === id);

  const toggleTunnel = (id: string) => {
    if (isTunnelSelected(id)) {
      onChange(
        value.filter((l) => !(l.targetType === "TUNNEL" && l.tunnelId === id)),
      );
    } else {
      onChange([...value, { targetType: "TUNNEL", tunnelId: id }]);
    }
  };

  const toggleSector = (id: string) => {
    if (isSectorSelected(id)) {
      onChange(
        value.filter((l) => !(l.targetType === "SECTOR" && l.sectorId === id)),
      );
    } else {
      onChange([...value, { targetType: "SECTOR", sectorId: id }]);
    }
  };

  const renderChip = (
    key: string,
    name: string,
    selected: boolean,
    onToggle: () => void,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        selected
          ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : "border-gray-200 bg-white text-gray-700 hover:border-green-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {selected ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <MapPin className="h-4 w-4 text-gray-400" />
      )}
      {name}
    </button>
  );

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading locations…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {value.length} selected
        </span>
      </div>

      {tunnels.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Tunnels
          </p>
          <div className="flex flex-wrap gap-2">
            {tunnels.map((t) =>
              renderChip(
                `tunnel-${t.id}`,
                t.number,
                isTunnelSelected(t.id),
                () => toggleTunnel(t.id),
              ),
            )}
          </div>
        </div>
      )}

      {sectors.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Sectors
          </p>
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) =>
              renderChip(`sector-${s.id}`, s.name, isSectorSelected(s.id), () =>
                toggleSector(s.id),
              ),
            )}
          </div>
        </div>
      )}

      {tunnels.length === 0 && sectors.length === 0 && (
        <p className="text-sm text-gray-400">
          No tunnels or sectors available.
        </p>
      )}
    </div>
  );
}
