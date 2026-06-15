import { GameFilter } from './GameFilter';
import { TeamFilter } from './TeamFilter';
import { useMatchFilters } from './useMatchFilters';

/** Barre de filtres jeu + équipe — l'état vit dans l'URL (query params). */
export const FilterBar = () => {
  const { game, team, setFilter } = useMatchFilters();
  return (
    <div className="flex flex-col gap-3">
      <GameFilter value={game} onChange={(id) => setFilter('game', id)} />
      <TeamFilter value={team} onChange={(id) => setFilter('team', id)} />
    </div>
  );
};
