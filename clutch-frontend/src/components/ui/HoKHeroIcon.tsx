import { useState } from 'react';
import { hokSlug, useHoKHeroIcons } from '../../lib/hok';

type HoKHeroIconProps = {
  hero: string;
  size?: number;
};

/** Icône de héros HoK — proxy backend ; fallback initiales si inconnu. */
export const HoKHeroIcon = ({ hero, size = 22 }: HoKHeroIconProps) => {
  const { data: icons } = useHoKHeroIcons();
  const [failed, setFailed] = useState(false);
  const url = icons?.[hokSlug(hero)];

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
