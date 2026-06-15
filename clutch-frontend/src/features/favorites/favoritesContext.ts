import { createContext, useContext } from 'react';

export type Favorites = {
  /** Ids des équipes suivies */
  teams: string[];
  /** Ids des jeux favoris */
  games: string[];
  toggleTeam: (id: string) => void;
  toggleGame: (id: string) => void;
};

/** Contexte des favoris (fourni par <FavoritesProvider>). */
export const FavoritesContext = createContext<Favorites | null>(null);

export const useFavorites = (): Favorites => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé sous <FavoritesProvider>');
  return ctx;
};
