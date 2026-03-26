"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  variant = "danger",
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "default";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-[var(--danger)] hover:opacity-95 text-white"
      : "bg-[var(--accent)] hover:opacity-95 text-[var(--bg)]";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] card-reissue-backdrop"
        onClick={onClose}
        aria-label={cancelLabel}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl p-6 sm:p-7 card-reissue-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex justify-end -mt-1 -mr-1 mb-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
            aria-label={cancelLabel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 id="confirm-dialog-title" className="text-lg font-bold pr-6 -mt-2">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
          <button type="button" onClick={onClose} className="btn btn-secondary w-full sm:flex-1 py-3 border border-[var(--border)]">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:flex-1 py-3 rounded-[var(--radius)] font-semibold text-sm transition-opacity ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
