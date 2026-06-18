import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../api/client';

/**
 * Icônes héros Honor of Kings via proxy backend (/assets/hok/heroes).
 * Source : liste officielle Tencent (pvp.qq.com), indexée par nom anglais Liquipedia.
 */

export const hokSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

type AssetMap = Record<string, string>;

export const useHoKHeroIcons = () =>
  useQuery({
    queryKey: ['hok', 'heroes'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: (): Promise<AssetMap> => apiGet<AssetMap>('/assets/hok/heroes'),
  });
