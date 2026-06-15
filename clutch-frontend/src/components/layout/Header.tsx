import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

/** En-tête de l'app : marque Clutch + accès recherche et notifications. */
export const Header = () => (
  <header className="flex items-start justify-between px-5 pt-4 pb-3.5">
    <Link to="/" className="group">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-[11px] bg-accent text-on-accent">
          <Icon name="bolt" size={20} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-[22px] leading-none font-semibold tracking-tighter text-ink">
            Clutch
          </h1>
          <p className="mt-1 text-xs leading-none font-medium text-dim">
            Esports World Cup 2026 · Riyad
          </p>
        </div>
      </div>
    </Link>
    <div className="flex gap-1.5">
      <Link
        to="/search"
        aria-label="Recherche"
        className="grid size-9.5 place-items-center rounded-xl bg-surface-2 text-ink transition-transform active:scale-95"
      >
        <Icon name="search" size={19} />
      </Link>
      <button
        aria-label="Notifications"
        className="relative grid size-9.5 cursor-pointer place-items-center rounded-xl bg-surface-2 text-ink transition-transform active:scale-95"
      >
        <Icon name="bell" size={19} />
        <span className="absolute top-2 right-2.5 size-1.5 rounded-full border-[1.5px] border-surface-2 bg-accent" />
      </button>
    </div>
  </header>
);
