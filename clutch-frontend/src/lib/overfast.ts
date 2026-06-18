import { useQuery } from '@tanstack/react-query';

/**
 * Assets Overwatch 2 via OverFast API (tekrop.fr) — CDN public, CORS ouvert.
 * Cache permanent côté client (staleTime Infinity) : un seul appel par session.
 */

const BASE = 'https://overfast-api.tekrop.fr';

export const owSlug = (name: string) =>
  name.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Map slug de carte → URL screenshot haute qualité. */
export const useOWMaps = () =>
  useQuery({
    queryKey: ['overfast', 'maps'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await fetch(`${BASE}/maps`);
      if (!res.ok) throw new Error(`overfast-api maps ${res.status}`);
      const body = (await res.json()) as Array<{ name?: string; screenshot?: string }>;
      const map: Record<string, string> = {};
      for (const m of body ?? []) {
        if (m.name && m.screenshot) map[owSlug(m.name)] = m.screenshot;
      }
      return map;
    },
  });

/** Map slug de héros → URL portrait (cloudfront CDN). */
export const useOWHeroes = () =>
  useQuery({
    queryKey: ['overfast', 'heroes'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await fetch(`${BASE}/heroes`);
      if (!res.ok) throw new Error(`overfast-api heroes ${res.status}`);
      const body = (await res.json()) as Array<{ name?: string; portrait?: string }>;
      const map: Record<string, string> = {};
      for (const h of body ?? []) {
        if (h.name && h.portrait) map[owSlug(h.name)] = h.portrait;
      }
      return map;
    },
  });
