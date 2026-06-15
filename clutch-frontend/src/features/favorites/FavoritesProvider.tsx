import type { ReactNode } from 'react';
import { usePreferences, useUpdatePreferences } from '../../api/queries/usePreferences';
import { FavoritesContext } from './favoritesContext';

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

/** Équipes + jeux favoris, persistés en base via /me/preferences. */
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { data: prefs } = usePreferences();
  const { mutate: updatePrefs } = useUpdatePreferences();

  const teams = prefs?.favTeams ?? [];
  const games = prefs?.favGames ?? [];

  return (
    <FavoritesContext.Provider
      value={{
        teams,
        games,
        toggleTeam: (id) => updatePrefs({ favTeams: toggle(teams, id) }),
        toggleGame: (id) => updatePrefs({ favGames: toggle(games, id) }),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
