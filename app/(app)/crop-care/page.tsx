"use client";

import Link from "next/link";
import { Droplets, CalendarClock } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";

const cards = [
  {
    title: "Operations",
    description:
      "Log irrigation, treatments and fertilisation done on tunnels/sectors (standalone)",
    href: "/crop-care/operations",
    icon: Droplets,
  },
  {
    title: "Plans",
    description:
      "Scheduled irrigation, treatment and fertilisation plans with execution",
    href: "/crop-care/plans",
    icon: CalendarClock,
  },
];

export default function CropCareHubPage() {
  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Crop Care"
        description="Irrigation, treatment and fertilisation for tunnels and sectors"
        backTo="/dashboard"
        backLabel="Dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl hover:shadow-2xl transition"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
