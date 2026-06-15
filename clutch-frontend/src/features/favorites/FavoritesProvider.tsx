import type { ReactNode } from 'react';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { FavoritesContext } from './favoritesContext';

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

/** Équipes + jeux favoris, persistés localement (choisis à l'onboarding). */
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useLocalStorage<string[]>('favTeams', []);
  const [games, setGames] = useLocalStorage<string[]>('favGames', []);

  return (
    <FavoritesContext.Provider
      value={{
        teams,
        games,
        toggleTeam: (id) => setTeams((prev) => toggle(prev, id)),
        toggleGame: (id) => setGames((prev) => toggle(prev, id)),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
