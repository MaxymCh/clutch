import { useGames } from '../../../api/queries/useGames';
import { Icon } from '../../../components/ui/Icon';
import { GameTile } from '../../../components/ui/GameTile';
import { useFavorites } from '../../favorites/favoritesContext';
import { StepTitle } from './StepTitle';

export const GamesStep = () => {
  const { data: games } = useGames();
  const { games: favGames, toggleGame } = useFavorites();

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pt-2">
      <StepTitle title="Quels jeux tu suis ?" sub="On mettra tes jeux en avant dans l'agenda." />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {(games ?? []).map((game) => {
            const on = favGames.includes(game.id);
            return (
              <GameTile
                key={game.id}
                game={game}
                variant="picker"
                selected={on}
                onClick={() => toggleGame(game.id)}
                badge={
                  on ? (
                    <div className="grid size-5 place-items-center rounded-full bg-accent shadow-sm">
                      <Icon name="check" size={11} strokeWidth={2.8} className="text-white" />
                    </div>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
