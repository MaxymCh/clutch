import React from 'react';
import { owSlug, useOWHeroes } from '../../../../lib/overfast';
import type { Team } from '../../../../types/esports';

const HeroBan = ({ name, portraits }: { name: string; portraits: Record<string, string> }) => {
  const portrait = portraits[owSlug(name)];
  return (
    <div className="flex items-center gap-2">
      {portrait ? (
        <img
          src={portrait}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-surface-2" />
      )}
      <span className="truncate text-[13px] font-semibold text-ink">{name}</span>
    </div>
  );
};

export const OWBans = ({
  bansA, bansB, teamA, teamB, mode,
}: {
  bansA?: string[];
  bansB?: string[];
  teamA: Team;
  teamB: Team;
  mode?: string;
}) => {
  const { data: portraits = {} } = useOWHeroes();
  if (!bansA?.length && !bansB?.length && !mode) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
      {mode && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-dim">Mode</span>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-bold text-ink">
            {mode}
          </span>
        </div>
      )}
      {(bansA?.length || bansB?.length) && (
        <div className="p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-dim">
            Héros bannis
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <p className="text-[11px] font-semibold text-faint">{teamA.tag}</p>
            <p className="text-[11px] font-semibold text-faint">{teamB.tag}</p>
            {Array.from({
              length: Math.max(bansA?.length ?? 0, bansB?.length ?? 0),
            }).map((_, i) => (
              <React.Fragment key={i}>
                <div>
                  {bansA?.[i] && <HeroBan name={bansA[i]} portraits={portraits} />}
                </div>
                <div>
                  {bansB?.[i] && <HeroBan name={bansB[i]} portraits={portraits} />}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
