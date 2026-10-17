import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

type Variant = "error" | "success" | "info" | "warning";

type Props = {
  message: string;
  variant?: Variant;
  onDismiss?: () => void;
};

const config: Record<
  Variant,
  { icon: typeof AlertCircle; bg: string; border: string; text: string }
> = {
  error: {
    icon: AlertCircle,
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-400",
  },
};

export function Banner({ message, variant = "error", onDismiss }: Props) {
  const { icon: Icon, bg, border, text } = config[variant];

  return (
    <div
      className={`${bg} border ${border} ${text} px-4 py-3 rounded-lg text-sm flex items-start gap-2`}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
