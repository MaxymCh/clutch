import { Link } from 'react-router-dom';
import { useGames } from '../../api/queries/useGames';
import { useMatches } from '../../api/queries/useMatches';
import { LiveDot } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';

/** Grille des jeux de la compétition, avec compteur de matchs / live. */
export const GameGrid = () => {
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();
  if (isPending) return <PageSpinner />;

  return (
    <div className="grid grid-cols-2 gap-3 px-5 sm:grid-cols-3">
      {(games ?? []).map((game) => {
        const all = (matches ?? []).filter((m) => m.gameId === game.id);
        const liveCount = all.filter((m) => m.status === 'live').length;
        return (
          <Link key={game.id} to={`/game/${game.id}`}>
            <Card className="flex flex-col gap-3.5 p-4 transition-transform active:scale-[.97]">
              <div className="flex items-start justify-between">
                <span className="grid size-10.5 place-items-center rounded-xl bg-ink text-[13px] font-extrabold tracking-wide text-surface">
                  {game.tag.slice(0, 3)}
                </span>
                {liveCount > 0 && <LiveDot size={8} />}
              </div>
              <div>
                <div className="text-base leading-tight font-bold tracking-tight text-ink">
                  {game.name}
                </div>
                <div
                  className={`mt-1.5 text-xs font-semibold ${liveCount > 0 ? 'text-accent' : 'text-dim'}`}
                >
                  {liveCount > 0
                    ? `${liveCount} en direct`
                    : `${all.length} match${all.length > 1 ? 's' : ''}`}
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};
