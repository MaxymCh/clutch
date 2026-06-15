import type { ReactNode } from 'react';
import { Icon } from './Icon';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Bottom sheet (mobile) / boîte centrée (écran large). Pure, sans métier. */
export const Sheet = ({ open, onClose, title, children }: SheetProps) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86%] w-full flex-col rounded-t-[22px] bg-surface pt-2.5 shadow-card sm:max-w-md sm:rounded-[22px]"
      >
        <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-line-2 sm:hidden" />
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <span className="text-lg leading-none font-bold tracking-tight text-ink">{title}</span>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="grid size-8 cursor-pointer place-items-center rounded-full bg-surface-2 text-dim"
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}
        <div className="overflow-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
};
