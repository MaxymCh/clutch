import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '../server';

/** Les jeux de la compétition (barre de filtres). */
export const useGames = () =>
  useQuery({
    queryKey: ['games'],
    queryFn: fetchGames,
    staleTime: Infinity, // la liste des jeux est fixe
  });
