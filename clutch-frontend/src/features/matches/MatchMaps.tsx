import { useState } from 'react';
import { Flag } from '../../components/ui/Flag';
import type { BRStanding, GameId, MapPlayer, MapScore, Team } from '../../types/esports';
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
        {player.kills}<span className="text-faint">/</span>{player.deaths}<span className="text-faint">/</span>{player.assists}
      </span>
      {cols.acs && <span className="w-[38px] text-right text-[13px] font-bold tabular-nums text-ink">{player.acs ?? '–'}</span>}
      {cols.adr && <span className="w-[44px] text-right text-[13px] font-bold tabular-nums text-ink">{player.adr !== undefined ? Math.round(player.adr) : '–'}</span>}
      {cols.gpm && <span className="w-[44px] text-right text-[13px] font-bold tabular-nums text-ink">{player.gpm !== undefined ? Math.round(player.gpm) : '–'}</span>}
      {cols.cs && <span className="w-[44px] text-right text-[13px] font-semibold tabular-nums text-dim">{player.lasthits !== undefined ? Math.round(player.lasthits) : '–'}</span>}
      {cols.nw && <span className="w-[50px] text-right text-[13px] font-semibold tabular-nums text-dim">{player.networth !== undefined ? formatNw(player.networth) : '–'}</span>}
      {cols.hs && <span className="w-[40px] text-right text-[12px] font-semibold tabular-nums text-dim">{player.hs !== undefined ? `${Math.round(player.hs)}%` : '–'}</span>}
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

/** Onglet miniature avec image — wrapper hook pour respecter la règle des hooks. */
const MapTabCard = ({
  plugin, map, label, active, onClick,
}: {
  plugin: GamePlugin; map: MapScore; label: string; active: boolean; onClick: () => void;
}) => {
  const result = plugin.useMapImage!(map.name);
  const splash = result?.splash;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex h-[68px] w-[104px] shrink-0 flex-col justify-end overflow-hidden rounded-[14px] border transition-all',
        active ? 'border-accent shadow-md' : 'border-line opacity-60 hover:opacity-80',
      ].join(' ')}
    >
      {splash
        ? <img src={splash} alt={label} referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
        : <div className="absolute inset-0 bg-surface-2" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {active && <div className="absolute inset-0 rounded-[13px] ring-2 ring-inset ring-accent" />}
      <div className="relative px-2 pb-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[10px] font-bold leading-tight text-white">{label}</span>
          {map.live && <span className="animate-live-blink text-[8px] font-extrabold text-accent">LIVE</span>}
        </div>
        <div className="text-[11px] font-bold tabular-nums">
          <span className={map.winner === 'a' ? 'text-white' : 'text-white/45'}>{map.scoreA ?? 0}</span>
          <span className="text-white/25"> – </span>
          <span className={map.winner === 'b' ? 'text-white' : 'text-white/45'}>{map.scoreB ?? 0}</span>
        </div>
      </div>
    </button>
  );
};

/** Hero card cinématique : gradient latéral, équipes sur les côtés, score au centre. */
const MapHeroCard = ({
  plugin, map, teamA, teamB, mapLabel,
}: {
  plugin: GamePlugin; map: MapScore; teamA: Team; teamB: Team; mapLabel: string;
}) => {
  const result = plugin.useMapImage!(map.name);
  const splash = result?.splash;
  if (!splash) return null;
  return (
    <div className="relative mt-3 h-36 w-full overflow-hidden rounded-2xl sm:h-44">
      <img src={splash} alt={mapLabel} referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
      {/* Gradients latéraux */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/5 to-black/90" />
      {/* Léger gradient haut pour lisibilité du nom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Nom de la carte — centré en haut */}
      <span className="absolute left-0 right-0 top-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/50">
        {mapLabel}
      </span>
      {map.live && (
        <span className="animate-live-blink absolute right-3.5 top-3 text-[9px] font-extrabold tracking-wide text-accent uppercase">
          LIVE
        </span>
      )}

      {/* Équipe A — gauche */}
      <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-1">
        <span className="text-[16px] font-black text-white">{teamA.tag}</span>
        {map.winner === 'a' && (
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-400">Victoire</span>
        )}
        {map.winner === 'b' && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-white/30">Défaite</span>
        )}
      </div>

      {/* Score — centré */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-baseline gap-3">
          <span className={`text-[44px] font-black tabular-nums leading-none ${map.winner === 'a' ? 'text-white' : 'text-white/35'}`}>
            {map.scoreA ?? 0}
          </span>
          <span className="text-[22px] font-light text-white/20">–</span>
          <span className={`text-[44px] font-black tabular-nums leading-none ${map.winner === 'b' ? 'text-white' : 'text-white/35'}`}>
            {map.scoreB ?? 0}
          </span>
        </div>
      </div>

      {/* Équipe B — droite */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-end gap-1">
        <span className="text-[16px] font-black text-white">{teamB.tag}</span>
        {map.winner === 'b' && (
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-400">Victoire</span>
        )}
        {map.winner === 'a' && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-white/30">Défaite</span>
        )}
      </div>
    </div>
  );
};

/** Manches du match : onglets cliquables + scoreboard joueur réactif. */
export const MatchMaps = ({
  maps, teamA, teamB, gameId, standings,
}: {
  maps: MapScore[];
  teamA: Team;
  teamB: Team;
  gameId: GameId;
  standings?: BRStanding[];
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

  const getLabel = (map: MapScore, i: number) =>
    unitLabel === 'carte' ? map.name : `Partie ${i + 1}`;

  return (
    <section className="px-5 pt-5">
      <h2 className="mb-2 text-[13px] font-bold tracking-wide text-dim uppercase">{sectionTitle}</h2>

      {/* BR : classement général de la série */}
      {plugin?.OverallDetail && standings && standings.length > 0 && (
        <plugin.OverallDetail standings={standings} teamA={teamA} teamB={teamB} />
      )}

      {/* Onglets */}
      <div className="scrollbar-none -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {maps.map((map, i) =>
          plugin?.useMapImage ? (
            <MapTabCard
              key={map.name + i}
              plugin={plugin}
              map={map}
              label={getLabel(map, i)}
              active={i === selected}
              onClick={() => setSelected(i)}
            />
          ) : (
            <button
              key={map.name + i}
              type="button"
              onClick={() => setSelected(i)}
              className={[
                'flex shrink-0 flex-col items-start gap-0.5 rounded-[13px] border px-3.5 py-2 transition-colors',
                i === selected ? 'border-accent bg-accent/5' : 'border-line bg-surface active:bg-surface-2',
              ].join(' ')}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-bold tracking-tight text-ink">
                {getLabel(map, i)}
                {map.live && <span className="animate-live-blink text-[9px] font-extrabold tracking-wide text-accent">LIVE</span>}
              </span>
              <span className="text-[12px] font-semibold tabular-nums text-faint">
                <span className={map.winner === 'a' ? 'text-accent' : ''}>{map.scoreA ?? 0}</span>
                {' – '}
                <span className={map.winner === 'b' ? 'text-accent' : ''}>{map.scoreB ?? 0}</span>
              </span>
            </button>
          )
        )}
      </div>

      {/* Hero card */}
      {plugin?.useMapImage && current && (
        <MapHeroCard plugin={plugin} map={current} teamA={teamA} teamB={teamB} mapLabel={getLabel(current, selected)} />
      )}

      {/* Détail spécifique au jeu */}
      {plugin?.MapDetail && current && (
        <plugin.MapDetail map={current} teamA={teamA} teamB={teamB} />
      )}

      {/* Scoreboard */}
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
