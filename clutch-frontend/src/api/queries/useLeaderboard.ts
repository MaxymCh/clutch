import { useQuery } from '@tanstack/react-query';
import { fetchGlobalLeaderboard } from '../server';

/** Classement mondial des pronostiqueurs. */
export const useLeaderboard = () =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchGlobalLeaderboard,
  });
