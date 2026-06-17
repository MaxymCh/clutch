import { Link } from 'react-router-dom';
import { Badge, LiveBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { GameLogo } from '../../components/ui/GameLogo';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { formatDayFull, isMatchLive, phaseMetaLabel } from '../../lib/date';
import type { Match, Player, Team } from '../../types/esports';

type MatchHeroProps = {
  match: Match;
  gameName: string;
  gameLogoUrl?: string;
  hasPrediction?: boolean;
  onPredict?: () => void;
};

const Flag = ({ code }: { code: string }) => {
  if (code === 'XX')
    return (
      <span className="shrink-0 rounded-[2px] bg-line px-[3px] text-[8px] font-bold uppercase text-faint">
        XX
      </span>
    );
  return (
    <img
      src={`https://flagcdn.com/16x12/${code.toLowerCase()}.png`}
      width={16}
      height={12}
      alt={code}
      className="shrink-0 rounded-[2px] object-cover opacity-90"
    />
  );
};

const Side = ({ team, score, won, done, ff }: { team: Team; score?: number; won: boolean; done: boolean; ff?: boolean }) => (
  <Link
    to={`/team/${team.id}`}
    className="flex flex-1 flex-col items-center gap-2.5 transition-transform active:scale-[.97]"
  >
    <TeamLogo tag={team.tag} size={62} logoUrl={team.logoUrl} />
    <span className="text-center text-[15px] leading-tight font-bold tracking-tight text-ink">
      {team.name}
    </span>
    {score !== undefined && (
      <span className={`text-[44px] leading-none font-medium tracking-tighter tabular-nums ${won ? 'text-accent' : done ? 'text-dim' : 'text-ink'}`}>
        {score}
      </span>
    )}
    {ff && (
      <span className="rounded border border-dim/40 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-dim">
        Forfait
      </span>
    )}
  </Link>
);

const RosterColumn = ({ players, align }: { players: Player[]; align: 'left' | 'right' }) => (
  <div className={`flex flex-1 flex-col gap-2 ${align === 'right' ? 'items-end' : 'items-start'}`}>
    {players.map((p) => (
      <div key={p.id} className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <Flag code={p.countryCode} />
        <span className="text-[12px] font-semibold text-ink leading-none">{p.name}</span>
        {p.role && (
          <span className="text-[10px] font-medium text-faint">{p.role}</span>
        )}
      </div>
    ))}
  </div>
);

/** Hero du détail de match : méta, statut, face-à-face, roster, action principale. */
export const MatchHero = ({ match, gameName, gameLogoUrl, hasPrediction = false, onPredict }: MatchHeroProps) => {
  const live = isMatchLive(match);
  const done = match.status === 'done';
  const hasResult = match.resultA != null || match.resultB != null;
  const aWon = done && (hasResult ? match.resultA === 'W' : (match.scoreA ?? 0) > (match.scoreB ?? 0));
  const bWon = done && (hasResult ? match.resultB === 'W' : (match.scoreB ?? 0) > (match.scoreA ?? 0));
  const isFF = match.resultA === 'FF' || match.resultB === 'FF';
  const phaseLabel = phaseMetaLabel(match.phase, match.date);
  const hasRoster = (match.teamAPlayers?.length ?? 0) > 0 || (match.teamBPlayers?.length ?? 0) > 0;

  return (
    <div className="flex flex-col items-center gap-3.5 border-b border-line px-5 pt-3 pb-6">
      {/* Méta */}
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-dim uppercase">
        <GameLogo tag={match.gameId.toUpperCase()} size={16} logoUrl={gameLogoUrl} />
        {gameName}
        {phaseLabel && (
          <>
            <span className="size-[3px] rounded-full bg-faint" />
            {phaseLabel}
          </>
        )}
        {match.bestOf && (
          <>
            <span className="size-[3px] rounded-full bg-faint" />
            {match.bestOf}
          </>
        )}
      </div>

      {/* Statut */}
      {live && <LiveBadge />}
      {!live && match.status === 'upcoming' && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-dim">
          <Icon name="clock" size={13} />
          {formatDayFull(match.date)} · {match.time}
        </span>
      )}
      {done && !isFF && <Badge variant="neutral">Score final</Badge>}
      {done && !isFF && match.likelyForfeit && (
        <span className="text-[11px] font-semibold text-amber-600">Forfait probable</span>
      )}

      {/* Face-à-face */}
      <div className={`flex w-full gap-1.5 ${isFF ? 'items-center' : 'items-start'}`}>
        <Side team={match.teamA} score={isFF ? undefined : match.scoreA} won={live ? false : aWon} done={done} ff={match.resultA === 'FF'} />
        {isFF ? (
          <span className="shrink-0 px-3 text-center text-2xl font-bold uppercase tracking-wide text-dim">
            Forfait
          </span>
        ) : (
          <span className={`self-center text-[15px] font-medium text-faint ${live || done ? 'pt-14' : 'pt-6'}`}>
            {live || done ? '—' : 'vs'}
          </span>
        )}
        <Side team={match.teamB} score={isFF ? undefined : match.scoreB} won={live ? false : bWon} done={done} ff={match.resultB === 'FF'} />
      </div>

      {/* Roster intégré */}
      {hasRoster && (
        <div className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3">
          <div className="flex items-start gap-3">
            <RosterColumn players={match.teamAPlayers ?? []} align="left" />
            <div className="w-px shrink-0 self-stretch bg-line" />
            <RosterColumn players={match.teamBPlayers ?? []} align="right" />
          </div>
        </div>
      )}

      {/* Carte en cours (live) */}
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

      {/* Action principale */}
      {live && (
        <Button full className="mt-1">
          <Icon name="bolt" size={17} strokeWidth={2.1} />
          Regarder le live
        </Button>
      )}
      {!live && onPredict && (
        <Button full variant={hasPrediction ? 'soft' : 'primary'} className="mt-1" onClick={onPredict}>
          <Icon name={hasPrediction ? 'check' : 'trophy'} size={17} strokeWidth={2.1} />
          {hasPrediction ? 'Modifier mon prono' : 'Pronostiquer'}
        </Button>
      )}
    </div>
  );
};
