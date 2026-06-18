import { useState } from 'react';
import { mlbbSlug, useMLHeroIcons } from '../../lib/mlbb';

type MLHeroIconProps = {
  hero: string;
  size?: number;
};

/** Icône de héros MLBB — fallback pastille texte si l'image manque. */
export const MLHeroIcon = ({ hero, size = 22 }: MLHeroIconProps) => {
  const { data: icons } = useMLHeroIcons();
  const [failed, setFailed] = useState(false);
  const url = icons?.[mlbbSlug(hero)];

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
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};
