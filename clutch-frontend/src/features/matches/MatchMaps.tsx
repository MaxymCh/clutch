import { useState } from 'react';
import { AgentIcon } from '../../components/ui/AgentIcon';
import { countryFlag } from '../../lib/flag';
import { useMapImages, valoSlug } from '../../lib/valorant';
import type { MapPlayer, MapScore, Team } from '../../types/esports';

/** Une ligne joueur du scoreboard : agent, drapeau, pseudo, MVP, K/D/A, ACS, HS%. */
const PlayerRow = ({
  player,
  isMvp,
  hasAcs,
  hasHs,
}: {
  player: MapPlayer;
  isMvp: boolean;
  hasAcs: boolean;
  hasHs: boolean;
}) => (
  <div className="grid grid-cols-[1fr_auto] items-center gap-2 py-1.5">
    <div className="flex min-w-0 items-center gap-2">
      {player.agent && <AgentIcon agent={player.agent} size={22} />}
      <span className="text-[12px] leading-none">{countryFlag(player.countryCode)}</span>
      <span className="truncate text-[14px] font-semibold text-ink">{player.name}</span>
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
      {hasAcs && (
        <span className="w-[38px] text-right text-[13px] font-bold tabular-nums text-ink">
          {player.acs ?? '–'}
        </span>
      )}
      {hasHs && (
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
  hasAcs,
  hasHs,
}: {
  team: Team;
  players: MapPlayer[];
  mvpKey: string | null;
  hasAcs: boolean;
  hasHs: boolean;
}) => (
  <div>
    <div className="flex items-center justify-between border-b border-line pb-1.5">
      <span className="text-[12px] font-bold tracking-wide text-dim uppercase">{team.tag}</span>
      <span className="flex items-center gap-3 text-[10px] font-bold tracking-wide text-faint uppercase">
        <span className="w-[64px] text-right">K / D / A</span>
        {hasAcs && <span className="w-[38px] text-right">ACS</span>}
        {hasHs && <span className="w-[40px] text-right">HS%</span>}
      </span>
    </div>
    {players.map((player) => (
      <PlayerRow
        key={`${player.side}-${player.name}`}
        player={player}
        isMvp={`${player.side}-${player.name}` === mvpKey}
        hasAcs={hasAcs}
        hasHs={hasHs}
      />
    ))}
  </div>
);

/** Cartes du match : onglets cliquables + scoreboard joueur réactif. */
export const MatchMaps = ({ maps, teamA, teamB }: { maps: MapScore[]; teamA: Team; teamB: Team }) => {
  // Carte sélectionnée par défaut : la carte en cours, sinon la première.
  const liveIndex = maps.findIndex((m) => m.live);
  const [selected, setSelected] = useState(liveIndex >= 0 ? liveIndex : 0);
  const hasScoreboard = maps.some((m) => m.players && m.players.length > 0);
  const { data: mapImages } = useMapImages();

  const current = maps[selected];
  const mapImage = current ? mapImages?.[valoSlug(current.name)]?.splash : undefined;
  const players = current?.players ?? [];
  const teamAPlayers = players.filter((p) => p.side === 'a');
  const teamBPlayers = players.filter((p) => p.side === 'b');
  const hasAcs = players.some((p) => p.acs !== undefined);
  const hasHs = players.some((p) => p.hs !== undefined);
  // MVP de la carte = meilleur ACS (sinon plus de kills), tous joueurs confondus.
  const mvp = players.reduce<MapPlayer | null>((best, p) => {
    const score = (cur: MapPlayer) => cur.acs ?? cur.kills;
    return !best || score(p) > score(best) ? p : best;
  }, null);
  const mvpKey = mvp ? `${mvp.side}-${mvp.name}` : null;

  return (
    <section className="px-5 pt-5">
      <h2 className="mb-2 text-[13px] font-bold tracking-wide text-dim uppercase">Cartes</h2>

      {/* Onglets : une carte = un bouton, scrollable horizontalement. */}
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
                {map.name}
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
          <TeamBoard team={teamA} players={teamAPlayers} mvpKey={mvpKey} hasAcs={hasAcs} hasHs={hasHs} />
          <TeamBoard team={teamB} players={teamBPlayers} mvpKey={mvpKey} hasAcs={hasAcs} hasHs={hasHs} />
        </div>
      ) : (
        hasScoreboard && (
          <p className="mt-3 text-center text-[13px] font-medium text-dim">
            Statistiques joueurs indisponibles pour cette carte.
          </p>
        )
      )}
    </section>
  );
};
