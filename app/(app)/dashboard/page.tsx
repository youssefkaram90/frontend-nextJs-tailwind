"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Droplets,
  ShieldAlert,
  Sprout,
  Truck,
  Warehouse,
} from "lucide-react";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import { useStockSummary } from "@/app/lib/hooks/use-stock";
import { formatQuantity } from "@/app/lib/format-quantity";
import { useRecentDeliveries } from "@/app/lib/hooks/use-deliveries";
import { useSowingSSMs, useSowingLPMs } from "@/app/lib/hooks/use-sowing";
import type { SowingSSM, SowingLPM } from "@/app/lib/types/sowing";

/**
 * The landing page — and the only page everybody may open (`permission: null` in
 * `permission-gate.tsx`).
 *
 * Everything on it is therefore gated HERE, and each tile and list **fetches only
 * when the viewer may read it**. Both halves matter:
 *
 * - a request the user cannot answer used to come back 403, and the page showed
 *   the failure as a real `0` — a delivery count of zero is not the same as "you
 *   may not see the deliveries" (D-2);
 * - a user with no permissions at all saw a spinner that never stopped, because
 *   the old loading test was `!summary` and `summary` never arrived (D-1).
 *
 * The data hooks are called **inside** the tiles rather than in the page, which
 * is what keeps the fetch from happening at all: an unmounted tile cannot ask.
 */

/** One tile shell, so every tile on the page looks like the same tile. */
const TILE = "rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl";
const TILE_LINK = `${TILE} block transition-shadow hover:shadow-2xl`;

/** How many rows a "recent" list shows. */
const RECENT = 5;

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

/** A pulsing line, for a number that has not arrived yet. */
function LoadingLine() {
  return (
    <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
  );
}

/** The tile row while the viewer's own permissions are still loading. */
function TilesSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={TILE}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Three pulsing rows, while a list loads. */
function ListSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
      ))}
    </div>
  );
}

/** Something a permitted source could not be read. Never a silent zero. */
function SourceError({ what }: { what: string }) {
  return (
    <p className="text-sm text-gray-400 dark:text-gray-500">
      Could not load {what}.
    </p>
  );
}

/** What the season is holding — from the summary aggregate, so the numbers are
 * totals rather than a page of rows. */
function StockTile() {
  const { data: summary, isPending, isError } = useStockSummary();
  const seeds = summary?.SEEDS;
  const peat = summary?.PEAT;

  return (
    <Link href="/stock" className={TILE_LINK}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
          <Warehouse className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total stock
          </p>
          {isPending ? (
            <LoadingLine />
          ) : isError ? (
            <SourceError what="the stock" />
          ) : seeds || peat ? (
            <>
              {seeds && (
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {seeds.totalQuantity.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs text-gray-400">
                    seeds ({seeds.lots} lot{seeds.lots !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
              {peat && (
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatQuantity(peat.totalQuantity, "PEAT")}
                  </span>
                  <span className="ml-1 text-xs text-gray-400">
                    peat ({peat.lots} lot{peat.lots !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Nothing in stock</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/** The newest deliveries, and when the last one arrived. */
function DeliveriesTile() {
  const { data, isPending, isError } = useRecentDeliveries(RECENT);
  const recent = data?.items ?? [];

  return (
    <Link href="/deliveries" className={TILE_LINK}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
          <Truck className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Deliveries</p>
          {isPending ? (
            <LoadingLine />
          ) : isError ? (
            <SourceError what="the deliveries" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {recent.length}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {recent.length > 0
              ? `latest ${formatDay(recent[0].createdAt)}`
              : "recent"}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** The newest sowings, tunnel and field together. */
function SowingsTile() {
  const ssm = useSowingSSMs();
  const lpm = useSowingLPMs();

  const recent = useMemo<(SowingSSM | SowingLPM)[]>(
    () =>
      [...(ssm.data ?? []), ...(lpm.data ?? [])]
        .sort(
          (a, b) =>
            new Date(b.sowingDate).getTime() - new Date(a.sowingDate).getTime(),
        )
        .slice(0, RECENT),
    [ssm.data, lpm.data],
  );

  const isPending = ssm.isPending || lpm.isPending;
  const isError = ssm.isError || lpm.isError;

  return (
    <Link href="/sowing" className={TILE_LINK}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
          <Sprout className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Sowings</p>
          {isPending ? (
            <LoadingLine />
          ) : isError ? (
            <SourceError what="the sowings" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {recent.length}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {recent.length > 0
              ? `latest ${formatDay(recent[0].sowingDate)}`
              : "recent"}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** A door into crop care — no number to show, so it says what lives there. */
function CropCareTile() {
  return (
    <Link href="/crop-care" className={TILE_LINK}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
          <Droplets className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crop care</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Irrigation & treatment
          </p>
          <p className="text-xs text-gray-400">Plans & operations</p>
        </div>
      </div>
    </Link>
  );
}

/** The newest deliveries, one row per delivery. */
function RecentDeliveries() {
  const { data, isPending, isError } = useRecentDeliveries(RECENT);
  const recent = data?.items ?? [];

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent deliveries
        </h2>
        <Link
          href="/deliveries"
          className="flex items-center gap-1 text-sm text-green-600 transition hover:text-green-700"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <div className="p-6 text-center">
          <SourceError what="the deliveries" />
        </div>
      ) : recent.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No deliveries recorded yet this season.
        </p>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recent.map((delivery) => {
            const seedsTotal = delivery.lots
              .filter((l) => l.productType === "SEEDS")
              .reduce((sum, lot) => sum + lot.quantity, 0);
            const peatTotal = delivery.lots
              .filter((l) => l.productType === "PEAT")
              .reduce((sum, lot) => sum + lot.quantity, 0);

            return (
              <Link
                key={delivery.id}
                href={`/deliveries/${delivery.id}`}
                className="flex items-center justify-between px-6 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {delivery.deliveryCode}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {delivery.lots.length} lot
                    {delivery.lots.length !== 1 ? "s" : ""}
                  </span>
                  {seedsTotal > 0 && (
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      S: {seedsTotal.toLocaleString()}
                    </span>
                  )}
                  {peatTotal > 0 && (
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      P: {formatQuantity(peatTotal, "PEAT")}
                    </span>
                  )}
                  <span className="ml-2">{formatDay(delivery.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** The newest sowings, tunnel (SSM) and field (LPM) together. */
function RecentSowings() {
  const ssm = useSowingSSMs();
  const lpm = useSowingLPMs();

  const recent = useMemo<(SowingSSM | SowingLPM)[]>(
    () =>
      [...(ssm.data ?? []), ...(lpm.data ?? [])]
        .sort(
          (a, b) =>
            new Date(b.sowingDate).getTime() - new Date(a.sowingDate).getTime(),
        )
        .slice(0, RECENT),
    [ssm.data, lpm.data],
  );

  const isPending = ssm.isPending || lpm.isPending;
  const isError = ssm.isError || lpm.isError;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent sowings
        </h2>
        <Link
          href="/sowing"
          className="flex items-center gap-1 text-sm text-green-600 transition hover:text-green-700"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <div className="p-6 text-center">
          <SourceError what="the sowings" />
        </div>
      ) : recent.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No sowings recorded yet this season.
        </p>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recent.map((sowing) => {
            const typeTag = "tunnelId" in sowing ? "SSM" : "LPM";

            return (
              <Link
                key={sowing.id}
                href={`/sowing/${sowing.id}?type=${typeTag}`}
                className="flex items-center justify-between px-6 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div className="flex items-center gap-3">
                  <Sprout className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {sowing.variety}
                  </span>
                  <span className="rounded-lg bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    {typeTag}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sowing.quantityUsed}
                  </span>
                  <span className="ml-2">{formatDay(sowing.sowingDate)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Shown when nothing on this page can be filled in for this account. Two
 * different situations, and they need different sentences: an account with no
 * permissions at all, and an account that can use the app but none of the
 * modules this page summarises.
 */
function NothingToShow({ noAccessAtAll }: { noAccessAtAll: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-10 text-center shadow-xl dark:bg-gray-800">
      <ShieldAlert className="h-10 w-10 text-gray-300 dark:text-gray-600" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Nothing to show yet
      </h2>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
        {noAccessAtAll
          ? "Your account does not have access to any module yet. Ask an administrator to give you access."
          : "Your account can use other parts of the app, but nothing that appears on this dashboard. Use the menu to open a module."}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const {
    can,
    isAdmin,
    permissions,
    isLoading: permissionsLoading,
  } = usePermissions();

  // Each tile appears only if the viewer may read what it shows — and, because
  // the tile itself asks for the data, a hidden tile asks for nothing.
  const canStock = can("stock.view");
  const canDeliveries = can("deliveries.view");
  const canSowings = can("sowing.view");
  const canCropCare = can("crop-care.view");

  const tiles = [canStock, canDeliveries, canSowings, canCropCare].filter(
    Boolean,
  ).length;

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Overview of your farm operations
      </p>
    </div>
  );

  // The permissions are what decide the page's shape, so the page waits for them
  // rather than guessing — and never for a request it cannot make.
  if (permissionsLoading) {
    return (
      <div className="space-y-6 p-4">
        {header}
        <TilesSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {header}

      {tiles === 0 ? (
        <NothingToShow noAccessAtAll={!isAdmin && permissions.size === 0} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {canStock && <StockTile />}
            {canDeliveries && <DeliveriesTile />}
            {canSowings && <SowingsTile />}
            {canCropCare && <CropCareTile />}
          </div>

          {canDeliveries && <RecentDeliveries />}
          {canSowings && <RecentSowings />}
        </>
      )}
    </div>
  );
}
