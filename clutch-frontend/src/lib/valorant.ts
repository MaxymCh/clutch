import { useQuery } from '@tanstack/react-query';

/**
 * Résolution des assets cosmétiques Valorant (icônes d'agents, visuels de
 * cartes) via valorant-api.com — CDN public, sans clé, CORS ouvert.
 *
 * ⚠️ Ce ne sont PAS des données métier (celles-ci viennent de NOTRE API) : on
 * ne récupère ici que des URLs d'images, mises en cache À VIE (un seul appel
 * par session). Le rendu d'images externes est déjà le pattern de TeamLogo.
 */

/** Nom Liquipedia → slug stable ("KAY/O" → "kayo", "Vyse" → "vyse"). */
export const valoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

type AssetMap = Record<string, string>;

const AGENTS_URL = 'https://valorant-api.com/v1/agents?isPlayableCharacter=true';
const MAPS_URL = 'https://valorant-api.com/v1/maps';

/** Map slug d'agent → URL d'icône (displayIcon). */
export const useAgentIcons = () =>
  useQuery({
    queryKey: ['valorant', 'agents'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<AssetMap> => {
      const res = await fetch(AGENTS_URL);
      if (!res.ok) throw new Error(`valorant-api agents ${res.status}`);
      const body = (await res.json()) as { data?: Array<{ displayName?: string; displayIcon?: string }> };
      const map: AssetMap = {};
      for (const a of body.data ?? []) {
        if (a.displayName && a.displayIcon) map[valoSlug(a.displayName)] = a.displayIcon;
      }
      return map;
    },
  });

/** Visuels d'une carte : `splash` (grand) et `icon` (petit, listViewIcon). */
export type MapImage = { splash?: string; icon?: string };

/** Map slug de carte → { splash, icon }. */
export const useMapImages = () =>
  useQuery({
    queryKey: ['valorant', 'maps'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<Record<string, MapImage>> => {
      const res = await fetch(MAPS_URL);
      if (!res.ok) throw new Error(`valorant-api maps ${res.status}`);
      const body = (await res.json()) as {
        data?: Array<{ displayName?: string; splash?: string; listViewIcon?: string }>;
      };
      const map: Record<string, MapImage> = {};
      for (const m of body.data ?? []) {
        if (m.displayName && (m.splash || m.listViewIcon)) {
          map[valoSlug(m.displayName)] = { splash: m.splash, icon: m.listViewIcon };
        }
      }
      return map;
    },
  });
