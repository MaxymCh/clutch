import { useState } from 'react';

type GameLogoProps = {
  tag: string;
  size?: number;
  logoUrl?: string;
};

/** Icône de jeu : image locale si disponible, sinon monogramme dark. */
export const GameLogo = ({ tag, size = 32, logoUrl }: GameLogoProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt={tag}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-xl bg-ink font-extrabold tracking-wide text-surface"
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.38) }}
    >
      {tag.slice(0, 3)}
    </span>
  );
};
