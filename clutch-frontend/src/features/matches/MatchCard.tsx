import { type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import type { Match, Team } from '../../types/esports';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { formatDayMonth, formatWeekdayShort } from '../../lib/date';
import { StatusPill } from './StatusPill';
import { usePredictions } from '../prono/predictionsContext';
import type { Prediction } from '../../types/community';

type MatchCardProps = {
  match: Match;
  /** Tag du jeu à afficher ("VAL", "CS2"…) */
  gameTag: string;
  /** Affiche le jour du match (listes multi-jours : page équipe) */
  showDay?: boolean;
  /** Id de l'équipe pronostiquée gagnante (badge PRONO), si prono posé */
  predictedWinnerId?: string | null;
  /** Affiche le mini-encart prono sous la carte (agenda) */
  showPredictionFooter?: boolean;
  /** Ouvre la feuille de pronostic depuis la carte */
  onPredict?: (match: Match) => void;
};

const computePoints = (prediction: Prediction, match: Match): number => {
  if (prediction.scoreA === match.scoreA && prediction.scoreB === match.scoreB) return 25;
  const winner = (match.scoreA ?? 0) > (match.scoreB ?? 0) ? 'a' : 'b';
  return prediction.pick === winner ? 10 : 0;
};

/** Ligne équipe : logo, nom (tronqué), score ou "vs". */
const TeamLine = ({
  team,
  score,
  match,
  isFirst,
  predicted,
}: {
  team: Team;
  score?: number;
  match: Match;
  isFirst: boolean;
  predicted?: boolean;
}) => {
  const done = match.status === 'done';
  const showScore = match.status === 'live' || done;
  const won = done && score !== undefined && score === Math.max(match.scoreA ?? 0, match.scoreB ?? 0);
  return (
    <div className="flex items-center gap-2.5 py-1">
      <TeamLogo tag={team.tag} size={22} />
      <span
        className={`min-w-0 flex-1 truncate text-[16px] leading-tight tracking-tight ${
          done && !won ? 'font-medium text-dim' : won ? 'font-bold text-ink' : 'font-medium text-ink'
        }`}
      >
        {team.name}
      </span>
      {predicted && !done && (
        <span
          title="Ton prono"
          className="rounded-[5px] border border-accent/40 px-1 py-0.5 text-[8.5px] font-extrabold tracking-[.06em] text-accent"
        >
          PRONO
        </span>
      )}
      {showScore ? (
        <span
          className={`min-w-3.5 text-right text-lg font-semibold tabular-nums ${
            done && !won ? 'text-faint' : 'text-ink'
          }`}
        >
          {score}
        </span>
      ) : (
        isFirst && <span className="text-xs font-medium text-faint">vs</span>
      )}
    </div>
  );
};

/**
 * Carte de match (style Pulse) : colonne heure/statut, équipes, chevron.
 * Trois états : à venir, en direct (barre + heure orange), terminé (score).
 */
export const MatchCard = ({
  match,
  gameTag,
  showDay = false,
  predictedWinnerId = null,
  showPredictionFooter = false,
  onPredict,
}: MatchCardProps) => {
  const { predictions } = usePredictions();
  const live = match.status === 'live';
  const pred = predictions[match.id];
  const showFooter = showPredictionFooter && (pred || (match.status === 'upcoming' && onPredict));
  const points = match.status === 'done' && pred ? computePoints(pred, match) : null;
  const pickedTeam = pred ? (pred.pick === 'a' ? match.teamA : match.teamB) : null;

  const predictClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onPredict?.(match);
  };

  return (
    <div className={`border-b border-line py-3.5 pr-1 ${live ? 'pl-3.5' : 'pl-1'}`}>
      <div className="relative grid grid-cols-[58px_1fr_auto] items-center gap-3 transition-colors active:bg-surface-2">
        {/* barre latérale orange = signal live */}
        {live && <span className="absolute top-0 bottom-0 left-0 w-[3px] rounded-full bg-live" />}

        {/* colonne heure / statut */}
        <Link to={`/match/${match.id}`} className="contents">
          <div className="flex flex-col gap-1.5">
            <span
              className={`text-xl leading-none font-medium tracking-tight tabular-nums ${
                live ? 'text-live' : match.status === 'done' ? 'text-dim' : 'text-ink'
              }`}
            >
              {match.time}
            </span>
            <StatusPill match={match} />
          </div>

          {/* contenu : méta + équipes */}
          <div className="min-w-0 py-0.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-[.06em] uppercase">{gameTag}</span>
              <span className="size-[3px] rounded-full bg-faint" />
              <span className="truncate text-[11px] font-semibold tracking-wide text-dim uppercase">
                {match.phase}
              </span>
              {showDay && (
                <span className="ml-auto whitespace-nowrap text-[10px] font-semibold text-faint">
                  {formatWeekdayShort(match.date)} {formatDayMonth(match.date)}
                </span>
              )}
            </div>
            <TeamLine
              team={match.teamA}
              score={match.scoreA}
              match={match}
              isFirst
              predicted={predictedWinnerId === match.teamA.id}
            />
            <TeamLine
              team={match.teamB}
              score={match.scoreB}
              match={match}
              isFirst={false}
              predicted={predictedWinnerId === match.teamB.id}
            />
            {live && match.currentMapLabel && (
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-accent">
                {match.currentMapLabel}
                {match.viewers && (
                  <span className="font-medium text-faint">· {match.viewers} spect.</span>
                )}
              </div>
            )}
          </div>

          <Icon name="chevron" size={16} strokeWidth={2} className="text-faint" />
        </Link>
      </div>

      {showFooter && (
        <div className="ml-[58px] mt-2.5 flex items-center gap-2.5">
          {pred && pickedTeam ? (
            <div className="min-w-0 flex-1 rounded-2xl bg-surface-2 px-3 py-2">
              <div className="text-[10px] font-bold tracking-[.1em] text-dim uppercase">
                {match.status === 'done' ? 'Ton prono terminé' : 'Ton prono'}
              </div>
              <div className="mt-0.5 truncate text-[13px] font-bold text-ink">
                {pickedTeam.tag} {pred.scoreA}–{pred.scoreB}
              </div>
              {match.status === 'done' && points !== null && (
                <div className="mt-0.5 text-[11px] font-semibold text-accent">
                  +{points} pts gagnés
                </div>
              )}
            </div>
          ) : match.status === 'done' ? (
            <div className="min-w-0 flex-1 rounded-2xl bg-surface-2 px-3 py-2 text-[12px] font-semibold text-dim">
              Pas de prono posé
            </div>
          ) : (
            <Button size="sm" variant="soft" onClick={predictClick} className="ml-auto">
              <Icon name="trophy" size={15} strokeWidth={2.2} />
              Pronostiquer
            </Button>
          )}

          {pred && match.status === 'upcoming' && onPredict && (
            <Button size="sm" variant="ghost" onClick={predictClick}>
              Modifier
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
