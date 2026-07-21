import React from "react";

export default function Dashboard() {
  return (
    <div className="p-4">
      <section className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your farm operations
        </p>
      </section>
    </div>
  );
}
