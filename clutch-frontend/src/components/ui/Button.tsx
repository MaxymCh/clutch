import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'dark' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent active:bg-accent-press',
  dark: 'bg-ink text-surface',
  ghost: 'border-[1.5px] border-line-2 text-ink',
  soft: 'bg-surface-2 text-ink',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2.5 text-[13px]',
  md: 'px-4.5 py-3.5 text-[15px]',
  lg: 'px-5 py-4 text-base',
};

/** Bouton de base — cible tactile confortable, état pressé léger. */
export const Button = ({
  variant = 'primary',
  size = 'md',
  full = false,
  className,
  ...props
}: ButtonProps) => (
  <button
    className={[
      'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[13px]',
      'font-bold tracking-tight transition-transform active:scale-[.97]',
      'disabled:pointer-events-none disabled:opacity-45',
      VARIANTS[variant],
      SIZES[size],
      full ? 'w-full' : '',
      className ?? '',
    ].join(' ')}
    {...props}
  />
);
