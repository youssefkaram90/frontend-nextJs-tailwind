import { PackageOpen } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({
  title = "No data found",
  description = "There's nothing to display yet.",
  icon,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-300 dark:text-gray-600 mb-4">
        {icon ?? <PackageOpen className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
