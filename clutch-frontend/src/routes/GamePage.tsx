import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { GameBrand } from '../components/ui/GameBrand';
import { Icon } from '../components/ui/Icon';
import { LiveDot } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchesByDay } from '../features/matches/MatchesByDay';

/** Détail d'un jeu : hero brandé + matchs groupés par jour. */
export const GamePage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();

  const game = games?.find((g) => g.id === id);
  const list = (matches ?? []).filter((m) => m.gameId === id);
  const liveCount = list.filter((m) => m.status === 'live').length;

  return (
    <Page>
      {isPending && <PageSpinner />}
      {!isPending && !game && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">Jeu introuvable.</p>
      )}
      {game && (
        <>
          <div className="relative aspect-[2.2/1] w-full overflow-hidden sm:aspect-[2.6/1]">
            {game.bgUrl ? (
              <img src={game.bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-ink" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="absolute top-4 left-4 z-10 grid size-9 cursor-pointer place-items-center rounded-[11px] bg-black/45 text-white backdrop-blur-sm transition-transform active:scale-95"
            >
              <Icon name="back" size={19} />
            </button>

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2.5 px-5 pb-5 pt-8">
              <GameBrand
                tag={game.tag}
                logoUrl={game.logoUrl}
                fullLogoUrl={game.fullLogoUrl}
                size="lg"
              />
              <div className="text-center">
                <h1 className="text-[22px] leading-none font-bold tracking-tight text-white drop-shadow-sm">
                  {game.name}
                </h1>
                <p className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-white/75">
                  {liveCount > 0 && (
                    <>
                      <LiveDot size={7} />
                      <span className="text-accent">{liveCount} en direct</span>
                      <span className="text-white/40">·</span>
                    </>
                  )}
                  {list.length} match{list.length > 1 ? 's' : ''} · EWC 2026
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-4">
            <MatchesByDay matches={list} />
          </div>
        </>
      )}
    </Page>
  );
};
