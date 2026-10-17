"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useSettings, useUpdateSetting } from "@/app/lib/hooks/use-settings";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import { useToast } from "@/app/lib/toast-context";
import type { SettingView } from "@/app/lib/services/settings";

/**
 * Settings — the figures the farm can change without a developer (SOW-11).
 *
 * ## ADMIN-only, and said plainly
 *
 * The write route carries `AdminOnlyGuard` and no grantable permission, because
 * these numbers decide what stock a sowing takes. A non-admin gets a sentence
 * instead of a form whose saves the server would refuse — the same shape the users
 * page uses.
 *
 * ## The wording is part of the feature
 *
 * Each field says what does NOT change. "I changed it and last week's rows are the
 * same" has to be answered on the screen *before* the edit, not in a conversation
 * afterwards — and the server sends that wording, so there is one copy of it.
 */
export default function SettingsPage() {
  const { isAdmin, isLoading: userLoading } = usePermissions();
  const { data: settings = [], isPending, error } = useSettings();

  if (!userLoading && !isAdmin) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Only an administrator can change these figures.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Figures the farm can change here, without a developer. A change
          applies to <strong>new</strong> records — records already saved keep
          the figure they were saved with.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error.message}
        </div>
      )}

      {isPending ? (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <SettingRow key={setting.key} setting={setting} />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingRow({ setting }: { setting: SettingView }) {
  const { showToast } = useToast();
  const update = useUpdateSetting();
  const [value, setValue] = useState(String(setting.value));

  const changed = value.trim() !== String(setting.value);

  const save = async () => {
    try {
      await update.mutateAsync({ key: setting.key, value: Number(value) });
      showToast(`${setting.label} saved`, "success");
    } catch (err) {
      // The server's sentence, not a generic one: it names the field and its
      // bounds, and that is the only message worth showing here.
      showToast(
        err instanceof Error ? err.message : "Could not save it.",
        "error",
      );
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[16rem]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {setting.label}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {setting.help}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={setting.min}
            max={setting.max}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={save}
            disabled={!changed || update.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {setting.storedValue === null
          ? `Using the built-in figure (${setting.default}).`
          : setting.updatedAt
            ? `Changed ${new Date(setting.updatedAt).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )}${setting.updatedBy ? ` by ${setting.updatedBy}` : ""}.`
            : "Changed."}
      </p>
    </div>
  );
}
