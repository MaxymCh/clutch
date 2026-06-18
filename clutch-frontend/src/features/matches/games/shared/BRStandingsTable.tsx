import type { BRStanding } from '../../../../types/esports';
import { TeamLogo } from '../../../../components/ui/TeamLogo';

export const BRStandingsTable = ({
  standings,
  title,
}: {
  standings: BRStanding[];
  title?: string;
}) => {
  if (!standings?.length) return null;
  const hasDetail = standings.some((s) => s.killPoints > 0 || s.placementPoints > 0);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-dim">
          {title ?? 'Classement'}
        </span>
        {hasDetail && (
          <span className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-faint">
            <span className="w-6 text-right">K</span>
            <span className="w-6 text-right">P</span>
            <span className="w-8 text-right">Pts</span>
          </span>
        )}
        {!hasDetail && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-faint">Pts</span>
        )}
      </div>
      <div className="divide-y divide-line">
        {standings.map((team) => (
          <div
            key={`${team.name}-${team.placement}`}
            className="flex items-center gap-3 px-4 py-2"
          >
            <span
              className={`w-4 shrink-0 text-center text-[12px] font-black tabular-nums ${
                team.placement === 1
                  ? 'text-accent'
                  : team.placement <= 3
                    ? 'text-ink'
                    : 'text-dim'
              }`}
            >
              {team.placement}
            </span>
            <TeamLogo tag={team.tag} size={22} logoUrl={team.logoUrl} />
            <span className="flex-1 truncate text-[13px] font-semibold text-ink">
              {team.name}
            </span>
            {hasDetail && (
              <div className="flex shrink-0 gap-3 text-[12px] tabular-nums text-faint">
                <span className="w-6 text-right">{team.killPoints}</span>
                <span className="w-6 text-right">{team.placementPoints}</span>
              </div>
            )}
            <span
              className={`w-8 shrink-0 text-right text-[13px] font-bold tabular-nums ${
                team.placement === 1 ? 'text-accent' : 'text-ink'
              }`}
            >
              {team.totalPoints}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
