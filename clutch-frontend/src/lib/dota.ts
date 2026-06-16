import { useQuery } from '@tanstack/react-query';

/**
 * Résolution des icônes de héros Dota 2 via les constantes OpenDota (CDN
 * public, sans clé). Même esprit que les agents Valorant / champions LoL :
 * uniquement des URLs d'images, mises en cache à vie.
 */

/** Nom de héros → slug stable ("Anti-Mage" → "antimage"). */
export const dotaSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

type AssetMap = Record<string, string>;

const HEROES_URL = 'https://api.opendota.com/api/constants/heroes';
const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes';

/** Map slug de héros → URL d'icône carrée (résolu par nom localisé). */
export const useHeroIcons = () =>
  useQuery({
    queryKey: ['dota', 'heroes'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<AssetMap> => {
      const res = await fetch(HEROES_URL);
      if (!res.ok) throw new Error(`opendota heroes ${res.status}`);
      const body = (await res.json()) as Record<
        string,
        { name?: string; localized_name?: string }
      >;
      const map: AssetMap = {};
      for (const hero of Object.values(body)) {
        if (!hero.name || !hero.localized_name) continue;
        // "npc_dota_hero_antimage" → "antimage" (clé d'image Steam).
        const key = hero.name.replace('npc_dota_hero_', '');
        map[dotaSlug(hero.localized_name)] = `${CDN}/${key}.png`;
      }
      return map;
    },
  });
