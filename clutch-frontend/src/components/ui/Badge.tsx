import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  /** accent = orange, neutral = gris discret, outline = contour fin */
  variant?: 'accent' | 'neutral' | 'outline';
};

const VARIANTS = {
  accent: 'text-accent',
  neutral: 'text-faint',
  outline: 'text-dim border border-line-2 rounded-md px-1.5 py-1',
};

/** Étiquette de méta-info en capitales (statut, format, phase…). */
export const Badge = ({ children, variant = 'neutral' }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[.1em] uppercase ${VARIANTS[variant]}`}
  >
    {children}
  </span>
);

/** Point orange « qui respire » — signature visuelle du live (Pulse). */
export const LiveDot = ({ size = 7 }: { size?: number }) => (
  <span className="relative inline-block" style={{ width: size, height: size }}>
    <span className="absolute inset-0 animate-live-ping rounded-full bg-live" />
    <span className="absolute inset-0 rounded-full bg-live" />
  </span>
);

/** Badge « LIVE » : point qui respire + libellé orange. */
export const LiveBadge = () => (
  <Badge variant="accent">
    <LiveDot />
    LIVE
  </Badge>
);
