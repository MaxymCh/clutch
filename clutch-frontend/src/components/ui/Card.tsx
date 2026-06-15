import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** inset = légèrement enfoncée (fond gris très clair, sans ombre) */
  inset?: boolean;
};

/** Surface de contenu arrondie, sans logique métier. */
export const Card = ({ inset = false, className, ...props }: CardProps) => (
  <div
    className={[
      'rounded-2xl',
      inset ? 'bg-surface-2' : 'border border-line bg-surface shadow-card',
      className ?? '',
    ].join(' ')}
    {...props}
  />
);
