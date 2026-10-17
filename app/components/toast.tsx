"use client";

import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import type { Toast } from "@/app/lib/toast-context";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success:
    "border-green-400 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200",
  error:
    "border-red-400 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200",
  info: "border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200",
  warning:
    "border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200",
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in ${COLORS[toast.type]}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
