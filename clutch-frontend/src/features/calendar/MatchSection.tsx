import type { ReactNode } from 'react';

type MatchSectionProps = {
  label: string;
  count: number;
  /** Section mise en avant (En direct → libellé orange) */
  accent?: boolean;
  children: ReactNode;
};

/** Tête de section du calendrier : libellé, compteur, filet. */
export const MatchSection = ({ label, count, accent = false, children }: MatchSectionProps) => (
  <section>
    <div className="flex items-center gap-2 pt-5 pb-1.5">
      <h2
        className={`text-[11px] leading-none font-bold tracking-[.1em] uppercase ${
          accent ? 'text-accent' : 'text-dim'
        }`}
      >
        {label}
      </h2>
      <span className="text-[11px] leading-none font-semibold text-faint">{count}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
    {children}
  </section>
);
