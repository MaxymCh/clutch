import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUser, patchUser } from '../server';

export const useUser = () =>
  useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchUser,
    onSuccess: (data) => queryClient.setQueryData(['user'], data),
  });
};
