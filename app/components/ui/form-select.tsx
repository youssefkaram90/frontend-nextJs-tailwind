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
        className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
