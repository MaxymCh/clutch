import { useQuery } from '@tanstack/react-query';
import { fetchPredictionHistory } from '../server';
import { fetchMatch, fetchMatches } from '../server';

/** Tous les matchs du tournoi (seule porte d'entrée des composants). */
export const useMatches = () =>
  useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    // les matchs live bougent : on rafraîchit régulièrement
    refetchInterval: 60_000,
  });

/** Un match par id (page détail). */
export const useMatch = (id: string) =>
  useQuery({
    queryKey: ['matches', id],
    queryFn: () => fetchMatch(id),
  });

/** Historique des pronostics de l'utilisateur courant. */
export const usePredictionHistory = () =>
  useQuery({
    queryKey: ['predictions', 'history'],
    queryFn: fetchPredictionHistory,
  });
