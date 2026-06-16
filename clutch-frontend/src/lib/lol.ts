import { useQuery } from '@tanstack/react-query';

/**
 * Résolution des icônes de champions League of Legends via Data Dragon (CDN
 * public Riot, sans clé, CORS ouvert).
 *
 * ⚠️ Comme pour les assets Valorant : ce ne sont PAS des données métier (elles
 * viennent de NOTRE API), seulement des URLs d'images mises en cache À VIE.
 */

/** Nom de champion → slug stable ("Lee Sin" → "leesin", "Kai'Sa" → "kaisa"). */
export const lolSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

type AssetMap = Record<string, string>;

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

/**
 * Map slug de champion → URL d'icône carrée.
 * Récupère d'abord la dernière version de Data Dragon, puis le catalogue des
 * champions. Indexé par le slug du nom affiché ET de l'id (robustesse).
 */
export const useChampionIcons = () =>
  useQuery({
    queryKey: ['lol', 'champions'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<AssetMap> => {
      const vRes = await fetch(VERSIONS_URL);
      if (!vRes.ok) throw new Error(`ddragon versions ${vRes.status}`);
      const versions = (await vRes.json()) as string[];
      const version = versions[0];

      const cRes = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      );
      if (!cRes.ok) throw new Error(`ddragon champions ${cRes.status}`);
      const body = (await cRes.json()) as {
        data?: Record<string, { id?: string; name?: string; image?: { full?: string } }>;
      };

      const base = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion`;
      const map: AssetMap = {};
      for (const champ of Object.values(body.data ?? {})) {
        if (!champ.image?.full) continue;
        const url = `${base}/${champ.image.full}`;
        if (champ.name) map[lolSlug(champ.name)] = url;
        if (champ.id) map[lolSlug(champ.id)] = url;
      }
      return map;
    },
  });
