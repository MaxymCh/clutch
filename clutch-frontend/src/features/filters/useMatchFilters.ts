import { useSearchParams } from "react-router-dom";

export type FilterKey = "game" | "team" | "day";

/**
 * Filtres du calendrier portés par l'URL (?game=val,cs2&team=t1,t2&day=2026-07-11)
 * → partageables et survivent au refresh.
 * game/team supportent la multi-sélection (virgule-séparée).
 */
export const useMatchFilters = () => {
  const [params, setParams] = useSearchParams();

  /** Parse une valeur CSV en tableau (vide = null = pas de filtre). */
  const parseMulti = (key: string): string[] => {
    const raw = params.get(key);
    if (!raw) return [];
    return raw.split(",").filter(Boolean);
  };

  /** Toggle une valeur dans un filtre multi-select. */
  const toggleFilter = (key: FilterKey, id: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = (next.get(key) ?? "").split(",").filter(Boolean);
        const idx = current.indexOf(id);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(id);
        if (current.length === 0) next.delete(key);
        else next.set(key, current.join(","));
        return next;
      },
      { replace: true },
    );
  };

  /** Set un filtre à une valeur unique (day) ou null pour supprimer. */
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

  /** Clear all values from a multi-select filter. */
  const clearFilter = (key: FilterKey) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  return {
    games: parseMulti("game"),
    teams: parseMulti("team"),
    day: params.get("day"),
    toggleFilter,
    setFilter,
    clearFilter,
    /** @deprecated use games[] */
    game: params.get("game"),
    /** @deprecated use teams[] */
    team: params.get("team"),
  };
};
