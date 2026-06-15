import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '../server';

/** Profil de l'utilisateur courant (points, rang, série). */
export const useUser = () =>
  useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });
