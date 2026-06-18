import { OperatorIcon } from '../../../../components/ui/OperatorIcon';
import type { Team } from '../../../../types/esports';

const PhaseBadge = ({ type }: { type: string }) => (
  <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase ${
    type === 'atk' ? 'bg-orange-500/15 text-orange-500' : 'bg-blue-500/15 text-blue-500'
  }`}>
    {type}
  </span>
);

const R6BanList = ({
  bans,
  align,
}: {
  bans: { name: string; type: string }[];
  align: 'left' | 'right';
}) => (
  <div className={`flex flex-1 flex-col gap-2 ${align === 'right' ? 'items-end' : ''}`}>
    {bans.map((ban, i) => (
      <div key={i} className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <OperatorIcon name={ban.name} size={28} />
        <span className="truncate text-[12px] font-semibold text-ink">{ban.name}</span>
        <PhaseBadge type={ban.type} />
      </div>
    ))}
  </div>
);

/** Bans d'opérateurs Rainbow Six Siege avec icône, nom et phase ATK/DEF. */
export const R6OperatorBans = ({
  opBansA, opBansB, teamA, teamB,
}: {
  opBansA?: { name: string; type: string }[];
  opBansB?: { name: string; type: string }[];
  teamA: Team; teamB: Team;
}) => {
  if (!opBansA?.length && !opBansB?.length) return null;

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-faint">Bans opérateurs</p>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="mb-2 text-[11px] font-bold text-dim">{teamA.tag}</p>
          <R6BanList bans={opBansA ?? []} align="left" />
        </div>
        <div className="w-px self-stretch bg-line" />
        <div className="flex-1">
          <p className="mb-2 text-right text-[11px] font-bold text-dim">{teamB.tag}</p>
          <R6BanList bans={opBansB ?? []} align="right" />
        </div>
      </div>
    </div>
  );
};
