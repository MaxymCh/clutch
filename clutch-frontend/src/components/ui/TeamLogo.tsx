import { useState } from 'react';

type TeamLogoProps = {
  tag: string;
  size?: number;
  solid?: boolean;
  logoUrl?: string;
};

/** Logo d'équipe : image Liquipedia si disponible, sinon monogramme. */
export const TeamLogo = ({ tag, size = 30, solid = false, logoUrl }: TeamLogoProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt={tag}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-contain"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        solid ? 'bg-ink text-surface' : 'border-[1.5px] border-ink bg-surface text-ink',
      ].join(' ')}
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.34) }}
    >
      {tag.slice(0, 3)}
    </span>
  );
};
