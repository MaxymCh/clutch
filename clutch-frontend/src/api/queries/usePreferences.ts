import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Preferences } from '../../types/community';
import { fetchPreferences, patchPreferences } from '../server';

const QUERY_KEY = ['preferences'] as const;

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  notifications: true,
  onboarded: false,
  favTeams: [],
  favGames: [],
};

export const usePreferences = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPreferences,
    placeholderData: DEFAULT_PREFERENCES,
  });

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchPreferences,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Preferences>(QUERY_KEY);
      queryClient.setQueryData<Preferences>(QUERY_KEY, (old) => ({
        ...(old ?? DEFAULT_PREFERENCES),
        ...patch,
      }));
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
