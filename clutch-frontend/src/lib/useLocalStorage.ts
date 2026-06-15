import { useEffect, useState } from 'react';

/**
 * useState persisté dans localStorage (préfixe "clutch:").
 * Réservé à l'état UTILISATEUR local (thème, favoris, pronos) — les données
 * serveur passent par TanStack Query.
 */
export const useLocalStorage = <T>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`clutch:${key}`);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`clutch:${key}`, JSON.stringify(value));
    } catch {
      // stockage indisponible (mode privé…) : on garde l'état en mémoire
    }
  }, [key, value]);

  return [value, setValue] as const;
};
