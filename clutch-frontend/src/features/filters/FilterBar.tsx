import { GameFilter } from "./GameFilter";
import { TeamFilter } from "./TeamFilter";
import { useMatchFilters } from "./useMatchFilters";

/** Barre de filtres jeu + équipe — multi-sélection, favoris en premier. */
export const FilterBar = () => {
  const { games, teams, toggleFilter, clearFilter } = useMatchFilters();
  return (
    <div className="flex flex-col gap-3 px-5 lg:gap-0 lg:px-0">
      {/* Filtre Jeux */}
      <div>
        <span className="mb-2 hidden text-[11px] font-semibold tracking-wide text-dim uppercase lg:block">
          Jeux
        </span>
        <GameFilter
          value={games}
          onToggle={(id) => toggleFilter("game", id)}
          onClear={() => clearFilter("game")}
        />
      </div>

      {/* Séparation */}
      <div className="hidden lg:my-4 lg:block lg:h-px lg:bg-line" />

      {/* Filtre Équipes */}
      <div>
        <span className="mb-2 hidden text-[11px] font-semibold tracking-wide text-dim uppercase lg:block">
          Équipes
        </span>
        <TeamFilter
          value={teams}
          onToggle={(id) => toggleFilter("team", id)}
          onClear={() => clearFilter("team")}
        />
      </div>
    </div>
  );
};
