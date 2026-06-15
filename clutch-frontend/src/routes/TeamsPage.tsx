import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { useTeams } from '../api/queries/useTeams';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { PageSpinner } from '../components/ui/Spinner';
import { TeamLogo } from '../components/ui/TeamLogo';
import { countryFlag } from '../lib/flag';
import { useFavorites } from '../features/favorites/favoritesContext';

/** Page dédiée aux équipes : recherche, filtre par jeu et suivi facile. */
export const TeamsPage = () => {
  const { data: teams, isPending: teamsPending } = useTeams();
  const { data: matches, isPending: matchesPending } = useMatches();
  const { data: games } = useGames();
  const { teams: favTeams, toggleTeam } = useFavorites();
  const [q, setQ] = useState('');
  const [game, setGame] = useState<'all' | string>('all');

  const activeGames = useMemo(() => {
    if (!matches) return new Set<string>();
    if (game !== 'all') return new Set(matches.filter((m) => m.gameId === game).flatMap((m) => [m.teamA.id, m.teamB.id]));
    return new Set(matches.flatMap((m) => [m.teamA.id, m.teamB.id]));
  }, [matches, game]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (teams ?? [])
      .filter((team) => (game === 'all' ? true : activeGames.has(team.id)))
      .filter(
        (team) =>
          needle === '' || team.name.toLowerCase().includes(needle) || team.tag.toLowerCase().includes(needle),
      )
      .sort((a, b) => Number(favTeams.includes(b.id)) - Number(favTeams.includes(a.id)) || a.name.localeCompare(b.name));
  }, [teams, q, game, activeGames, favTeams]);

  return (
    <Page>
      <TopBar title="Équipes" />
      <div className="px-5 pt-3 pb-4">
        <p className="text-[13px] font-medium text-dim">Filtre par jeu et suis les équipes plus vite.</p>
      </div>

      <div className="px-5">
        <div className="mb-4 flex items-center gap-2.5 rounded-[14px] bg-surface-2 px-3.5 py-3">
          <Icon name="search" size={19} className="text-dim" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Équipe, tag…"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-faint"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Effacer" className="grid cursor-pointer text-dim">
              <Icon name="close" size={17} />
            </button>
          )}
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setGame('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
              game === 'all' ? 'border-ink bg-ink text-surface' : 'border-line-2 text-dim'
            }`}
          >
            Tous les jeux
          </button>
          {(games ?? []).map((g) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
                game === g.id ? 'border-ink bg-ink text-surface' : 'border-line-2 text-dim'
              }`}
            >
              {g.short}
            </button>
          ))}
        </div>
      </div>

      {(teamsPending || matchesPending) && <PageSpinner />}

      <div className="flex flex-col gap-3 px-5 pb-6 pt-2">
        {filtered.length === 0 && !(teamsPending || matchesPending) ? (
          <p className="py-10 text-center text-sm font-medium text-dim">Aucune équipe ne correspond.</p>
        ) : (
          filtered.map((team) => {
            const following = favTeams.includes(team.id);
            return (
              <div key={team.id} className="flex items-center gap-3 rounded-3xl border border-line-2 bg-surface p-3.5">
                <Link to={`/team/${team.id}`} className="flex flex-1 items-center gap-3">
                  <TeamLogo tag={team.tag} size={40} logoUrl={team.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-ink">{team.name}</div>
                    <div className="mt-0.5 text-[12px] font-semibold text-dim">
                      {team.tag} · {countryFlag(team.countryCode)}
                    </div>
                  </div>
                </Link>
                <Button
                  variant={following ? 'soft' : 'dark'}
                  size="sm"
                  onClick={() => toggleTeam(team.id)}
                  className="shrink-0"
                >
                  <Icon name={following ? 'check' : 'plus'} size={15} strokeWidth={2.2} />
                  {following ? 'Suivie' : 'Suivre'}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Page>
  );
};