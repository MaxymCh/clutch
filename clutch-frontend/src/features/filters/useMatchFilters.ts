import { useSearchParams } from 'react-router-dom';

export type FilterKey = 'game' | 'team' | 'day';

/**
 * Filtres du calendrier portés par l'URL (?game=val&team=t1&day=2026-07-11)
 * → partageables et survivent au refresh (règle architecture).
 */
export const useMatchFilters = () => {
  const [params, setParams] = useSearchParams();

  const setFilter = (key: FilterKey, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  return {
    game: params.get('game'),
    team: params.get('team'),
    day: params.get('day'),
    setFilter,
  };
};
