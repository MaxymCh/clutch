import { Link } from 'react-router-dom';
import { useGames } from '../../api/queries/useGames';
import { useMatches } from '../../api/queries/useMatches';
import { useTeams } from '../../api/queries/useTeams';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { countryFlag } from '../../lib/flag';
import type { Match } from '../../types/esports';
import { MatchCard } from '../matches/MatchCard';
import { usePredictions } from '../prono/predictionsContext';

type SearchResultsProps = { q: string; status: string; game: string };

const SectionTitle = ({ children }: { children: string }) => (
  <h2 className="mt-5 mb-1 text-[11px] font-bold tracking-[.1em] text-dim uppercase">{children}</h2>
);

/** Résultats de recherche : équipes correspondantes + matchs filtrés. */
export const SearchResults = ({ q, status, game }: SearchResultsProps) => {
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const { data: games } = useGames();
  const { predictedWinnerId } = usePredictions();

  const active = q.trim() !== '' || status !== 'all' || game !== 'all';
  const s = q.trim().toLowerCase();

  if (!active) {
    return (
      <div>
        <SectionTitle>Équipes populaires</SectionTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {(teams ?? []).map((t) => (
            <Link
              key={t.id}
              to={`/team/${t.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface py-1 pr-3.5 pl-1 transition-transform active:scale-95"
            >
              <TeamLogo tag={t.tag} size={22} logoUrl={t.logoUrl} />
              <span className="text-[13px] font-semibold text-ink">{t.name}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const teamHits = s
    ? (teams ?? [])
        .filter((t) => t.name.toLowerCase().includes(s) || t.tag.toLowerCase().includes(s))
        .slice(0, 5)
    : [];

  let list = matches ?? [];
  if (status !== 'all') list = list.filter((m) => m.status === status);
  if (game !== 'all') list = list.filter((m) => m.gameId === game);
  if (s) {
    list = list.filter(
      (m) =>
        m.teamA.name.toLowerCase().includes(s) ||
        m.teamB.name.toLowerCase().includes(s) ||
        (games?.find((g) => g.id === m.gameId)?.name.toLowerCase().includes(s) ?? false),
    );
  }
  const gameOf = (m: Match) => games?.find((g) => g.id === m.gameId);

  return (
    <div>
      {teamHits.length > 0 && (
        <>
          <SectionTitle>Équipes</SectionTitle>
          {teamHits.map((t) => (
            <Link
              key={t.id}
              to={`/team/${t.id}`}
              className="flex w-full items-center gap-3 border-b border-line px-1 py-2.5 transition-colors active:bg-surface-2"
            >
              <TeamLogo tag={t.tag} size={34} logoUrl={t.logoUrl} />
              <span className="flex-1 text-[15px] font-semibold text-ink">{t.name}</span>
              <span className="text-[13px]">{countryFlag(t.countryCode)}</span>
              <Icon name="chevron" size={15} className="text-faint" />
            </Link>
          ))}
        </>
      )}
      <SectionTitle>{`${list.length} match${list.length > 1 ? 's' : ''}`}</SectionTitle>
      {list.length === 0 ? (
        <EmptyState title="Aucun résultat" sub="Modifie ta recherche ou tes filtres." />
      ) : (
        list.map((m) => {
          const g = gameOf(m);
          return (
            <MatchCard
              key={m.id}
              match={m}
              gameTag={g?.tag ?? m.gameId.toUpperCase()}
              gameLogoUrl={g?.logoUrl}
              showDay
              predictedWinnerId={predictedWinnerId(m)}
            />
          );
        })
      )}
    </div>
  );
};
