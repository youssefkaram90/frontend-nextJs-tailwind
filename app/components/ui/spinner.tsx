import { Loader2 } from "lucide-react";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Spinner({ size = "md", className = "" }: Props) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2
        className={`animate-spin text-indigo-600 dark:text-indigo-400 ${sizes[size]} ${className}`}
      />
    </div>
  );
}
