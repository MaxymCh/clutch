import type { ReactNode } from 'react';
import type { Game } from '../../types/esports';
import { GameBrand } from './GameBrand';
import { Icon } from './Icon';

type GameTileProps = {
  game: Game;
  /** grid = carte portrait, picker = onboarding, compact = favoris profil, mini = feed Pour toi */
  variant: 'grid' | 'picker' | 'compact' | 'mini';
  selected?: boolean;
  onClick?: () => void;
  badge?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
};

const VARIANT = {
  grid: {
    aspect: 'aspect-[3/4]',
    brand: 'md' as const,
    overlay: 'from-black/80 via-black/35 to-black/10',
    overlayOn: 'from-black/70 via-black/25 to-black/5',
    ring: 'ring-1 ring-line-2',
    ringOn: 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
  },
  picker: {
    aspect: 'aspect-[4/1.5]',
    brand: 'md' as const,
    overlay: 'from-black/85 via-black/40 to-black/10',
    overlayOn: 'from-black/75 via-black/20 to-black/0',
    ring: 'ring-1 ring-line-2',
    ringOn: 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
  },
  compact: {
    aspect: 'h-16',
    brand: 'sm' as const,
    overlay: 'bg-black/65',
    overlayOn: 'bg-black/35',
    ring: 'border-2 border-line-2',
    ringOn: 'border-2 border-accent',
  },
  mini: {
    aspect: 'h-12',
    brand: 'xs' as const,
    overlay: 'bg-black/65',
    overlayOn: 'bg-black/35',
    ring: 'border border-line-2',
    ringOn: 'border border-accent',
  },
};

/** Carte jeu brandée : fond (bgUrl) + logo EWC + contenu optionnel. */
export const GameTile = ({
  game,
  variant,
  selected = false,
  onClick,
  badge,
  subtitle,
  className = '',
}: GameTileProps) => {
  const v = VARIANT[variant];
  const interactive = onClick ? 'cursor-pointer transition-all duration-200 active:scale-[.96]' : '';
  const Comp = onClick ? 'button' : 'div';
  const selectionBadge =
    badge ??
    (selected && (variant === 'compact' || variant === 'mini') ? (
      <div className={`grid place-items-center rounded-full bg-accent shadow-sm ${variant === 'mini' ? 'size-4' : 'size-5'}`}>
        <Icon name="check" size={variant === 'mini' ? 9 : 11} strokeWidth={2.8} className="text-white" />
      </div>
    ) : null);

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? selected : undefined}
      className={[
        'group relative w-full overflow-hidden text-left',
        variant === 'mini' ? 'rounded-xl' : 'rounded-2xl',
        v.aspect,
        interactive,
        selected ? v.ringOn : v.ring,
        className,
      ].join(' ')}
    >
      {game.bgUrl ? (
        <img
          src={game.bgUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${
            selected ? 'scale-105' : 'group-active:scale-105'
          }`}
        />
      ) : (
        <div className="absolute inset-0 bg-ink" />
      )}

      <div
        className={`absolute inset-0 ${
          variant === 'compact' || variant === 'mini'
            ? selected
              ? v.overlayOn
              : v.overlay
            : `bg-gradient-to-t ${selected ? v.overlayOn : v.overlay}`
        }`}
      />

      {selectionBadge && (
        <div className={`absolute z-10 ${variant === 'mini' ? 'top-1 right-1' : variant === 'compact' ? 'top-1.5 right-1.5' : 'top-2 right-2'}`}>
          {selectionBadge}
        </div>
      )}

      <div
        className={`relative z-[1] flex h-full flex-col items-center justify-center gap-2 p-3 ${
          variant === 'mini' ? 'px-1 py-1' : variant === 'compact' ? 'px-1.5 py-2' : ''
        }`}
      >
        <GameBrand tag={game.tag} logoUrl={game.logoUrl} fullLogoUrl={game.fullLogoUrl} size={v.brand} />
        {subtitle !== undefined ? (
          subtitle
        ) : variant !== 'compact' && variant !== 'mini' ? (
          <p className="text-center text-[12px] font-bold leading-tight text-white drop-shadow-sm">
            {game.short}
          </p>
        ) : null}
      </div>
    </Comp>
  );
};
