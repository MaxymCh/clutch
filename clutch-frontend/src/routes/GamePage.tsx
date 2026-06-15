import { useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchesByDay } from '../features/matches/MatchesByDay';

/** Détail d'un jeu : /game/:id — tous ses matchs, groupés par jour. */
export const GamePage = () => {
  const { id = '' } = useParams();
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();

  const game = games?.find((g) => g.id === id);
  const list = (matches ?? []).filter((m) => m.gameId === id);

  return (
    <Page>
      <TopBar title={game?.name ?? 'Jeu'} />
      {isPending && <PageSpinner />}
      {!isPending && !game && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">Jeu introuvable.</p>
      )}
      {game && (
        <>
          <div className="flex items-center gap-3 border-b border-line px-5 pt-3 pb-4.5">
            <span className="grid size-13 place-items-center rounded-[15px] bg-ink text-[15px] font-extrabold text-surface">
              {game.tag.slice(0, 3)}
            </span>
            <div>
              <div className="text-[21px] leading-none font-bold tracking-tight text-ink">
                {game.name}
              </div>
              <div className="mt-1.5 text-xs leading-none font-medium text-dim">
                {list.length} match{list.length > 1 ? 's' : ''} · EWC 2026
              </div>
            </div>
          </div>
          <div className="px-5">
            <MatchesByDay matches={list} />
          </div>
        </>
      )}
    </Page>
  );
};
