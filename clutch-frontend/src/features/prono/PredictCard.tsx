import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { formatDayMonth, formatWeekdayShort } from '../../lib/date';
import type { Match } from '../../types/esports';
import { usePredictions } from './predictionsContext';

type PredictCardProps = {
  match: Match;
  gameTag: string;
  onPredict: (match: Match) => void;
};

/** Carte compacte « à pronostiquer » (liste de l'écran Prono). */
export const PredictCard = ({ match, gameTag, onPredict }: PredictCardProps) => {
  const { predictions } = usePredictions();
  const pred = predictions[match.id];
  const pickedTeam = pred ? (pred.pick === 'a' ? match.teamA : match.teamB) : null;

  return (
    <Card className="p-3.5">
      <div className="mb-3 flex items-center gap-2 text-[10.5px] font-semibold tracking-wide text-dim uppercase">
        {gameTag}
        <span className="size-[3px] rounded-full bg-faint" />
        {match.phase}
        <span className="ml-auto text-faint">
          {formatWeekdayShort(match.date)} {formatDayMonth(match.date)} · {match.time}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <TeamLogo tag={match.teamA.tag} size={26} logoUrl={match.teamA.logoUrl} />
        <span className="min-w-0 flex-1 truncate text-sm leading-tight font-bold text-ink">
          {match.teamA.name}
        </span>
        <span className="text-xs font-medium text-faint">vs</span>
        <span className="min-w-0 flex-1 truncate text-right text-sm leading-tight font-bold text-ink">
          {match.teamB.name}
        </span>
        <TeamLogo tag={match.teamB.tag} size={26} logoUrl={match.teamB.logoUrl} />
      </div>
      <div className="mt-3">
        {pred && pickedTeam ? (
          <button
            onClick={() => onPredict(match)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-accent/35 bg-accent/5 py-2.5 text-[13px] font-bold text-accent transition-transform active:scale-[.97]"
          >
            <Icon name="check" size={15} strokeWidth={2.2} />
            Prono : {pickedTeam.tag} {pred.scoreA}–{pred.scoreB} · modifier
          </button>
        ) : (
          <Button full size="sm" onClick={() => onPredict(match)}>
            <Icon name="trophy" size={15} strokeWidth={2.1} />
            Pronostiquer
          </Button>
        )}
      </div>
    </Card>
  );
};
