import { useState } from 'react';

type PlayerAvatarProps = {
  name: string;
  size?: number;
  logoUrl?: string;
};

/** Avatar joueur pro : photo si disponible, sinon initiales. */
export const PlayerAvatar = ({ name, size = 40, logoUrl }: PlayerAvatarProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full border border-line-2 bg-surface-2 font-bold text-ink"
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.38) }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
};
