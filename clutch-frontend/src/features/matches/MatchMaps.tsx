import { useState } from 'react';
import { AgentIcon } from '../../components/ui/AgentIcon';
import { ChampionIcon } from '../../components/ui/ChampionIcon';
import { Flag } from '../../components/ui/Flag';
import { HeroIcon } from '../../components/ui/HeroIcon';
import { useMapImages, valoSlug } from '../../lib/valorant';
import type { GameId, MapPlayer, MapScore, Team } from '../../types/esports';

/** Jeux où chaque manche est une PARTIE sur la même arène (pas une carte
 *  différente comme à Valorant/CS2) : League of Legends, Dota 2. */
const GAME_BASED: GameId[] = ['lol', 'dota'];

/** Colonnes de stats selon le jeu : ACS/HS (Valorant), ADR (CS2),
 *  GPM/CS/net worth (Dota 2). */
type StatCols = { acs: boolean; hs: boolean; adr: boolean; gpm: boolean; cs: boolean; nw: boolean };

/** Net worth Dota → format compact ("41.7K"). */
const formatNw = (nw: number) => (nw >= 1000 ? `${(nw / 1000).toFixed(1)}K` : String(nw));

/** Une ligne joueur du scoreboard : pick (agent/champion/héros), drapeau, pseudo, rôle, MVP, K/D/A, stats. */
const PlayerRow = ({ player, isMvp, cols }: { player: MapPlayer; isMvp: boolean; cols: StatCols }) => (
  <div className="grid grid-cols-[1fr_auto] items-center gap-2 py-1.5">
    <div className="flex min-w-0 items-center gap-2">
      {player.agent && <AgentIcon agent={player.agent} size={22} />}
      {player.champion && <ChampionIcon champion={player.champion} size={22} />}
      {player.hero && <HeroIcon hero={player.hero} size={22} />}
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

/** Bloc scoreboard d'une équipe pour la carte sélectionnée. */
const TeamBoard = ({
  team,
  players,
  mvpKey,
  cols,
}: {
  team: Team;
  players: MapPlayer[];
  mvpKey: string | null;
  cols: StatCols;
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
      />
    ))}
  </div>
);

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
  // LoL/Dota : on parle de « parties » (même arène), sinon de « cartes ».
  const mapBased = !GAME_BASED.includes(gameId);
  const sectionTitle = mapBased ? 'Cartes' : 'Parties';
  const unitLabel = mapBased ? 'carte' : 'partie';

  // Manche sélectionnée par défaut : celle en cours, sinon la première.
  const liveIndex = maps.findIndex((m) => m.live);
  const [selected, setSelected] = useState(liveIndex >= 0 ? liveIndex : 0);
  const hasScoreboard = maps.some((m) => m.players && m.players.length > 0);
  const { data: mapImages } = useMapImages();

  const current = maps[selected];
  // Visuel de carte uniquement pour les jeux à cartes nommées (Valorant).
  const mapImage = mapBased && current ? mapImages?.[valoSlug(current.name)]?.splash : undefined;
  const players = current?.players ?? [];
  const teamAPlayers = players.filter((p) => p.side === 'a');
  const teamBPlayers = players.filter((p) => p.side === 'b');
  const hasAcs = players.some((p) => p.acs !== undefined);
  const hasHs = players.some((p) => p.hs !== undefined);
  // ADR affiché quand il n'y a pas d'ACS (CS2), pour ne pas surcharger Valorant.
  const hasAdr = players.some((p) => p.adr !== undefined) && !hasAcs;
  const cols: StatCols = {
    acs: hasAcs,
    hs: hasHs,
    adr: hasAdr,
    gpm: players.some((p) => p.gpm !== undefined),
    cs: players.some((p) => p.lasthits !== undefined),
    nw: players.some((p) => p.networth !== undefined),
  };
  // MVP de la carte = meilleur ACS, sinon net worth (Dota), sinon plus de kills.
  const mvp = players.reduce<MapPlayer | null>((best, p) => {
    const score = (cur: MapPlayer) => cur.acs ?? cur.networth ?? cur.kills;
    return !best || score(p) > score(best) ? p : best;
  }, null);
  const mvpKey = mvp ? `${mvp.side}-${mvp.name}` : null;

  return (
    <section className="px-5 pt-5">
      <h2 className="mb-2 text-[13px] font-bold tracking-wide text-dim uppercase">{sectionTitle}</h2>

      {/* Onglets : une manche = un bouton, scrollable horizontalement. */}
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
                {mapBased ? map.name : `Partie ${i + 1}`}
                {map.live && (
                  <span className="animate-live-blink text-[9px] font-extrabold tracking-wide text-accent">
                    LIVE
                  </span>
                )}
              </span>
              <span className="text-[12px] font-semibold tabular-nums">
                <span className={map.winner === 'a' ? 'text-accent' : 'text-dim'}>{map.scoreA}</span>
                <span className="text-faint"> – </span>
                <span className={map.winner === 'b' ? 'text-accent' : 'text-dim'}>{map.scoreB}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Bannière visuelle de la carte sélectionnée (Valorant). */}
      {mapImage && (
        <div className="relative mt-3 h-24 overflow-hidden rounded-2xl">
          <img
            src={mapImage}
            alt={current.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <span className="absolute bottom-2.5 left-3.5 text-[18px] font-bold tracking-tight text-white drop-shadow">
            {current.name}
          </span>
        </div>
      )}

      {/* Scoreboard de la carte sélectionnée (si dispo pour ce jeu).
          Empilé sur mobile, équipe A à gauche / équipe B à droite sur desktop. */}
      {hasScoreboard && players.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2 sm:gap-6">
          <TeamBoard team={teamA} players={teamAPlayers} mvpKey={mvpKey} cols={cols} />
          <TeamBoard team={teamB} players={teamBPlayers} mvpKey={mvpKey} cols={cols} />
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
