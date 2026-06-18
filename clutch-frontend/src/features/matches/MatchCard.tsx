import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Match } from '../../types/esports';
import { GameLogo } from '../../components/ui/GameLogo';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { formatDDMM, formatWeekdayShort, isMatchLive, phaseMetaLabel } from '../../lib/date';
import { StatusPill } from './StatusPill';
import { Countdown } from '../calendar/Countdown';
import { usePredictions } from '../prono/predictionsContext';
import { PronoBadge } from '../prono/PronoBadge';

type MatchCardProps = {
  match: Match;
  /** Tag du jeu à afficher ("VAL", "CS2"…) */
  gameTag: string;
  /** URL de l'icône locale du jeu */
  gameLogoUrl?: string;
  /** Id de l'équipe pronostiquée gagnante (badge PRONO), si prono posé */
  predictedWinnerId?: string | null;
  /** Affiche le mini-encart prono sous la carte (agenda) */
  showPredictionFooter?: boolean;
  /** Ouvre la feuille de pronostic depuis la carte */
  onPredict?: (match: Match) => void;
};

/**
 * Carte de match (style Pulse) : colonne heure/statut, équipes, chevron.
 * Trois états : à venir, en direct (barre + heure orange), terminé (score).
 */
export const MatchCard = ({
  match,
  gameTag,
  gameLogoUrl,
  showPredictionFooter = false,
  onPredict,
}: MatchCardProps) => {
  const { predictions } = usePredictions();
  const live = isMatchLive(match);
  const isDone = match.status === 'done';
  const pred = predictions[match.id];

  // Déterminer le perdant pour le grisage (résultat explicite > comparaison de scores)
  const hasResult = match.resultA != null || match.resultB != null;
  const aIsLoser = isDone && (
    hasResult ? match.resultA !== 'W' : (match.scoreA ?? 0) < (match.scoreB ?? 0)
  );
  const bIsLoser = isDone && (
    hasResult ? match.resultB !== 'W' : (match.scoreB ?? 0) < (match.scoreA ?? 0)
  );
  const isFF = match.resultA === 'FF' || match.resultB === 'FF';
  // useState(Date.now) = initialiseur lazy : Date.now() appelé une seule fois, pas à chaque render
  const [now] = useState(Date.now);
  const matchStart = new Date(`${match.date}T${match.time}:00`).getTime();
  const showCountdown = !live && !isDone && matchStart - now > 0 && matchStart - now <= 3 * 3_600_000;
  const showFooter =
    showPredictionFooter &&
    (pred || !!onPredict);
  const phaseLabel = phaseMetaLabel(match.phase, match.date);

  return (
    <div
      className={`relative rounded-2xl border border-line bg-surface-2 p-4 ${live ? 'overflow-hidden' : ''}`}
    >
      {/* barre latérale orange = signal live */}
      {live && <span className="absolute top-0 bottom-0 left-0 w-1 bg-live" />}

      <div className="relative">
        {/* Lien plein-carte (overlay) : évite l'imbrication d'<a> dans un <a> */}
        <Link
          to={`/match/${match.id}`}
          aria-label={`${match.teamA.name} vs ${match.teamB.name}`}
          className="absolute inset-0 z-0"
        />

        {/* Méta : jeu · phase · statut */}
        <div className="mb-3 flex items-center justify-between gap-2 text-[10px] font-semibold tracking-wide text-ink-2 uppercase">
          <span className="flex min-w-0 items-center gap-2">
            <Link
              to={`/game/${match.gameId}`}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 inline-flex shrink-0 items-center gap-1.5 text-accent transition-colors hover:text-accent/80"
            >
              <GameLogo tag={gameTag} size={18} logoUrl={gameLogoUrl} />
              <span className="text-[10px] font-bold leading-none tracking-[.08em]">
                {gameTag}
              </span>
            </Link>
            {phaseLabel && (
              <>
                <span className="size-0.75 shrink-0 rounded-full bg-dim" />
                <span className="truncate">{phaseLabel}</span>
              </>
            )}
            {match.format === 'br' ? (
              <>
                <span className="size-0.75 shrink-0 rounded-full bg-dim" />
                <span className="shrink-0">Battle Royale</span>
              </>
            ) : (
              match.bestOf && (
                <>
                  <span className="size-0.75 shrink-0 rounded-full bg-dim" />
                  <span className="shrink-0">{match.bestOf}</span>
                </>
              )
            )}
          </span>
          <div className="shrink-0">
            <StatusPill match={match} />
          </div>
        </div>

        {/* Corps du match : layout adapté selon le format */}
        {match.format === 'br' ? (
          /* Battle Royale : classement vertical (1er / 2ème / + d'autres) */
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`w-4 shrink-0 text-center text-[11px] font-black tabular-nums ${isDone ? 'text-accent' : 'text-faint'}`}>
                {isDone ? '1' : '·'}
              </span>
              <TeamLogo tag={match.teamA.tag} size={28} logoUrl={match.teamA.logoUrl} />
              <span className={`flex-1 truncate text-[13px] font-bold ${aIsLoser ? 'text-dim' : 'text-ink'}`}>
                {match.teamA.name}
              </span>
              {(isDone || live) && match.scoreA != null && (
                <span className={`shrink-0 text-[13px] font-bold tabular-nums ${live ? 'text-live' : 'text-ink'}`}>
                  {match.scoreA}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 shrink-0 text-center text-[11px] font-semibold tabular-nums text-dim">
                {isDone ? '2' : '·'}
              </span>
              <TeamLogo tag={match.teamB.tag} size={28} logoUrl={match.teamB.logoUrl} />
              <span className={`flex-1 truncate text-[13px] font-semibold ${bIsLoser ? 'text-dim' : 'text-ink'}`}>
                {match.teamB.name}
              </span>
              {(isDone || live) && match.scoreB != null && (
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-dim">
                  {match.scoreB}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10px] font-semibold text-faint">+ d'autres équipes</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="text-center">
              {showCountdown && (
                <div className="mb-1 flex justify-center">
                  <Countdown date={match.date} time={match.time} />
                </div>
              )}
              {!live && !isDone && !showCountdown && (
                <span className="text-[17px] font-semibold tabular-nums text-ink">{match.time}</span>
              )}
              <span className="block text-[11px] font-medium text-faint tabular-nums">
                {formatWeekdayShort(match.date)} {formatDDMM(match.date)}
              </span>
            </div>
          </div>
        ) : (
          /* Standard 1v1 : logo gros + nom en dessous + score centré */
          <div className="flex items-center justify-between">
            {/* Équipe A */}
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <TeamLogo
                tag={match.teamA.tag}
                size={44}
                logoUrl={match.teamA.logoUrl}
              />
              <span
                className={`max-w-full truncate text-center text-[13px] font-bold ${aIsLoser ? 'text-dim' : 'text-ink'}`}
              >
                {match.teamA.name}
              </span>
              {match.resultA === 'FF' && (
                <span className="rounded border border-dim/40 px-1 text-[9px] font-bold uppercase tracking-wider text-dim">
                  FF
                </span>
              )}
            </div>

            {/* Score / heure au centre */}
            <div className="shrink-0 px-3 text-center">
              {showCountdown && (
                <div className="mb-1.5 flex justify-center">
                  <Countdown date={match.date} time={match.time} />
                </div>
              )}
              {live || isDone ? (
                isFF ? (
                  <span className="text-sm font-bold uppercase tracking-wide text-dim">
                    Forfait
                  </span>
                ) : (
                  <span
                    className={`text-xl font-bold tabular-nums ${live ? 'text-live' : 'text-ink'}`}
                  >
                    {match.scoreA ?? 0} – {match.scoreB ?? 0}
                  </span>
                )
              ) : (
                <span className="text-xl font-semibold tabular-nums text-ink">
                  {match.time}
                </span>
              )}
              <span className="mt-0.5 block text-[11px] font-medium text-faint tabular-nums">
                {formatWeekdayShort(match.date)} {formatDDMM(match.date)}
              </span>
            </div>

            {/* Équipe B */}
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <TeamLogo
                tag={match.teamB.tag}
                size={44}
                logoUrl={match.teamB.logoUrl}
              />
              <span
                className={`max-w-full truncate text-center text-[13px] font-bold ${bIsLoser ? 'text-dim' : 'text-ink'}`}
              >
                {match.teamB.name}
              </span>
              {match.resultB === 'FF' && (
                <span className="rounded border border-dim/40 px-1 text-[9px] font-bold uppercase tracking-wider text-dim">
                  FF
                </span>
              )}
            </div>
          </div>
        )}

        {/* Info live + streams */}
        {live && (
          <div className="mt-2.5 flex flex-col items-center gap-2">
            {match.currentMapLabel && (
              <div className="text-center text-[11px] font-semibold text-accent">
                {match.currentMapLabel}
                {match.viewers && (
                  <span className="font-medium text-dim">
                    {' '}· {match.viewers} spect.
                  </span>
                )}
              </div>
            )}
            {match.streams && match.streams.length > 0 && (
              <div className="relative z-10 flex gap-1.5">
                {match.streams.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.platform}
                    onClick={(e) => e.stopPropagation()}
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface transition-transform active:scale-95"
                  >
                    <PlatformIcon platform={s.platform} size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showFooter && (
        <div className="mt-3 border-t border-line pt-3">
          <PronoBadge match={match} onPredict={onPredict} />
        </div>
      )}
    </div>
  );
};
