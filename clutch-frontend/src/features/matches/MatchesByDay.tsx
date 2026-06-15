import { useGames } from '../../api/queries/useGames';
import { formatDayFull } from '../../lib/date';
import type { Match } from '../../types/esports';
import { usePredictions } from '../prono/predictionsContext';
import { MatchCard } from './MatchCard';

/** Liste de matchs groupée par jour (détail d'un jeu, recherche…). */
export const MatchesByDay = ({ matches }: { matches: Match[] }) => {
  const { data: games } = useGames();
  const { predictedWinnerId } = usePredictions();

  const dates = [...new Set(matches.map((m) => m.date))].sort();
  const tagOf = (m: Match) => games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();

  return (
    <>
      {dates.map((date) => (
        <section key={date}>
          <h2 className="pt-4.5 pb-2 text-[17px] leading-none font-semibold tracking-tight text-ink">
            {formatDayFull(date)}
          </h2>
          {matches
            .filter((m) => m.date === date)
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                gameTag={tagOf(m)}
                predictedWinnerId={predictedWinnerId(m)}
              />
            ))}
        </section>
      ))}
    </>
  );
};
