"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Info,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import {
  useActivateSeason,
  useActiveSeason,
  useClosePreview,
  useCloseSeason,
  useCreateSeason,
  useSeasons,
} from "@/app/lib/hooks/use-seasons";
import { useToast } from "@/app/lib/toast-context";
import type { CloseFinding, Season } from "@/app/lib/types/season";

/** Shape check only — the server owns the real rules. */
const CODE_PATTERN = /^\d{2}-\d{2}$/;

function formatRange(season: Season) {
  const start = new Date(season.startDate);
  const end = new Date(season.endDate);
  return `${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;
}

/**
 * One coloured block of the close report. Rendering nothing when it is empty is
 * deliberate: a green tick for a check that found nothing would be noise.
 */
function FindingList({
  title,
  findings,
  tone,
}: {
  title: string;
  findings: CloseFinding[];
  tone: "block" | "warn" | "info";
}) {
  if (findings.length === 0) return null;

  const styles = {
    block:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200",
    warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200",
    info: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-2">
        {findings.map((finding) => (
          <li key={finding.message} className="text-sm">
            <p>{finding.message}</p>
            {finding.details.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs opacity-90">
                {finding.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SeasonsPage() {
  const { isAdmin, isLoading: userLoading } = usePermissions();
  const { data: active } = useActiveSeason();
  const { data: seasons = [], isLoading } = useSeasons(isAdmin);
  const createSeason = useCreateSeason();
  const activateSeason = useActivateSeason();
  const { showToast } = useToast();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // The season the close wizard is open for — null means the wizard is shut.
  const [closing, setClosing] = useState<Season | null>(null);
  const router = useRouter();

  // The preview is a real check, so it runs when the wizard opens rather than
  // on every visit to the page.
  const preview = useClosePreview(closing?.id ?? null);
  const closeSeason = useCloseSeason();

  const inputClass =
    "w-full max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();

    if (!CODE_PATTERN.test(value)) {
      showToast('A season must look like "26-27"', "error");
      return;
    }

    setSubmitting(true);
    try {
      await createSeason.mutateAsync(value);
      showToast(`Season ${value} added — open it to start using it`);
      setCode("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onActivate(season: Season) {
    try {
      await activateSeason.mutateAsync(season.id);
      showToast(`Season ${season.code} is now open`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to open season",
        "error",
      );
    }
  }

  /**
   * Close the season, then show the new one.
   *
   * The server answers with the season it opened, so the message can name both
   * without guessing the next code — and the redirect is what "go to the new
   * season" means here, because every screen follows the open season anyway.
   */
  async function onClose() {
    if (!closing) return;
    try {
      const opened = await closeSeason.mutateAsync(closing.id);
      const closedCode = closing.code;
      setClosing(null);
      showToast(
        `Season ${closedCode} is closed — season ${opened.code} is now open`,
      );
      router.push("/seasons");
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to close the season",
        "error",
      );
    }
  }

  const header = (
    <PageHeader
      title="Seasons"
      description="The working year — everything you record belongs to the open season"
      backTo="/dashboard"
      backLabel="Dashboard"
    />
  );

  // Seasons are ADMIN-only on the server, so a non-admin gets a plain message
  // rather than a screen full of 403s.
  if (!userLoading && !isAdmin) {
    return (
      <div className="p-4 space-y-6">
        {header}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Only an administrator can manage seasons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {header}

      {/* New season */}
      <form
        onSubmit={onCreate}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            New season
          </h2>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Season code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="26-27"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add season"}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Two digits, one hyphen: <strong>26-27</strong> runs from 1 July 2026
          to 30 June 2027. The dates are worked out for you.
        </p>
      </form>

      {/* All seasons */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All seasons
          </h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : seasons.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No seasons yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {seasons.map((season) => {
              const isOpen = active?.id === season.id;
              return (
                <li
                  key={season.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {season.code}
                      </span>
                      {isOpen ? (
                        <span className="flex items-center gap-1 rounded-lg bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200">
                          <CheckCircle2 className="h-3 w-3" /> Open
                        </span>
                      ) : (
                        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {season.status === "CLOSED" ? "Closed" : "Not open"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatRange(season)}
                    </p>
                  </div>

                  {isOpen ? (
                    <button
                      type="button"
                      onClick={() => setClosing(season)}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Close season
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onActivate(season)}
                      disabled={activateSeason.isPending}
                      className="rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Open this season
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Only one season can be open at a time, so the server refuses to open
            a second one. Closing the open season runs its checks first, and the
            new season starts empty — nothing is copied over.
          </span>
        </div>
      </div>

      {/* Close wizard — ADMIN only. It shows what blocks the close, what it only
          warns about, and what the season ends with, before anything happens. */}
      {closing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !closeSeason.isPending && setClosing(null)}
          />
          <div className="relative z-10 my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Close season {closing.code}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Closing the season also opens the next one. This cannot be
                  undone from here.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {preview.isPending ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Checking what is left in this season…
                </p>
              ) : preview.isError ? (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {preview.error instanceof Error
                    ? preview.error.message
                    : "Could not check this season."}
                </p>
              ) : preview.data ? (
                <>
                  <FindingList
                    title="Cannot close yet"
                    findings={preview.data.blocks}
                    tone="block"
                  />
                  <FindingList
                    title="Worth knowing"
                    findings={preview.data.warnings}
                    tone="warn"
                  />
                  <FindingList
                    title="This season ends with"
                    findings={preview.data.info}
                    tone="info"
                  />

                  {preview.data.canClose ? (
                    <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200">
                      Nothing is blocking the close. Season {closing.code}{" "}
                      becomes closed and a new, empty season is opened.
                    </p>
                  ) : (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                      Fix the red items first. Closing now would leave goods
                      that no later season could ever reach.
                    </p>
                  )}
                </>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClosing(null)}
                disabled={closeSeason.isPending}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={closeSeason.isPending || !preview.data?.canClose}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closeSeason.isPending
                  ? "Closing…"
                  : `Close ${closing.code} and open the next`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
