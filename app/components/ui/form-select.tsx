import type { SelectHTMLAttributes } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: FieldError;
  registration?: UseFormRegisterReturn;
  optional?: boolean;
  options: { value: string; label: string }[];
};

export function FormSelect({
  label,
  error,
  registration,
  optional,
  options,
  className = "",
  ...selectProps
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {optional && (
          <span className="text-gray-400 font-normal"> (optional)</span>
        )}
      </label>
      <select
        {...registration}
        {...selectProps}
        className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
