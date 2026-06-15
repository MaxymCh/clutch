import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { LiveDot } from '../ui/Badge';
import { TABS, activeTabId } from './navTabs';

type SidebarProps = {
  /** true si au moins un match est en direct (pastille sur Agenda) */
  agendaLive?: boolean;
  /** Bouton de thème injecté par le layout (vient de features/settings) */
  themeToggle?: ReactNode;
};

/** Navigation desktop (≥ lg) : colonne fixe à gauche, style Pulse. */
export const Sidebar = ({ agendaLive = false, themeToggle }: SidebarProps) => {
  const { pathname } = useLocation();
  const active = activeTabId(pathname);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link to="/" className="flex items-center gap-2.5 px-2.5 pb-6">
        <span className="grid size-9 place-items-center rounded-[11px] bg-accent text-on-accent">
          <Icon name="bolt" size={20} strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-lg leading-none font-semibold tracking-tighter text-ink">Clutch</span>
          <span className="mt-1 block text-[10.5px] leading-none font-medium text-dim">EWC 2026</span>
        </span>
      </Link>

      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={on ? 'page' : undefined}
            className={`mb-0.5 flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-sm tracking-tight transition-transform active:scale-[.97] ${
              on ? 'bg-surface-2 font-bold text-ink' : 'font-semibold text-dim'
            }`}
          >
            <Icon name={tab.icon} size={20} strokeWidth={on ? 2.1 : 1.8} />
            {tab.label}
            {tab.id === 'agenda' && agendaLive && <span className="ml-auto"><LiveDot /></span>}
          </Link>
        );
      })}

      <Link
        to="/search"
        className="flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-sm font-semibold tracking-tight text-dim transition-transform active:scale-[.97]"
      >
        <Icon name="search" size={20} />
        Recherche
      </Link>

      <div className="mt-auto">{themeToggle}</div>
    </aside>
  );
};
