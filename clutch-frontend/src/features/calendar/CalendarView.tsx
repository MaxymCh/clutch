import { useMemo } from 'react';
import { useGames } from '../../api/queries/useGames';
import { useMatches } from '../../api/queries/useMatches';
import { PageSpinner } from '../../components/ui/Spinner';
import type { Match } from '../../types/esports';
import { FilterBar } from '../filters/FilterBar';
import { useMatchFilters } from '../filters/useMatchFilters';
import { MatchCard } from '../matches/MatchCard';
import { usePredictions } from '../prono/predictionsContext';
import { ALL_DAYS, DayTabs, type DayInfo } from './DayTabs';
import { MatchSection } from './MatchSection';

// Tri date+heure : nécessaire en vue « Tous » (équivaut au tri horaire sur un seul jour)
const byDateTime = (a: Match, b: Match) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

/** Vue calendrier : onglets jours + filtres (URL) + matchs groupés par statut. */
export const CalendarView = () => {
  const { data: matches, isPending, isError } = useMatches();
  const { data: games } = useGames();
  const { game, team, day, setFilter } = useMatchFilters();
  const { predictedWinnerId } = usePredictions();

  // Jours du tournoi dérivés des données (avec compteur de matchs live)
  const days = useMemo<DayInfo[]>(() => {
    const dates = [...new Set((matches ?? []).map((m) => m.date))].sort();
    return dates.map((date) => ({
      date,
      liveCount: (matches ?? []).filter((m) => m.date === date && m.status === 'live').length,
    }));
  }, [matches]);

  if (isPending) return <PageSpinner />;
  if (isError || days.length === 0)
    return (
      <p className="px-5 py-16 text-center text-sm font-medium text-dim">
        Impossible de charger le calendrier. Réessaie plus tard.
      </p>
    );

  // Jour sélectionné : « Tous » (URL ?day=all) → URL → jour avec du live → premier
  const fallbackDay = days.find((d) => d.liveCount > 0)?.date ?? days[0].date;
  const allDays = day === ALL_DAYS;
  const selectedDay = allDays
    ? ALL_DAYS
    : days.some((d) => d.date === day)
      ? (day as string)
      : fallbackDay;

  let list = allDays ? [...matches] : matches.filter((m) => m.date === selectedDay);
  if (game) list = list.filter((m) => m.gameId === game);
  if (team) list = list.filter((m) => m.teamA.id === team || m.teamB.id === team);

  const live = list.filter((m) => m.status === 'live').sort(byDateTime);
  const upcoming = list.filter((m) => m.status === 'upcoming').sort(byDateTime);
  const done = list.filter((m) => m.status === 'done').sort(byDateTime);

  const tagOf = (m: Match) => games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();
  const renderCards = (items: Match[]) =>
    items.map((m) => (
      <MatchCard
        key={m.id}
        match={m}
        gameTag={tagOf(m)}
        showDay={allDays}
        predictedWinnerId={predictedWinnerId(m)}
      />
    ));

  return (
    <div>
      <DayTabs withAll days={days} value={selectedDay} onChange={(d) => setFilter('day', d)} />
      <div className="h-3.5" />
      <FilterBar />
      <div className="mt-3.5 h-0.5 bg-line" />

      <div className="px-5">
        {list.length === 0 && (
          <p className="px-5 py-14 text-center text-sm leading-relaxed font-medium text-dim">
            {allDays
              ? 'Aucun match ne correspond à ces filtres.'
              : 'Aucun match ne correspond à ces filtres ce jour-là.'}
            <br />
            Essaie un autre jeu ou une autre équipe.
          </p>
        )}
        {live.length > 0 && (
          <MatchSection label="En direct" count={live.length} accent>
            {renderCards(live)}
          </MatchSection>
        )}
        {upcoming.length > 0 && (
          <MatchSection label="À venir" count={upcoming.length}>
            {renderCards(upcoming)}
          </MatchSection>
        )}
        {done.length > 0 && (
          <MatchSection label="Terminés" count={done.length}>
            {renderCards(done)}
          </MatchSection>
        )}
      </div>
    </div>
  );
};
