import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { Seg } from '../components/ui/Seg';
import { TeamLogo } from '../components/ui/TeamLogo';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchesByDay } from '../features/matches/MatchesByDay';
import type { Team } from '../types/esports';

type Tab = 'upcoming' | 'results' | 'teams';

/** Détail d'un jeu : /game/:id — image hero, onglets À venir / Résultats / Équipes. */
export const GamePage = () => {
  const { id = '' } = useParams();
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();
  const [tab, setTab] = useState<Tab>('upcoming');

  const game = games?.find((g) => g.id === id);
  const list = (matches ?? []).filter((m) => m.gameId === id);

  // Extraire les équipes uniques
  const teamsMap = new Map<string, Team>();
  list.forEach((m) => {
    if (!teamsMap.has(m.teamA.id)) teamsMap.set(m.teamA.id, m.teamA);
    if (!teamsMap.has(m.teamB.id)) teamsMap.set(m.teamB.id, m.teamB);
  });
  const teams = [...teamsMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const upcoming = list.filter((m) => m.status === 'upcoming' || m.status === 'live');
  const done = list.filter((m) => m.status === 'done');

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
          <div className="relative h-36 overflow-hidden">
            {game.bgUrl ? (
              <img src={game.bgUrl} alt={game.name} className="size-full object-cover" />
            ) : (
              <div className="size-full bg-ink/10" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-md">{game.name}</h1>
              <p className="mt-1 text-[11px] font-medium text-white/75">
                {teams.length} équipes · {list.length} match{list.length > 1 ? 's' : ''} · EWC 2026
              </p>
            </div>
          </div>

          {/* Tabs — 3 onglets */}
          <div className="px-5 pt-4 pb-3">
            <Seg
              full
              value={tab}
              onChange={setTab}
              options={[
                { value: 'upcoming', label: `À venir (${upcoming.length})` },
                { value: 'results', label: `Résultats (${done.length})` },
                { value: 'teams', label: `Équipes (${teams.length})` },
              ]}
            />
          </div>

          <div className="h-px bg-line" />

          {/* À venir */}
          {tab === 'upcoming' && (
            <div className="px-5 pb-6">
              {upcoming.length === 0 ? (
                <p className="py-10 text-center text-sm font-medium text-dim">
                  Aucun match à venir pour le moment.
                </p>
              ) : (
                <MatchesByDay matches={upcoming} />
              )}
            </div>
          )}

          {/* Résultats */}
          {tab === 'results' && (
            <div className="px-5 pb-6">
              {done.length === 0 ? (
                <p className="py-10 text-center text-sm font-medium text-dim">
                  Aucun résultat pour le moment.
                </p>
              ) : (
                <MatchesByDay matches={done} />
              )}
            </div>
          )}

          {/* Équipes */}
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
