import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  description?: string;
  backTo: string;
  backLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  backTo,
  backLabel,
  submitLabel,
  isSubmitting,
  children,
}: Props) {
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => router.push(backTo)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel ?? "Back"}
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {children ??
          (submitLabel ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          ) : null)}
      </div>
    </>
  );
}
