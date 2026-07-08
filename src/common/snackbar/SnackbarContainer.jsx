import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  closeSnackbar,
  getSnackbarQueue,
  subscribeSnackbar,
} from "./snackbar";

function variantStyles(variant) {
  switch (variant) {
    case "success":
      return "bg-[#7F56D9] text-white border border-[#6941C6] shadow-lg";
    case "error":
      return "bg-red-600 text-white border border-red-700 shadow-lg";
    case "warning":
      return "bg-amber-400 text-[#2E1065] border border-amber-500 shadow-lg";
    case "info":
      return "bg-[#C4B5FD] text-[#2E1065] border border-[#8B5CF6] shadow-lg";
    default:
      return "bg-[#2E1065] text-white border border-[#6941C6] shadow-lg";
  }
}

function VariantIcon({ variant }) {
  const className = "w-5 h-5";

  switch (variant) {
    case "success":
      return <CheckCircle2 className={className} />;
    case "error":
      return <XCircle className={className} />;
    case "warning":
      return <AlertTriangle className={className} />;
    case "info":
      return <Info className={className} />;
    default:
      return <Info className={className} />;
  }
}

function SnackbarContainer() {
  const snackbarQueue = useSyncExternalStore(
    subscribeSnackbar,
    getSnackbarQueue,
    getSnackbarQueue
  );

  if (!snackbarQueue.length) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed top-4 sm:top-6 left-0 right-0 z-[100001] flex items-start justify-center px-4"
      aria-live="polite"
    >
      <div className="w-full max-w-md sm:max-w-xl space-y-2">
        {snackbarQueue.map((toast) => {
          if (!toast?.open) return null;

          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`pointer-events-auto rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 ${variantStyles(toast.variant)}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-white/20 backdrop-blur-sm">
                  <VariantIcon variant={toast.variant} />
                </div>

                <p className="text-sm font-medium leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {toast.close !== false && (
                <button
                  type="button"
                  aria-label={`Close notification: ${toast.message}`}
                  onClick={() => closeSnackbar(toast.id)}
                  className="shrink-0 opacity-80 hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

export default SnackbarContainer;
