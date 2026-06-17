import { useState } from 'react';

type FlagProps = {
  /** Code pays ISO 3166-1 alpha-2 ("FR", "KR", "EU"…). */
  countryCode: string;
  /** Hauteur du drapeau en px (largeur auto, ratio respecté). */
  size?: number;
  className?: string;
};

/**
 * Drapeau de pays en image SVG — fiable sur TOUS les navigateurs.
 *
 * Pourquoi pas un emoji 🇫🇷 ? Sur Windows, la police Segoe UI Emoji ne
 * contient pas les drapeaux de pays : Edge et Chrome n'affichent alors que
 * les deux lettres (Firefox embarque sa propre police et les affiche). On
 * passe donc par une image.
 *
 * Les SVG sont servis en local (`public/flags/`) → 100 % offline, aucune
 * dépendance externe. Repli si le drapeau n'existe pas : code pays en étiquette.
 */
export const Flag = ({ countryCode, size = 14, className = '' }: FlagProps) => {
  const [failed, setFailed] = useState(false);
  const code = countryCode?.toLowerCase();

  // Pays inconnu : rien à afficher.
  if (!code || code === 'xx') return null;

  if (failed) {
    return (
      <span
        className={`inline-grid place-items-center rounded-[3px] bg-surface-2 px-1 text-[9px] font-bold leading-none text-dim align-middle ${className}`}
        style={{ height: size }}
      >
        {countryCode.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${code}.svg`}
      alt={countryCode.toUpperCase()}
      title={countryCode.toUpperCase()}
      onError={() => setFailed(true)}
      loading="lazy"
      className={`inline-block w-auto rounded-[2px] object-contain align-middle ${className}`}
      style={{ height: size }}
    />
  );
};
