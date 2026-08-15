import type { InputHTMLAttributes } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: FieldError;
  registration?: UseFormRegisterReturn;
  optional?: boolean;
};

export function FormDatePicker({
  label,
  error,
  registration,
  optional,
  className = "",
  ...inputProps
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {optional && (
          <span className="text-gray-400 font-normal"> (optional)</span>
        )}
      </label>
      <input
        type="date"
        {...registration}
        {...inputProps}
        className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
