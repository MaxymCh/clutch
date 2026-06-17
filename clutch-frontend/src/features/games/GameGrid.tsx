import { Link } from 'react-router-dom';
import { useGames } from '../../api/queries/useGames';
import { useMatches } from '../../api/queries/useMatches';
import { LiveDot } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { isMatchLive } from '../../lib/date';

/** Grille des jeux de la compétition — carte avec image de fond. */
export const GameGrid = () => {
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();
  if (isPending) return <PageSpinner />;

  return (
    <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2">
      {(games ?? []).map((game) => {
        const all = (matches ?? []).filter((m) => m.gameId === game.id);
        const liveCount = all.filter((m) => isMatchLive(m)).length;
        const upcoming = all.filter((m) => m.status === 'upcoming' && !isMatchLive(m)).length;
        const done = all.filter((m) => m.status === 'done').length;

        return (
          <Link key={game.id} to={`/game/${game.id}`}>
            <div className="relative overflow-hidden rounded-2xl transition-transform active:scale-[.97]">
              {/* Image de fond */}
              <div className="aspect-[2.2/1] w-full">
                {game.bgUrl ? (
                  <img
                    src={game.bgUrl}
                    alt={game.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-ink/10" />
                )}
              </div>
              {/* Overlay dégradé */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              {/* Contenu */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-lg leading-tight font-bold text-white">
                      {game.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-white/70">
                      {liveCount > 0 && (
                        <span className="font-semibold text-accent">{liveCount} en direct · </span>
                      )}
                      {upcoming} à venir · {done} terminé{done > 1 ? 's' : ''}
                    </p>
                  </div>
                  {liveCount > 0 && <LiveDot size={9} />}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
