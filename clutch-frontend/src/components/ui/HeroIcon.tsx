import { useState } from 'react';
import { dotaSlug, useHeroIcons } from '../../lib/dota';

type HeroIconProps = {
  hero: string;
  size?: number;
};

/**
 * Icône de héros Dota 2 servie depuis OpenDota/Steam (résolue par nom).
 * Fallback = pastille texte (2 lettres) si l'image manque, comme AgentIcon.
 * Format large (16:9) : les portraits Dota ne sont pas carrés.
 */
export const HeroIcon = ({ hero, size = 22 }: HeroIconProps) => {
  const { data: icons } = useHeroIcons();
  const [failed, setFailed] = useState(false);
  const url = icons?.[dotaSlug(hero)];

  if (!url || failed) {
    return (
      <span
        title={hero}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-surface-2 font-bold text-dim"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {hero.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={hero}
      title={hero}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};
