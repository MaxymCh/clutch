import { useMemo, useState } from 'react';
import { useGames } from '../../api/queries/useGames';
import { useMatches } from '../../api/queries/useMatches';
import { PageSpinner } from '../../components/ui/Spinner';
import type { Match } from '../../types/esports';
import { FilterBar } from '../filters/FilterBar';
import { useMatchFilters } from '../filters/useMatchFilters';
import { MatchCard } from '../matches/MatchCard';
import { PredictSheet } from '../prono/PredictSheet';
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
  const [predicting, setPredicting] = useState<Match | null>(null);

  // Jours du tournoi dérivés des données, limités aux dates qui ont encore
  // au moins un match non passé (live / upcoming).
  const days = useMemo<DayInfo[]>(() => {
    const dates = [...new Set((matches ?? []).map((m) => m.date))].sort();
    return dates.map((date) => ({
      date,
      liveCount: (matches ?? []).filter((m) => m.date === date && m.status === 'live').length,
    }));
  }, [matches]);
  const activeDays = useMemo(() => {
    return days.filter((dayInfo) =>
      (matches ?? []).some((match) => match.date === dayInfo.date && match.status !== 'done'),
    );
  }, [days, matches]);

  if (isPending) return <PageSpinner />;
  if (isError || days.length === 0)
    return (
      <p className="px-5 py-16 text-center text-sm font-medium text-dim">
        Impossible de charger le calendrier. Réessaie plus tard.
      </p>
    );
  if (activeDays.length === 0)
    return (
      <p className="px-5 py-16 text-center text-sm font-medium text-dim">
        Aucun jour de match à venir pour le moment.
      </p>
    );

  const hasUnplayedMatches = (date: string) =>
    (matches ?? []).some((m) => m.date === date && m.status !== 'done');
  // Jour sélectionné : « Tous » (URL ?day=all) → URL valide non totalement jouée →
  // premier jour avec au moins un match non terminé → premier jour du tournoi.
  const fallbackDay = activeDays[0]?.date ?? days.find((d) => hasUnplayedMatches(d.date))?.date ?? days[0].date;
  const allDays = day === ALL_DAYS;
  const selectedDay = allDays
    ? ALL_DAYS
    : activeDays.some((d) => d.date === day) && hasUnplayedMatches(day ?? '')
      ? (day as string)
      : fallbackDay;

  let list = allDays ? [...matches] : matches.filter((m) => m.date === selectedDay);
  if (game) list = list.filter((m) => m.gameId === game);
  if (team) list = list.filter((m) => m.teamA.id === team || m.teamB.id === team);

  const live = list.filter((m) => m.status === 'live').sort(byDateTime);
  const upcoming = list.filter((m) => m.status === 'upcoming').sort(byDateTime);
  const done = list.filter((m) => m.status === 'done').sort(byDateTime);

  const gameOf = (m: Match) => games?.find((g) => g.id === m.gameId);
  const renderCards = (items: Match[]) =>
    items.map((m) => {
      const g = gameOf(m);
      return (
        <MatchCard
          key={m.id}
          match={m}
          gameTag={g?.tag ?? m.gameId.toUpperCase()}
          gameLogoUrl={g?.logoUrl}
          showDay={allDays}
          predictedWinnerId={predictedWinnerId(m)}
          showPredictionFooter
          onPredict={setPredicting}
        />
      );
    });

  return (
    <div>
      <DayTabs withAll days={activeDays} value={selectedDay} onChange={(d) => setFilter('day', d)} />
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

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </div>
  );
};
