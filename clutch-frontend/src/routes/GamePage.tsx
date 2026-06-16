import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { GameBrand } from '../components/ui/GameBrand';
import { Icon } from '../components/ui/Icon';
import { LiveDot } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchesByDay } from '../features/matches/MatchesByDay';
import { useState } from 'react';

type Tab = 'upcoming' | 'results' | 'teams';

/** Détail d'un jeu : hero brandé + matchs groupés par jour. */
export const GamePage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: games, isPending } = useGames();
  const { data: matches } = useMatches();
  const [tab] = useState<Tab>('upcoming');

  const game = games?.find((g) => g.id === id);
  const list = (matches ?? []).filter((m) => m.gameId === id);
  const liveCount = list.filter((m) => m.status === 'live').length;

  return (
    <Page>
      {isPending && <PageSpinner />}
      {!isPending && !game && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">Jeu introuvable.</p>
      )}
      {game && (
        <>
          <div className="relative aspect-[2.2/1] w-full overflow-hidden sm:aspect-[2.6/1]">
            {game.bgUrl ? (
              <img src={game.bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-ink" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="absolute top-4 left-4 z-10 grid size-9 cursor-pointer place-items-center rounded-[11px] bg-black/45 text-white backdrop-blur-sm transition-transform active:scale-95"
            >
              <Icon name="back" size={19} />
            </button>

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2.5 px-5 pb-5 pt-8">
              <GameBrand
                tag={game.tag}
                logoUrl={game.logoUrl}
                fullLogoUrl={game.fullLogoUrl}
                size="lg"
              />
              <div className="text-center">
                <h1 className="text-[22px] leading-none font-bold tracking-tight text-white drop-shadow-sm">
                  {game.name}
                </h1>
                <p className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-white/75">
                  {liveCount > 0 && (
                    <>
                      <LiveDot size={7} />
                      <span className="text-accent">{liveCount} en direct</span>
                      <span className="text-white/40">·</span>
                    </>
                  )}
                  {list.length} match{list.length > 1 ? 's' : ''} · EWC 2026
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-4">
            <MatchesByDay matches={list} />
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
