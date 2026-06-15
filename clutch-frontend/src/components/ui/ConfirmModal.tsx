import { Icon } from "./Icon";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
};

/** Modale de confirmation native au design système (remplace confirm()). */
export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive,
  loading,
}: ConfirmModalProps) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-[2px] px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-card"
      >
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-dim">
            {description}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-line bg-surface-2 py-2.5 text-[13px] font-bold text-ink transition-transform active:scale-[.97]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 cursor-pointer rounded-xl py-2.5 text-[13px] font-bold text-white transition-transform active:scale-[.97] ${
              destructive ? "bg-red-500" : "bg-accent"
            }`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
