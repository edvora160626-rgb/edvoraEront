import { LogOut } from "lucide-react";

function LogoutModal({
  open,
  title = "Logout Confirmation",
  description = "Are you sure you want to logout?",
  confirmText = "Logout",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={loading ? undefined : onCancel}
        aria-label="Close logout confirmation"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        className="relative w-full max-w-xs sm:max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="px-4 sm:px-5 pt-5 pb-1 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FAEEE9] text-[#A77A95]">
            <LogOut size={22} />
          </span>
          <h3
            id="logout-modal-title"
            className="text-base sm:text-lg font-semibold text-[#735366]"
          >
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-xs sm:text-sm text-gray-600">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-row justify-center items-center gap-2 px-4 py-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 w-full sm:w-auto cursor-pointer"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs sm:text-sm font-medium text-white disabled:opacity-60 w-full sm:w-auto cursor-pointer"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Logging out…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;
