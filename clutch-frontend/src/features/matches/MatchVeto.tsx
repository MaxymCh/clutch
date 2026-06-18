import { TeamLogo } from '../../components/ui/TeamLogo';
import type { GameId, Team, VetoStep } from '../../types/esports';
import { type GamePlugin, getPlugin } from './games/index';

const ACTION_STYLE: Record<VetoStep['type'], string> = {
  ban:     'bg-red-500/15 text-red-500',
  pick:    'bg-emerald-500/15 text-emerald-600',
  decider: 'bg-surface-2 text-dim',
};
const ACTION_LABEL: Record<VetoStep['type'], string> = {
  ban: 'Ban', pick: 'Pick', decider: 'Decider',
};

/** Wrapper pour appeler useVetoImage (hook) de façon inconditionnelle. */
const VetoThumb = ({ plugin, mapName }: { plugin: GamePlugin; mapName: string }) => {
  const result = plugin.useVetoImage!(mapName);
  const src = result?.icon ?? result?.splash;
  if (!src) return <div className="size-full bg-surface-2" />;
  return (
    <img
      src={src}
      alt={mapName}
      referrerPolicy="no-referrer"
      className="size-full object-cover"
    />
  );
};

const Thumb = ({ plugin, mapName }: { plugin: GamePlugin | undefined; mapName: string }) =>
  plugin?.useVetoImage ? (
    <VetoThumb plugin={plugin} mapName={mapName} />
  ) : (
    <div className="size-full bg-surface-2" />
  );

/** Une action côté gauche (TeamA) : badge | nom | miniature */
const LeftStep = ({ step, plugin }: { step: VetoStep; plugin: GamePlugin | undefined }) => (
  <div className="flex items-center gap-2">
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${ACTION_STYLE[step.type]}`}>
      {ACTION_LABEL[step.type]}
    </span>
    <span className="flex-1 truncate text-right text-[13px] font-semibold text-ink">{step.map}</span>
    <div className="h-9 w-16 shrink-0 overflow-hidden rounded-lg">
      <Thumb plugin={plugin} mapName={step.map} />
    </div>
  </div>
);

/** Une action côté droit (TeamB) : miniature | nom | badge */
const RightStep = ({ step, plugin }: { step: VetoStep; plugin: GamePlugin | undefined }) => (
  <div className="flex items-center gap-2">
    <div className="h-9 w-16 shrink-0 overflow-hidden rounded-lg">
      <Thumb plugin={plugin} mapName={step.map} />
    </div>
    <span className="flex-1 truncate text-[13px] font-semibold text-ink">{step.map}</span>
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${ACTION_STYLE[step.type]}`}>
      {ACTION_LABEL[step.type]}
    </span>
  </div>
);

export const MatchVeto = ({
  veto,
  teamA,
  teamB,
  gameId,
}: {
  veto: VetoStep[];
  teamA: Team;
  teamB: Team;
  gameId: GameId;
}) => {
  const plugin = getPlugin(gameId);
  const sorted = [...veto].sort((a, b) => a.order - b.order);

  const stepsA    = sorted.filter((s) => s.team === 'a');
  const stepsB    = sorted.filter((s) => s.team === 'b');
  const deciders  = sorted.filter((s) => s.type === 'decider' && !s.team);
  const rowCount  = Math.max(stepsA.length, stepsB.length);

  return (
    <section className="px-5 pt-5">
      <h2 className="mb-2 text-[13px] font-bold tracking-wide text-dim uppercase">Veto des cartes</h2>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">

        {/* En-têtes équipes */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5">
            <TeamLogo tag={teamA.tag} size={20} logoUrl={teamA.logoUrl} />
            <span className="text-[13px] font-bold text-ink">{teamA.tag}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[13px] font-bold text-ink">{teamB.tag}</span>
            <TeamLogo tag={teamB.tag} size={20} logoUrl={teamB.logoUrl} />
          </div>
        </div>

        {/* Lignes bans / picks */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                {stepsA[i] && <LeftStep step={stepsA[i]} plugin={plugin} />}
              </div>
              <div>
                {stepsB[i] && <RightStep step={stepsB[i]} plugin={plugin} />}
              </div>
            </div>
          ))}
        </div>

        {/* Decider(s) */}
        {deciders.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            {deciders.map((step) => (
              <div key={step.order} className="flex items-center gap-2">
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${ACTION_STYLE.decider}`}>
                  Decider
                </span>
                <span className="flex-1 truncate text-center text-[13px] font-semibold text-dim">{step.map}</span>
                <div className="h-9 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Thumb plugin={plugin} mapName={step.map} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
