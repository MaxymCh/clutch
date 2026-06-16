import { useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { useTeam } from '../api/queries/useTeams';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchCard } from '../features/matches/MatchCard';
import { usePredictions } from '../features/prono/predictionsContext';
import { TeamHeader } from '../features/teams/TeamHeader';
import { TeamRoster } from '../features/teams/TeamRoster';
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

  const gameOf = (m: Match) => games?.find((g) => g.id === m.gameId);
  const section = (label: string, items: Match[]) =>
    items.length > 0 && (
      <section>
        <h2 className="pt-5 pb-2 text-[17px] leading-none font-semibold tracking-tight text-ink">
          {label}
        </h2>
        <div className="flex flex-col gap-3">
          {items.map((m) => {
            const g = gameOf(m);
            return (
              <MatchCard
                key={m.id}
                match={m}
                gameTag={g?.tag ?? m.gameId.toUpperCase()}
                gameLogoUrl={g?.logoUrl}
                predictedWinnerId={predictedWinnerId(m)}
              />
            );
          })}
        </div>
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
          <TeamRoster team={team} />
          <div className="px-5">
            {section('Prochains matchs', next)}
            {section('Résultats récents', done)}
          </div>
        </>
      )}
    </Page>
  );
};
