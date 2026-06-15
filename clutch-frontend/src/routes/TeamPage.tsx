import { useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { useTeam } from '../api/queries/useTeams';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { PageSpinner } from '../components/ui/Spinner';
import { countryFlag } from '../lib/flag';
import { MatchCard } from '../features/matches/MatchCard';
import { usePredictions } from '../features/prono/predictionsContext';
import { TeamHeader } from '../features/teams/TeamHeader';
import type { Match } from '../types/esports';

const byDateTime = (a: Match, b: Match) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

/** Page d'une équipe : /team/:id — prochains matchs + résultats récents. */
export const TeamPage = () => {
  const { id = '' } = useParams();
  const { data: team, isPending, isError } = useTeam(id);
  const { data: matches } = useMatches();
  const { data: games } = useGames();
  const { predictedWinnerId } = usePredictions();

  const list = (matches ?? []).filter((m) => m.teamA.id === id || m.teamB.id === id);
  const done = list.filter((m) => m.status === 'done').sort(byDateTime).reverse();
  const next = list.filter((m) => m.status !== 'done').sort(byDateTime);
  const wins = done.filter((m) =>
    m.teamA.id === id ? (m.scoreA ?? 0) > (m.scoreB ?? 0) : (m.scoreB ?? 0) > (m.scoreA ?? 0),
  ).length;

  const tagOf = (m: Match) => games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();
  const section = (label: string, items: Match[]) =>
    items.length > 0 && (
      <section>
        <h2 className="pt-5 pb-2 text-[17px] leading-none font-semibold tracking-tight text-ink">
          {label}
        </h2>
        {items.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            gameTag={tagOf(m)}
            showDay
            predictedWinnerId={predictedWinnerId(m)}
          />
        ))}
      </section>
    );

  return (
    <Page>
      <TopBar title={team?.name ?? 'Équipe'} />
      {isPending && <PageSpinner />}
      {isError && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">Équipe introuvable.</p>
      )}
      {team && (
        <>
          <TeamHeader
            team={team}
            stats={{ wins, played: done.length, upcoming: next.length }}
          />
          <div className="px-5">
            {team.players && team.players.length > 0 && (
              <section>
                <h2 className="pt-5 pb-3 text-[17px] leading-none font-semibold tracking-tight text-ink">
                  Roster
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3 py-2.5"
                    >
                      <PlayerAvatar name={player.name} size={40} logoUrl={player.logoUrl} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold leading-tight text-ink">
                          {player.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-dim">
                          {countryFlag(player.countryCode)}
                          {player.role ? ` · ${player.role}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {section('Prochains matchs', next)}
            {section('Résultats récents', done)}
          </div>
        </>
      )}
    </Page>
  );
};
