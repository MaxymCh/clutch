import { useGames } from "../../api/queries/useGames";
import { GameLogo } from "../../components/ui/GameLogo";
import { Icon } from "../../components/ui/Icon";
import { useFavorites } from "../favorites/favoritesContext";

type GameFilterProps = {
  value: string[];
  onToggle: (gameId: string) => void;
  onClear: () => void;
};

/** Filtre par jeu : multi-sélection, favoris en premier avec ❤. */
export const GameFilter = ({ value, onToggle, onClear }: GameFilterProps) => {
  const { data: games } = useGames();
  const { games: favGames } = useFavorites();
  if (!games) return <div className="h-8" />;

  // Favoris en premier
  const sorted = [...games].sort(
    (a, b) => Number(favGames.includes(b.id)) - Number(favGames.includes(a.id)),
  );

  return (
    <div
      className="scrollbar-none flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible"
      role="tablist"
    >
      <button
        role="tab"
        aria-selected={value.length === 0}
        onClick={onClear}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
          value.length === 0
            ? "border-accent bg-accent/8 text-accent"
            : "border-line-2 text-dim"
        }`}
      >
        <Icon name="filter" size={13} strokeWidth={2} />
        Tous
      </button>
      {sorted.map((game) => {
        const active = value.includes(game.id);
        const isFav = favGames.includes(game.id);
        return (
          <button
            key={game.id}
            role="tab"
            aria-selected={active}
            onClick={() => onToggle(game.id)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 transition-transform active:scale-95 ${
              active ? "border-accent bg-accent/8" : "border-line-2"
            }`}
          >
            <GameLogo tag={game.tag} size={20} logoUrl={game.logoUrl} />
            <span
              className={`text-xs font-semibold ${active ? "text-accent" : "text-ink"}`}
            >
              {game.short}
            </span>
            {isFav && <span className="text-[10px] text-accent">♥</span>}
          </button>
        );
      })}
    </div>
  );
};
