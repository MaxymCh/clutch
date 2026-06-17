import { useMemo, useState } from "react";
import { useGames } from "../../api/queries/useGames";
import { useMatches } from "../../api/queries/useMatches";
import { PageSpinner } from "../../components/ui/Spinner";
import type { Match } from "../../types/esports";
import { FilterBar } from "../filters/FilterBar";
import { useMatchFilters } from "../filters/useMatchFilters";
import { MatchCard } from "../matches/MatchCard";
import { PredictSheet } from "../prono/PredictSheet";
import { usePredictions } from "../prono/predictionsContext";
import { canPredictMatch } from "../../lib/date";
import { ALL_DAYS, DayTabs, type DayInfo } from "./DayTabs";
import { MatchSection } from "./MatchSection";

// Tri date+heure : nécessaire en vue « Tous » (équivaut au tri horaire sur un seul jour)
const byDateTime = (a: Match, b: Match) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

/** Vue calendrier : onglets jours + filtres (URL) + matchs groupés par statut. */
export const CalendarView = () => {
  const { data: matches, isPending, isError } = useMatches();
  const { data: games } = useGames();
  const {
    games: filterGames,
    teams: filterTeams,
    day,
    setFilter,
  } = useMatchFilters();
  const { predictedWinnerId } = usePredictions();
  const [predicting, setPredicting] = useState<Match | null>(null);

  // Jours du tournoi dérivés des données, limités aux dates qui ont encore
  // au moins un match non passé (live / upcoming).
  const days = useMemo<DayInfo[]>(() => {
    const matchDates = [...new Set((matches ?? []).map((m) => m.date))].sort();
    if (matchDates.length === 0) return [];
    // Générer toutes les dates entre le premier et le dernier match
    const result: DayInfo[] = [];
    const cursor = new Date(`${matchDates[0]}T00:00:00`);
    const last = new Date(`${matchDates[matchDates.length - 1]}T00:00:00`);
    while (cursor <= last) {
      const date = cursor.toISOString().slice(0, 10);
      result.push({
        date,
        liveCount: (matches ?? []).filter(
          (m) => m.date === date && m.status === "live",
        ).length,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [matches]);
  const activeDays = useMemo(() => {
    return days.filter((dayInfo) =>
      (matches ?? []).some(
        (match) => match.date === dayInfo.date && match.status !== "done",
      ),
    );
  }, [days, matches]);

  // Prochain match global (indépendant du jour sélectionné et des filtres)
  const globalNextMatch = useMemo(() => {
    return (
      [...(matches ?? [])]
        .filter((m) => canPredictMatch(m))
        .sort(byDateTime)[0] ?? null
    );
  }, [matches]);

  if (isPending) return <PageSpinner />;
  if (isError || days.length === 0)
    return (
      <p className="px-5 py-16 text-center text-sm font-medium text-dim">
        Impossible de charger le calendrier. Réessaie plus tard.
      </p>
    );
  // Jour sélectionné : par défaut le premier jour avec des matchs actifs,
  // ou le dernier jour du tournoi si tout est terminé.
  const fallbackDay =
    activeDays[0]?.date ?? days[days.length - 1]?.date ?? days[0].date;
  const allDays = day === ALL_DAYS;
  const selectedDay = allDays
    ? ALL_DAYS
    : days.some((d) => d.date === day)
      ? (day as string)
      : fallbackDay;

  let list = allDays
    ? matches.filter((m) => m.status !== "done")
    : matches.filter((m) => m.date === selectedDay);
  if (filterGames.length > 0)
    list = list.filter((m) => filterGames.includes(m.gameId));
  if (filterTeams.length > 0)
    list = list.filter(
      (m) =>
        filterTeams.includes(m.teamA.id) || filterTeams.includes(m.teamB.id),
    );

  const live = list.filter((m) => m.status === "live").sort(byDateTime);
  const upcoming = list.filter((m) => canPredictMatch(m)).sort(byDateTime);
  const done = list.filter((m) => m.status === "done").sort(byDateTime);

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
          predictedWinnerId={predictedWinnerId(m)}
          showPredictionFooter
          onPredict={canPredictMatch(m) ? setPredicting : undefined}
        />
      );
    });

  return (
    <div className="lg:flex lg:gap-0">
      {/* Sidebar filtres — visible en colonne fixe à gauche sur desktop */}
      <aside className="hidden shrink-0 lg:block lg:w-72 lg:border-r lg:border-line lg:px-4 lg:pt-2">
        <FilterBar />
      </aside>

      {/* Contenu principal : dates + matchs */}
      <div className="min-w-0 flex-1">
        <DayTabs
          withAll
          days={days}
          value={selectedDay}
          onChange={(d) => setFilter("day", d)}
        />
        <div className="h-px bg-line" />

        {/* Countdown prochain match — toujours le prochain global */}
        {globalNextMatch && (
          <div className="flex items-center justify-end px-5 mt-3">
          
            <span className="text-xs font-semibold text-dim">
              {list.length} matchs
            </span>
          </div>
        )}

        {/* Filtres inline mobile uniquement */}
        <div className="lg:hidden">
          <FilterBar />
          <div className="mt-4 h-px bg-line" />
        </div>

        <div className="px-5">
          {list.length === 0 && (
            <p className="py-14 text-center text-sm leading-relaxed font-medium text-dim">
              {allDays
                ? "Aucun match ne correspond à ces filtres."
                : "Aucun match ne correspond à ces filtres ce jour-là."}
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

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </div>
  );
};
