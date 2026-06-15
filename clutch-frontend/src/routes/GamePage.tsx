import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { TeamLogo } from '../components/ui/TeamLogo';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchesByDay } from '../features/matches/MatchesByDay';
import type { Team } from '../types/esports';

type Tab = 'matches' | 'teams';

/** Détail d'un jeu : /game/:id — image hero, équipes, résultats. */
export const GamePage = () => {
  const { id = '' } = useParams();
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();
  const [tab, setTab] = useState<Tab>('matches');

  const game = games?.find((g) => g.id === id);
  const list = (matches ?? []).filter((m) => m.gameId === id);

  // Extraire les équipes uniques qui participent à ce jeu
  const teamsMap = new Map<string, Team>();
  list.forEach((m) => {
    if (!teamsMap.has(m.teamA.id)) teamsMap.set(m.teamA.id, m.teamA);
    if (!teamsMap.has(m.teamB.id)) teamsMap.set(m.teamB.id, m.teamB);
  });
  const teams = [...teamsMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const upcoming = list.filter((m) => m.status === 'upcoming');
  const done = list.filter((m) => m.status === 'done');
  const live = list.filter((m) => m.status === 'live');

  return (
    <Page>
      <TopBar title={game?.name ?? 'Jeu'} />
      {isPending && <PageSpinner />}
      {!isPending && !game && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">Jeu introuvable.</p>
      )}
      {game && (
        <>
          {/* Hero image */}
          <div className="relative h-40 overflow-hidden">
            {game.bgUrl ? (
              <img src={game.bgUrl} alt={game.name} className="size-full object-cover" />
            ) : (
              <div className="size-full bg-ink/10" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-surface via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-md">{game.name}</h1>
              <p className="mt-1 text-xs font-medium text-white/75">
                {teams.length} équipes · {list.length} match{list.length > 1 ? 's' : ''} · EWC 2026
              </p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 border-b border-line px-5 py-4">
            <div className="text-center">
              <span className="text-lg font-bold text-ink">{live.length}</span>
              <p className="text-[10px] font-semibold text-dim uppercase">En direct</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-ink">{upcoming.length}</span>
              <p className="text-[10px] font-semibold text-dim uppercase">À venir</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-ink">{done.length}</span>
              <p className="text-[10px] font-semibold text-dim uppercase">Terminés</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-line px-5">
            {(['matches', 'teams'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`cursor-pointer border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors ${
                  tab === t
                    ? 'border-accent text-accent'
                    : 'border-transparent text-dim'
                }`}
              >
                {t === 'matches' ? `Matchs (${list.length})` : `Équipes (${teams.length})`}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'matches' && (
            <div className="px-5 pb-6">
              <MatchesByDay matches={list} />
            </div>
          )}

          {tab === 'teams' && (
            <div className="grid grid-cols-2 gap-3 px-5 pt-4 pb-6 sm:grid-cols-3">
              {teams.map((team) => {
                const wins = done.filter(
                  (m) =>
                    (m.teamA.id === team.id && (m.scoreA ?? 0) > (m.scoreB ?? 0)) ||
                    (m.teamB.id === team.id && (m.scoreB ?? 0) > (m.scoreA ?? 0))
                ).length;
                const losses = done.filter(
                  (m) =>
                    (m.teamA.id === team.id && (m.scoreA ?? 0) < (m.scoreB ?? 0)) ||
                    (m.teamB.id === team.id && (m.scoreB ?? 0) < (m.scoreA ?? 0))
                ).length;

                return (
                  <Link
                    key={team.id}
                    to={`/team/${team.id}`}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface-2 p-4 transition-transform active:scale-[.97]"
                  >
                    <TeamLogo tag={team.tag} size={40} logoUrl={team.logoUrl} />
                    <span className="max-w-full truncate text-center text-sm font-bold text-ink">
                      {team.name}
                    </span>
                    <span className="text-[11px] font-semibold text-dim">
                      {wins}V – {losses}D
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </Page>
  );
};
