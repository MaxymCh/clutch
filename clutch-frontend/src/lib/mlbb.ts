import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../api/client';

/**
 * Icônes de héros Mobile Legends via proxy backend (/assets/mlbb/heroes).
 * mlbb.rone.dev bloque le CORS navigateur — le fetch se fait côté API.
 */

export const mlbbSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

type AssetMap = Record<string, string>;

export const useMLHeroIcons = () =>
  useQuery({
    queryKey: ['mlbb', 'heroes'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: (): Promise<AssetMap> => apiGet<AssetMap>('/assets/mlbb/heroes'),
  });
