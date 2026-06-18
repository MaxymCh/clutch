import { useState } from 'react';
import { Flag } from '../../components/ui/Flag';
import type { GameId, MapPlayer, MapScore, Team } from '../../types/esports';
import { type GamePlugin, getPlugin } from './games/index';

type StatCols = { acs: boolean; hs: boolean; adr: boolean; gpm: boolean; cs: boolean; nw: boolean };

const formatNw = (nw: number) => (nw >= 1000 ? `${(nw / 1000).toFixed(1)}K` : String(nw));

const detectStatCols = (players: MapPlayer[]): StatCols => {
  const hasAcs = players.some((p) => p.acs !== undefined);
  return {
    acs: hasAcs,
    hs: players.some((p) => p.hs !== undefined),
    adr: players.some((p) => p.adr !== undefined) && !hasAcs,
    gpm: players.some((p) => p.gpm !== undefined),
    cs: players.some((p) => p.lasthits !== undefined),
    nw: players.some((p) => p.networth !== undefined),
  };
};

const PlayerRow = ({
  player, isMvp, cols, plugin,
}: {
  player: MapPlayer; isMvp: boolean; cols: StatCols; plugin: GamePlugin | undefined;
}) => (
  <div className="grid grid-cols-[1fr_auto] items-center gap-2 py-1.5">
    <div className="flex min-w-0 items-center gap-2">
      {plugin?.PlayerIcon && <plugin.PlayerIcon player={player} size={22} />}
      <Flag countryCode={player.countryCode} size={12} className="shrink-0" />
      <span className="truncate text-[14px] font-semibold text-ink">{player.name}</span>
      {player.role && (
        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-dim uppercase">
          {player.role}
        </span>
      )}
      {isMvp && (
        <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-accent uppercase">
          MVP
        </span>
      )}
    </div>
    <div className="flex items-center gap-3">
      <span className="w-[64px] text-right text-[13px] font-semibold tabular-nums text-ink">
        {player.kills}
        <span className="text-faint">/</span>
        {player.deaths}
        <span className="text-faint">/</span>
        {player.assists}
      </span>
      {cols.acs && (
        <span className="w-[38px] text-right text-[13px] font-bold tabular-nums text-ink">
          {player.acs ?? '–'}
        </span>
      )}
      {cols.adr && (
        <span className="w-[44px] text-right text-[13px] font-bold tabular-nums text-ink">
          {player.adr !== undefined ? Math.round(player.adr) : '–'}
        </span>
      )}
      {cols.gpm && (
        <span className="w-[44px] text-right text-[13px] font-bold tabular-nums text-ink">
          {player.gpm !== undefined ? Math.round(player.gpm) : '–'}
        </span>
      )}
      {cols.cs && (
        <span className="w-[44px] text-right text-[13px] font-semibold tabular-nums text-dim">
          {player.lasthits !== undefined ? Math.round(player.lasthits) : '–'}
        </span>
      )}
      {cols.nw && (
        <span className="w-[50px] text-right text-[13px] font-semibold tabular-nums text-dim">
          {player.networth !== undefined ? formatNw(player.networth) : '–'}
        </span>
      )}
      {cols.hs && (
        <span className="w-[40px] text-right text-[12px] font-semibold tabular-nums text-dim">
          {player.hs !== undefined ? `${Math.round(player.hs)}%` : '–'}
        </span>
      )}
    </div>
  </div>
);

const TeamBoard = ({
  team, players, mvpKey, cols, plugin,
}: {
  team: Team; players: MapPlayer[]; mvpKey: string | null; cols: StatCols; plugin: GamePlugin | undefined;
}) => (
  <div>
    <div className="flex items-center justify-between border-b border-line pb-1.5">
      <span className="text-[12px] font-bold tracking-wide text-dim uppercase">{team.tag}</span>
      <span className="flex items-center gap-3 text-[10px] font-bold tracking-wide text-faint uppercase">
        <span className="w-[64px] text-right">K / D / A</span>
        {cols.acs && <span className="w-[38px] text-right">ACS</span>}
        {cols.adr && <span className="w-[44px] text-right">ADR</span>}
        {cols.gpm && <span className="w-[44px] text-right">GPM</span>}
        {cols.cs && <span className="w-[44px] text-right">CS</span>}
        {cols.nw && <span className="w-[50px] text-right">NW</span>}
        {cols.hs && <span className="w-[40px] text-right">HS%</span>}
      </span>
    </div>
    {players.map((player) => (
      <PlayerRow
        key={`${player.side}-${player.name}`}
        player={player}
        isMvp={`${player.side}-${player.name}` === mvpKey}
        cols={cols}
        plugin={plugin}
      />
    ))}
  </div>
);

type MapHeroProps = { map: MapScore; teamA: Team; teamB: Team; mapLabel: string };

/** Wrapper hook — résout l'image puis affiche la carte fusionnée image + score. */
const MapHeroCard = ({ plugin, map, teamA, teamB, mapLabel }: { plugin: GamePlugin } & MapHeroProps) => {
  const result = plugin.useMapImage!(map.name);
  const splash = result?.splash;
  if (!splash) return null;
  return (
    <div className="relative mt-3 h-28 overflow-hidden rounded-2xl">
      <img src={splash} alt={mapLabel} referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <span className="absolute left-3.5 top-3 text-[11px] font-bold uppercase tracking-widest text-white/50">{mapLabel}</span>
      {map.live && (
        <span className="animate-live-blink absolute right-3.5 top-3 text-[9px] font-extrabold tracking-wide text-accent uppercase">LIVE</span>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-3">
        <span className="text-[13px] font-bold text-white/80">{teamA.tag}</span>
        <div className="flex items-baseline gap-2">
          <span className={`text-[32px] font-black tabular-nums leading-none ${map.winner === 'a' ? 'text-white' : 'text-white/40'}`}>{map.scoreA ?? 0}</span>
          <span className="text-[16px] font-semibold text-white/30">–</span>
          <span className={`text-[32px] font-black tabular-nums leading-none ${map.winner === 'b' ? 'text-white' : 'text-white/40'}`}>{map.scoreB ?? 0}</span>
        </div>
        <span className="text-[13px] font-bold text-white/80">{teamB.tag}</span>
      </div>
    </div>
  );
};

/** Manches du match : onglets cliquables + scoreboard joueur réactif. */
export const MatchMaps = ({
  maps,
  teamA,
  teamB,
  gameId,
}: {
  maps: MapScore[];
  teamA: Team;
  teamB: Team;
  gameId: GameId;
}) => {
  const plugin = getPlugin(gameId);
  const unitLabel = plugin?.unitLabel ?? 'carte';
  const sectionTitle = unitLabel === 'carte' ? 'Cartes' : 'Parties';

  const liveIndex = maps.findIndex((m) => m.live);
  const [selected, setSelected] = useState(liveIndex >= 0 ? liveIndex : 0);
  const hasScoreboard = maps.some((m) => m.players && m.players.length > 0);

  const current = maps[selected];
  const players = current?.players ?? [];
  const teamAPlayers = players.filter((p) => p.side === 'a');
  const teamBPlayers = players.filter((p) => p.side === 'b');
  const cols = detectStatCols(players);

  const mvp = players.reduce<MapPlayer | null>((best, p) => {
    const score = (cur: MapPlayer) => cur.acs ?? cur.networth ?? cur.kills;
    return !best || score(p) > score(best) ? p : best;
  }, null);
  const mvpKey = mvp ? `${mvp.side}-${mvp.name}` : null;

  return (
    <section className="px-5 pt-5">
      <h2 className="mb-2 text-[13px] font-bold tracking-wide text-dim uppercase">{sectionTitle}</h2>

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {maps.map((map, i) => {
          const active = i === selected;
          return (
            <button
              key={map.name + i}
              type="button"
              onClick={() => setSelected(i)}
              className={[
                'flex shrink-0 flex-col items-start gap-0.5 rounded-[13px] border px-3.5 py-2 transition-colors',
                active
                  ? 'border-accent bg-accent/5'
                  : 'border-line bg-surface active:bg-surface-2',
              ].join(' ')}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-bold tracking-tight text-ink">
                {unitLabel === 'carte' ? map.name : `Partie ${i + 1}`}
                {map.live && (
                  <span className="animate-live-blink text-[9px] font-extrabold tracking-wide text-accent">
                    LIVE
                  </span>
                )}
              </span>
              <span className="text-[12px] font-semibold tabular-nums text-faint">
                <span className={map.winner === 'a' ? 'text-accent' : ''}>{map.scoreA ?? 0}</span>
                {' – '}
                <span className={map.winner === 'b' ? 'text-accent' : ''}>{map.scoreB ?? 0}</span>
              </span>
            </button>
          );
        })}
      </div>

      {plugin?.useMapImage && current && (
        <MapHeroCard plugin={plugin} map={current} teamA={teamA} teamB={teamB} mapLabel={unitLabel === 'carte' ? current.name : `Partie ${selected + 1}`} />
      )}

      {plugin?.MapDetail && current && (
        <plugin.MapDetail map={current} teamA={teamA} teamB={teamB} />
      )}

      {hasScoreboard && players.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2 sm:gap-6">
          <TeamBoard team={teamA} players={teamAPlayers} mvpKey={mvpKey} cols={cols} plugin={plugin} />
          <TeamBoard team={teamB} players={teamBPlayers} mvpKey={mvpKey} cols={cols} plugin={plugin} />
        </div>
      ) : (
        hasScoreboard && (
          <p className="mt-3 text-center text-[13px] font-medium text-dim">
            Statistiques joueurs indisponibles pour cette {unitLabel}.
          </p>
        )
      )}
    </section>
  );
};
