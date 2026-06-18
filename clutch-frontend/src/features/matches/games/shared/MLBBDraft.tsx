import type { FC } from 'react';
import { MLHeroIcon } from '../../../../components/ui/MLHeroIcon';
import type { Team } from '../../../../types/esports';

type HeroIconProps = { hero: string; size?: number };

const SideBadge = ({ side }: { side: string }) => {
  const isBlue = side === 'blue';
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isBlue ? 'bg-sky-500/15 text-sky-600' : 'bg-red-500/15 text-red-500'
      }`}
    >
      {isBlue ? 'Blue' : 'Red'}
    </span>
  );
};

/** Draft MOBA (MLBB / HoK) : picks + bans + durée. */
export const MLBBDraft = ({
  heroesA, heroesB, bansA, bansB, sideA, sideB, length, teamA, teamB,
  HeroIcon = MLHeroIcon,
}: {
  heroesA?: string[];
  heroesB?: string[];
  bansA?: string[];
  bansB?: string[];
  sideA?: string;
  sideB?: string;
  length?: string;
  teamA: Team;
  teamB: Team;
  HeroIcon?: FC<HeroIconProps>;
}) => {
  const hasPicks = (heroesA?.length ?? 0) > 0 || (heroesB?.length ?? 0) > 0;
  const hasBans = (bansA?.length ?? 0) > 0 || (bansB?.length ?? 0) > 0;
  if (!hasPicks && !hasBans) return null;

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-ink">{teamA.tag}</span>
          {sideA && <SideBadge side={sideA} />}
        </div>
        {length && <span className="text-[11px] font-semibold text-faint">{length}</span>}
        <div className="flex items-center gap-1.5">
          {sideB && <SideBadge side={sideB} />}
          <span className="text-[12px] font-bold text-ink">{teamB.tag}</span>
        </div>
      </div>

      {hasPicks && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-faint">Picks</p>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {(heroesA ?? []).map((h) => <HeroIcon key={h} hero={h} size={36} />)}
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {(heroesB ?? []).map((h) => <HeroIcon key={h} hero={h} size={36} />)}
            </div>
          </div>
        </div>
      )}

      {hasBans && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-faint">Bans</p>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1 opacity-40">
              {(bansA ?? []).map((h) => <HeroIcon key={h} hero={h} size={26} />)}
            </div>
            <div className="flex flex-wrap justify-end gap-1 opacity-40">
              {(bansB ?? []).map((h) => <HeroIcon key={h} hero={h} size={26} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
