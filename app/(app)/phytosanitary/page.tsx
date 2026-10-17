"use client";

import Link from "next/link";
import { FlaskConical, ListChecks, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";

const cards = [
  {
    title: "Products",
    description: "Manage the phytosanitary product catalog",
    href: "/phytosanitary/products",
    icon: FlaskConical,
  },
  {
    title: "Program",
    description: "Define the products that must be applied before harvest",
    href: "/phytosanitary/program",
    icon: ListChecks,
  },
  {
    title: "Compliance",
    description: "Check which products were applied to tunnels & sectors",
    href: "/phytosanitary/compliance",
    icon: ClipboardCheck,
  },
];

export default function PhytosanitaryHubPage() {
  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Phytosanitary"
        description="Crop protection products, program & compliance"
        backTo="/dashboard"
        backLabel="Dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl hover:shadow-2xl transition"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
              <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
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
