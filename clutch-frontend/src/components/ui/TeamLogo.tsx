type TeamLogoProps = {
  /** Tag court de l'équipe ("FLCN", "T1"…) — primitive pure, pas d'objet métier */
  tag: string;
  size?: number;
  /** Rempli encre (utilisé pour l'état sélectionné des filtres) */
  solid?: boolean;
};

/** Monogramme d'équipe : cercle contour encre + tag (pas d'assets officiels). */
export const TeamLogo = ({ tag, size = 30, solid = false }: TeamLogoProps) => (
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
