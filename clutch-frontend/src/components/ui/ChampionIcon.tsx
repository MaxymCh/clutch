import { useState } from 'react';
import { lolSlug, useChampionIcons } from '../../lib/lol';

type ChampionIconProps = {
  champion: string;
  size?: number;
};

/**
 * Icône de champion League of Legends servie depuis Data Dragon (résolue par
 * nom). Fallback = pastille texte (2 lettres) si l'image manque, comme AgentIcon.
 */
export const ChampionIcon = ({ champion, size = 22 }: ChampionIconProps) => {
  const { data: icons } = useChampionIcons();
  const [failed, setFailed] = useState(false);
  const url = icons?.[lolSlug(champion)];

  if (!url || failed) {
    return (
      <span
        title={champion}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-surface-2 font-bold text-dim"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {champion.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={champion}
      title={champion}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};
