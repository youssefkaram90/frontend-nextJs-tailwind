import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  options: readonly string[];
  error?: FieldError;
};

export function FormRadioGroup({
  label,
  options,
  error,
  ...radioProps
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex gap-4">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              value={option}
              {...radioProps}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {option}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
