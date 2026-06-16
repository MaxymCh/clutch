import { Link } from 'react-router-dom';
import { useGames } from '../../api/queries/useGames';
import { useMatches } from '../../api/queries/useMatches';
import { LiveDot } from '../../components/ui/Badge';
import { GameTile } from '../../components/ui/GameTile';
import { PageSpinner } from '../../components/ui/Spinner';

/** Grille des jeux — cartes brandées (fond + logo EWC). */
export const GameGrid = () => {
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();
  if (isPending) return <PageSpinner />;

  return (
    <div className="grid grid-cols-2 gap-3 px-5 sm:grid-cols-3 lg:grid-cols-4">
      {(games ?? []).map((game) => {
        const all = (matches ?? []).filter((m) => m.gameId === game.id);
        const liveCount = all.filter((m) => m.status === 'live').length;
        const subtitle = (
          <p
            className={`text-center text-[11px] font-semibold leading-tight text-white/90 drop-shadow-sm ${
              liveCount > 0 ? 'text-accent' : ''
            }`}
          >
            {liveCount > 0
              ? `${liveCount} en direct`
              : `${all.length} match${all.length > 1 ? 's' : ''}`}
          </p>
        );

        return (
          <Link key={game.id} to={`/game/${game.id}`} className="block transition-transform active:scale-[.97]">
            <GameTile
              game={game}
              variant="grid"
              badge={liveCount > 0 ? <LiveDot size={8} /> : undefined}
              subtitle={subtitle}
            />
          </Link>
        );
      })}
    </div>
  );
};
