import { useQuery } from '@tanstack/react-query';
import { fetchTeam, fetchTeamPlayers, fetchTeams } from '../server';

/** Toutes les équipes (barre de filtres, listes). */
export const useTeams = () =>
  useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: Infinity, // le roster ne change pas pendant le tournoi
  });

/** Une équipe par id (page équipe). */
export const useTeam = (id: string) =>
  useQuery({
    queryKey: ['teams', id],
    queryFn: () => fetchTeam(id),
    staleTime: Infinity,
  });

/** Roster d'une équipe (joueurs) — n'est lancé que si `id` est fourni. */
export const useTeamPlayers = (id: string) =>
  useQuery({
    queryKey: ['teams', id, 'players'],
    queryFn: () => fetchTeamPlayers(id),
    enabled: Boolean(id),
    staleTime: Infinity, // le roster ne change pas pendant le tournoi
  });
