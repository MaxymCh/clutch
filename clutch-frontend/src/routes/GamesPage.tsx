import { useGames } from '../api/queries/useGames';
import { Page } from '../components/layout/Page';
import { GameGrid } from '../features/games/GameGrid';

/** Onglet Jeux : la grille des titres en compétition. */
export const GamesPage = () => {
  const { data: games } = useGames();
  return (
    <Page>
      <div className="px-5 pt-4 pb-4">
        <h1 className="text-[24px] leading-none font-semibold tracking-tighter text-ink">Jeux</h1>
        <p className="mt-1.5 text-[13px] leading-none font-medium text-dim">
          {games ? `${games.length} titres en compétition` : 'EWC 2026'}
        </p>
      </div>
      <GameGrid />
    </Page>
  );
};
