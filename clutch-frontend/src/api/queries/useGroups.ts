import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGroup, fetchGroup, fetchGroups, joinGroup } from '../server';

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

/** Création d'un groupe — invalide la liste après succès. */
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
};

/** Rejoindre un groupe via son code d'invitation. */
export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
};
