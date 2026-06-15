import { useQuery } from '@tanstack/react-query';
import { fetchTeam, fetchTeams } from '../server';

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
