import { useState } from 'react';
import { GameLogo } from './GameLogo';

type GameBrandProps = {
  tag: string;
  logoUrl?: string;
  fullLogoUrl?: string;
  /** sm = favoris profil, md = grille, lg = hero page jeu */
  size?: 'sm' | 'md' | 'lg';
};

const LOGO_HEIGHT = { sm: 14, md: 20, lg: 30 } as const;
const ICON_SIZE = { sm: 28, md: 36, lg: 48 } as const;
const PILL_PAD = { sm: 'px-2 py-1', md: 'px-3 py-1.5', lg: 'px-4 py-2' } as const;

/** Logo horizontal EWC sur pastille blanche (lisible sur fond sombre). */
export const GameBrand = ({ tag, logoUrl, fullLogoUrl, size = 'md' }: GameBrandProps) => {
  const [fullFailed, setFullFailed] = useState(false);
  const src = fullLogoUrl && !fullFailed ? fullLogoUrl : undefined;

  if (src) {
    return (
      <div className={`inline-flex max-w-full items-center justify-center rounded-xl bg-white shadow-card ${PILL_PAD[size]}`}>
        <img
          src={src}
          alt={tag}
          className="max-w-full object-contain"
          style={{ height: LOGO_HEIGHT[size] }}
          onError={() => setFullFailed(true)}
        />
      </div>
    );
  }

  return <GameLogo tag={tag} size={ICON_SIZE[size]} logoUrl={logoUrl} />;
};
