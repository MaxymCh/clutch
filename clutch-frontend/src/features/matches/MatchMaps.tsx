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

/** Badge Radiant / Dire avec couleur. */
const SideBadge = ({ side }: { side: string }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
      side === 'radiant' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
    }`}
  >
    {side === 'radiant' ? 'Radiant' : 'Dire'}
  </span>
);

/** Draft d'une partie Dota 2 : picks + bans + durée. */
const DotaDraft = ({
  heroesA, heroesB, bansA, bansB, sideA, sideB, length, teamA, teamB,
}: {
  heroesA?: string[]; heroesB?: string[];
  bansA?: string[]; bansB?: string[];
  sideA?: string; sideB?: string;
  length?: string;
  teamA: Team; teamB: Team;
}) => {
  const hasPicks = (heroesA?.length ?? 0) > 0 || (heroesB?.length ?? 0) > 0;
  const hasBans = (bansA?.length ?? 0) > 0 || (bansB?.length ?? 0) > 0;
  if (!hasPicks && !hasBans) return null;

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      {/* Header : équipes + sides + durée */}
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

      {/* Picks */}
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

      {/* Bans */}
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

const SIDE_STYLE: Record<string, string> = {
  ct:  'bg-blue-500/15 text-blue-500',
  t:   'bg-yellow-500/15 text-yellow-600',
  atk: 'bg-orange-500/15 text-orange-500',
  def: 'bg-blue-500/15 text-blue-500',
};
const SIDE_LABEL: Record<string, string> = { ct: 'CT', t: 'T', atk: 'ATK', def: 'DEF' };
const halfLabel = (i: number) => (i === 0 ? '1re MT' : i === 1 ? '2e MT' : `OT ${i - 1}`);

/** Mi-temps avec côtés CT/T (CS2) ou ATK/DEF (R6) — commun aux deux jeux. */
const HalfBreakdown = ({
  halvesA, halvesB, teamA, teamB, vod,
}: {
  halvesA?: { side: string; score: number }[];
  halvesB?: { side: string; score: number }[];
  teamA: Team; teamB: Team; vod?: string;
}) => {
  const count = Math.max(halvesA?.length ?? 0, halvesB?.length ?? 0);
  if (count === 0) return null;

  const sideBadge = (side: string) => (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SIDE_STYLE[side] ?? 'bg-surface-2 text-dim'}`}>
      {SIDE_LABEL[side] ?? side}
    </span>
  );

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold text-ink">{teamA.tag}</span>
        {vod ? (
          <a href={vod} target="_blank" rel="noopener noreferrer"
             className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-500 hover:opacity-80">
            VOD
          </a>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Mi-temps</span>
        )}
        <span className="text-[12px] font-bold text-ink">{teamB.tag}</span>
      </div>
      {Array.from({ length: count }).map((_, i) => {
        const hA = halvesA?.[i];
        const hB = halvesB?.[i];
        return (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className="flex flex-1 items-center justify-end gap-2">
              {hA && sideBadge(hA.side)}
              <span className="w-6 text-right text-[17px] font-bold tabular-nums text-ink">{hA?.score ?? 0}</span>
            </div>
            <span className="w-14 text-center text-[10px] font-semibold text-faint">{halfLabel(i)}</span>
            <div className="flex flex-1 items-center gap-2">
              <span className="w-6 text-left text-[17px] font-bold tabular-nums text-ink">{hB?.score ?? 0}</span>
              {hB && sideBadge(hB.side)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Badge phase ATK/DEF pour les bans R6. */
const r6PhaseBadge = (type: string) => (
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
  <div className={`flex flex-1 flex-col gap-1.5 ${align === 'right' ? 'items-end' : ''}`}>
    {bans.map((ban, i) => (
      <div key={i} className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {r6PhaseBadge(ban.type)}
        <span className="text-[12px] font-medium text-ink">{ban.name}</span>
      </div>
    ))}
  </div>
);

/** Bans d'opérateurs Rainbow Six Siege avec phase ATK/DEF. */
const R6OperatorBans = ({
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
          <p className="mb-1.5 text-[11px] font-bold text-dim">{teamA.tag}</p>
          <R6BanList bans={opBansA ?? []} align="left" />
        </div>
        <div className="w-px self-stretch bg-line" />
        <div className="flex-1">
          <p className="mb-1.5 text-right text-[11px] font-bold text-dim">{teamB.tag}</p>
          <R6BanList bans={opBansB ?? []} align="right" />
        </div>
      </div>
    </div>
  );
};

/** Dispatch vers le composant de détail spécifique au jeu. */
const GameMapDetail = ({
  map, teamA, teamB, gameId,
}: {
  map: MapScore; teamA: Team; teamB: Team; gameId: GameId;
}) => {
  switch (gameId) {
    case 'dota':
      return (
        <DotaDraft
          heroesA={map.heroesA} heroesB={map.heroesB}
          bansA={map.bansA} bansB={map.bansB}
          sideA={map.sideA} sideB={map.sideB}
          length={map.length}
          teamA={teamA} teamB={teamB}
        />
      );
    case 'cs2':
      return <HalfBreakdown halvesA={map.halvesA} halvesB={map.halvesB} teamA={teamA} teamB={teamB} vod={map.vod} />;
    case 'r6':
      return (
        <>
          <HalfBreakdown halvesA={map.halvesA} halvesB={map.halvesB} teamA={teamA} teamB={teamB} vod={map.vod} />
          <R6OperatorBans opBansA={map.opBansA} opBansB={map.opBansB} teamA={teamA} teamB={teamB} />
        </>
      );
    default:
      return null;
  }
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

      {/* Détail spécifique au jeu (draft Dota, mi-temps CS2/R6, bans R6…) */}
      {current && <GameMapDetail map={current} teamA={teamA} teamB={teamB} gameId={gameId} />}

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
