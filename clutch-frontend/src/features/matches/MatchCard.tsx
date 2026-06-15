import { Link } from 'react-router-dom';
import type { Match, Team } from '../../types/esports';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { formatDayMonth, formatWeekdayShort } from '../../lib/date';
import { StatusPill } from './StatusPill';

type MatchCardProps = {
  match: Match;
  /** Tag du jeu à afficher ("VAL", "CS2"…) */
  gameTag: string;
  /** Affiche le jour du match (listes multi-jours : page équipe) */
  showDay?: boolean;
  /** Id de l'équipe pronostiquée gagnante (badge PRONO), si prono posé */
  predictedWinnerId?: string | null;
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
}: MatchCardProps) => {
  const live = match.status === 'live';
  return (
    <Link
      to={`/match/${match.id}`}
      className={`relative grid grid-cols-[58px_1fr_auto] items-center gap-3 border-b border-line py-3.5 pr-1 transition-colors active:bg-surface-2 ${
        live ? 'pl-3.5' : 'pl-1'
      }`}
    >
      {/* barre latérale orange = signal live */}
      {live && <span className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-live" />}

      {/* colonne heure / statut */}
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
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[.06em] uppercase">{gameTag}</span>
          <span className="size-[3px] rounded-full bg-faint" />
          <span className="truncate text-[11px] font-semibold tracking-wide text-dim uppercase">
            {match.phase}
          </span>
          {showDay && (
            <span className="ml-auto text-[10px] font-semibold whitespace-nowrap text-faint">
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
  );
};
