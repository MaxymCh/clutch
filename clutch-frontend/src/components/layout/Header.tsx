import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";

/** En-tête de l'app : titre EWC + recherche. */
export const Header = () => {
  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-3.5">
      <div>
        <h1 className="text-[22px] leading-none font-semibold tracking-tighter text-ink">
          Esports World Cup
        </h1>
        <p className="mt-1 text-xs leading-none font-medium text-dim">
          2026 · Riyad
        </p>
      </div>
      <Link
        to="/search"
        aria-label="Recherche"
        className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink transition-transform active:scale-95"
      >
        <Icon name="search" size={19} />
      </Link>
    </header>
  );
};
