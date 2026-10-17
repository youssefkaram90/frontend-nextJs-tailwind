"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Beaker,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  LineChart,
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { SearchBar } from "@/app/components/ui/search-bar";
import { OperationForm } from "@/app/components/crop-care/operation-form";
import { OperationsList } from "@/app/components/crop-care/operations-list";
import { useCaps, usePermissions } from "@/app/lib/hooks/use-permissions";
import { useSearch } from "@/app/lib/use-search";
import type { CropCareType } from "@/app/lib/types/crop-care";

/**
 * Crop Care — the ONE page for treatments (user, 2026-10-11).
 *
 * It was a hub of two cards, with the log one click away, the log list another
 * click away, and the warehouse (product stock) a third screen in the sidebar.
 * The farm asked for one place: **log what was done, see what was done (overall
 * and per location), and reach the stock from here** — so the form and the list
 * live on this page, and the rest are links out of it.
 *
 * The other screens keep their own addresses and their own permission gates; they
 * are simply no longer in the sidebar. Which of the links appear follows the
 * permissions the user actually has:
 *
 * - the warehouse, the catalogue, the program and compliance need
 *   `phytosanitary.view`;
 * - the log form and the list need `crop-care.*` (the form hides itself);
 * - plans need `crop-care.view`.
 */
export default function CropCarePage() {
  const caps = useCaps("crop-care");
  const { can } = usePermissions();
  /**
   * The kind being worked with — chosen on the form, and the ONLY kind the list
   * below shows (user, 2026-10-11).
   *
   * It is one choice for the whole page rather than a filter on the list: the
   * operator is doing treatments or irrigations right now, and the list is the
   * record of that same kind. There is deliberately no "All" — ask for the four
   * tabs back and it returns as a filter on the list.
   */
  const [kind, setKind] = useState<CropCareType>("IRRIGATION");

  /**
   * The page's search text. It lives here because the box sits under the links,
   * but the LIST is what uses it — and this is where the debounce is, so the box
   * stays a dumb input (STOCK-05).
   */
  const { query, setQuery, debouncedQuery } = useSearch();

  const links = [
    {
      title: "Product stock",
      description: "What this season may use, and what is left of each",
      href: "/agri-inputs",
      icon: Beaker,
      show: can("phytosanitary.view"),
    },
    {
      title: "Products",
      description: "The catalogue: name, active ingredient, category",
      href: "/phytosanitary/products",
      icon: FlaskConical,
      show: can("phytosanitary.view"),
    },
    {
      title: "Before harvest",
      description: "The products that must be applied before harvest",
      href: "/phytosanitary/program",
      icon: ClipboardList,
      show: can("phytosanitary.view"),
    },
    {
      title: "Compliance",
      description: "Which product was last applied where",
      href: "/phytosanitary/compliance",
      icon: LineChart,
      show: can("phytosanitary.view"),
    },
    {
      title: "Plans",
      description: "Scheduled irrigation, treatment and fertilisation",
      href: "/crop-care/plans",
      icon: CalendarClock,
      show: caps.view,
    },
  ].filter((l) => l.show);

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Crop Care"
        description="Log irrigation, treatment and fertilisation — and see what was done, overall and per location"
        backTo="/dashboard"
        backLabel="Dashboard"
      />

      {links.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {links.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-lg hover:shadow-xl transition"
            >
              <div className="w-9 h-9 shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  {title}
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/*
        The search sits directly under the links (user, 2026-10-11): it is the
        page's finder — a place (T1), a product or a word from a note — so it is
        where every other module keeps its search box, not buried inside the list.
        The text is owned HERE and given to the list, which is what filters.
      */}
      <div>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by tunnel, sector, product or note…"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Type T1 to see what was done in tunnel T1.
        </p>
      </div>

      {/* The log — the main thing the page is for. Hidden without the permit. */}
      <OperationForm kind={kind} onKindChange={setKind} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Operations
        </h2>
        <OperationsList kind={kind} query={debouncedQuery} />
      </div>
    </div>
  );
}
