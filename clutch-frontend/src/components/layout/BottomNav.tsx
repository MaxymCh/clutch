import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { TABS, activeTabId } from './navTabs';

/** Navigation principale mobile : 4 onglets fixés en bas (cachée ≥ lg). */
export const BottomNav = () => {
  const { pathname } = useLocation();
  const active = activeTabId(pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 ${
              on ? 'text-ink' : 'text-dim'
            }`}
          >
            <Icon name={tab.icon} size={22} strokeWidth={on ? 2.1 : 1.8} />
            <span className={`text-[10.5px] leading-none tracking-tight ${on ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
            <span className={`-mt-0.5 size-[5px] rounded-full ${on ? 'bg-accent' : 'bg-transparent'}`} />
          </Link>
        );
      })}
    </nav>
  );
};
