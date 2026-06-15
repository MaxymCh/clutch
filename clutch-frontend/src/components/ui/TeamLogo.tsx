type TeamLogoProps = {
  tag: string;
  size?: number;
  solid?: boolean;
  logoUrl?: string;
};

/** Logo d'équipe : image Liquipedia si disponible, sinon monogramme. */
export const TeamLogo = ({ tag, size = 30, solid = false, logoUrl }: TeamLogoProps) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={tag}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-contain"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.removeAttribute('hidden');
        }}
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
