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
      <span
        className="inline-grid shrink-0 place-items-center overflow-hidden rounded-xl bg-black"
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt={tag}
          className="h-[68%] w-[68%] object-contain"
          onError={() => setImgFailed(true)}
        />
      </span>
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
