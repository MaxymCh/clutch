import { Icon } from '../../components/ui/Icon';
import type { Prediction } from '../../types/community';
import type { Match } from '../../types/esports';
import { usePredictions } from './predictionsContext';

const computePoints = (prediction: Prediction, match: Match): number => {
  if (prediction.scoreA === match.scoreA && prediction.scoreB === match.scoreB) return 25;
  const winner = (match.scoreA ?? 0) > (match.scoreB ?? 0) ? 'a' : 'b';
  return prediction.pick === winner ? 10 : 0;
};

type PronoBadgeProps = {
  match: Match;
  onPredict?: (m: Match) => void;
};

export const PronoBadge = ({ match, onPredict }: PronoBadgeProps) => {
  const { predictions } = usePredictions();
  const pred = predictions[match.id];
  const done = match.status === 'done';

  if (pred) {
    const pickedName = pred.pick === 'a' ? match.teamA.name : match.teamB.name;
    const points = done ? computePoints(pred, match) : null;

    const badge = (
      <span className="inline-flex items-center gap-2 rounded-xl bg-accent/8 px-3 py-1.5">
        <Icon name="check" size={14} strokeWidth={2.4} className="text-accent" />
        <span className="text-[13px] font-bold text-accent">
          {pickedName} {pred.scoreA}–{pred.scoreB}
        </span>
        {points !== null && (
          <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
            +{points}
          </span>
        )}
      </span>
    );

    return (
      <div className="flex justify-center">
        {onPredict && !done ? (
          <button onClick={() => onPredict(match)} className="cursor-pointer transition-transform active:scale-95">
            {badge}
          </button>
        ) : (
          badge
        )}
      </div>
    );
  }

  if (done) {
    return <p className="text-center text-[11px] font-semibold text-dim">Pas de prono</p>;
  }

  if (!onPredict) return null;

  return (
    <div className="flex justify-center">
      <button
        onClick={() => onPredict(match)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12px] font-bold text-on-accent transition-transform active:scale-95"
      >
        <Icon name="trophy" size={14} strokeWidth={2.2} />
        Pronostiquer
      </button>
    </div>
  );
};
