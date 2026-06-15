import { Icon, type IconName } from './Icon';

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  sub?: string;
};

/** État vide générique (résultats de recherche, listes…). */
export const EmptyState = ({ icon = 'search', title, sub }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
    <span className="grid size-13 place-items-center rounded-2xl bg-surface-2 text-faint">
      <Icon name={icon} size={24} />
    </span>
    <p className="text-base leading-snug font-bold text-ink">{title}</p>
    {sub && <p className="max-w-60 text-[13px] leading-normal font-medium text-dim">{sub}</p>}
  </div>
);
