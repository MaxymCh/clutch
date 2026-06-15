import { TeamLogo } from '../../components/ui/TeamLogo';
import type { Match } from '../../types/esports';
import { usePredictions } from './predictionsContext';

/** Encart « Ton pronostic » sur le détail d'un match à venir. */
export const PredictionSummary = ({ match }: { match: Match }) => {
  const { predictions } = usePredictions();
  const pred = predictions[match.id];
  if (!pred || match.status !== 'upcoming') return null;

  const team = pred.pick === 'a' ? match.teamA : match.teamB;
  return (
    <div className="mx-5 mt-4 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-accent uppercase">Ton pronostic</span>
        <span className="text-xs font-semibold text-dim">+25 pts si score exact</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <TeamLogo tag={team.tag} size={26} solid />
        <span className="text-base font-bold text-ink">{team.name}</span>
        <span className="ml-auto text-base font-semibold tabular-nums text-dim">
          {pred.scoreA}–{pred.scoreB}
        </span>
      </div>
    </div>
  );
};
