import { Link } from 'react-router-dom';
import { Badge, LiveBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { formatDayFull } from '../../lib/date';
import type { Match, Team } from '../../types/esports';

type MatchHeroProps = {
  match: Match;
  gameName: string;
  /** true si l'utilisateur a déjà posé un prono sur ce match */
  hasPrediction?: boolean;
  /** Ouvre la feuille de pronostic (matchs à venir) */
  onPredict?: () => void;
};

/** Colonne équipe : monogramme, nom, grand score — cliquable vers la page équipe. */
const Side = ({ team, score, won, done }: { team: Team; score?: number; won: boolean; done: boolean }) => (
  <Link
    to={`/team/${team.id}`}
    className="flex flex-1 flex-col items-center gap-2.5 transition-transform active:scale-[.97]"
  >
    <TeamLogo tag={team.tag} size={62} logoUrl={team.logoUrl} />
    <span className="text-center text-[15px] leading-tight font-bold tracking-tight text-ink">
      {team.name}
    </span>
    {score !== undefined && (
      <span
        className={`text-[44px] leading-none font-medium tracking-tighter tabular-nums ${
          won ? 'text-accent' : done ? 'text-dim' : 'text-ink'
        }`}
      >
        {score}
      </span>
    )}
  </Link>
);

/** Hero du détail de match : méta, statut, face-à-face, action principale. */
export const MatchHero = ({ match, gameName, hasPrediction = false, onPredict }: MatchHeroProps) => {
  const live = match.status === 'live';
  const done = match.status === 'done';
  const aWon = done && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWon = done && (match.scoreB ?? 0) > (match.scoreA ?? 0);

  return (
    <div className="flex flex-col items-center gap-3.5 border-b border-line px-5 pt-3 pb-6">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-dim uppercase">
        {gameName}
        <span className="size-[3px] rounded-full bg-faint" />
        {match.phase}
        <span className="size-[3px] rounded-full bg-faint" />
        {match.bestOf}
      </div>

      {live && <LiveBadge />}
      {match.status === 'upcoming' && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-dim">
          <Icon name="clock" size={13} />
          {formatDayFull(match.date)} · {match.time}
        </span>
      )}
      {done && <Badge variant="neutral">Score final</Badge>}

      <div className="flex w-full items-start gap-1.5">
        <Side team={match.teamA} score={match.scoreA} won={live ? false : aWon} done={done} />
        <span
          className={`self-center text-[15px] font-medium text-faint ${
            live || done ? 'pt-14' : 'pt-6'
          }`}
        >
          {live || done ? '—' : 'vs'}
        </span>
        <Side team={match.teamB} score={match.scoreB} won={live ? false : bWon} done={done} />
      </div>

      {live && match.currentMapLabel && (
        <div className="flex items-center gap-3.5 text-xs font-semibold text-dim">
          <span className="text-accent">{match.currentMapLabel}</span>
          {match.viewers && (
            <span className="flex items-center gap-1">
              <Icon name="user" size={13} />
              {match.viewers}
            </span>
          )}
        </div>
      )}

      {live && (
        <Button full className="mt-1">
          <Icon name="bolt" size={17} strokeWidth={2.1} />
          Regarder le live
        </Button>
      )}
      {match.status === 'upcoming' && onPredict && (
        <Button full variant={hasPrediction ? 'soft' : 'primary'} className="mt-1" onClick={onPredict}>
          <Icon name={hasPrediction ? 'check' : 'trophy'} size={17} strokeWidth={2.1} />
          {hasPrediction ? 'Modifier mon prono' : 'Pronostiquer'}
        </Button>
      )}
      {done && (
        <Button full variant="ghost" className="mt-1">
          <Icon name="trend" size={17} strokeWidth={2.1} />
          Voir les statistiques
        </Button>
      )}
    </div>
  );
};
