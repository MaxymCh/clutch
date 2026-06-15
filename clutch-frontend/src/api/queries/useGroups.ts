import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGroup, fetchGroup, fetchGroupHistory, fetchGroups, joinGroup } from '../server';

/** Les groupes de pronostics de l'utilisateur. */
export const useGroups = () =>
  useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });

/** Un groupe par id (page détail). */
export const useGroup = (id: string) =>
  useQuery({
    queryKey: ['groups', id],
    queryFn: () => fetchGroup(id),
  });

/** Historique des matchs terminés d'un groupe. */
export const useGroupHistory = (id: string) =>
  useQuery({
    queryKey: ['groups', id, 'history'],
    queryFn: () => fetchGroupHistory(id),
  });

/** Création d'un groupe — met à jour le cache après succès. */
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: (group) => {
      queryClient.setQueryData(['groups', group.id], group);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

/** Rejoindre un groupe via son code d'invitation. */
export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinGroup,
    onSuccess: (group) => {
      queryClient.setQueryData(['groups', group.id], group);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};
