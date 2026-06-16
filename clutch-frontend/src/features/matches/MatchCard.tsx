import { type MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { Match } from "../../types/esports";
import { Icon } from "../../components/ui/Icon";
import { TeamLogo } from "../../components/ui/TeamLogo";
import { formatDayMonth, formatWeekdayShort } from "../../lib/date";
import { StatusPill } from "./StatusPill";
import { usePredictions } from "../prono/predictionsContext";
import type { Prediction } from "../../types/community";

type MatchCardProps = {
  match: Match;
  /** Tag du jeu à afficher ("VAL", "CS2"…) */
  gameTag: string;
  /** URL de l'icône locale du jeu */
  gameLogoUrl?: string;
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
  if (prediction.scoreA === match.scoreA && prediction.scoreB === match.scoreB)
    return 25;
  const winner = (match.scoreA ?? 0) > (match.scoreB ?? 0) ? "a" : "b";
  return prediction.pick === winner ? 10 : 0;
};

/**
 * Carte de match (style Pulse) : colonne heure/statut, équipes, chevron.
 * Trois états : à venir, en direct (barre + heure orange), terminé (score).
 */
export const MatchCard = ({
  match,
  gameTag,
  showDay = false,
  showPredictionFooter = false,
  onPredict,
}: MatchCardProps) => {
  const { predictions } = usePredictions();
  const live = match.status === "live";
  const pred = predictions[match.id];
  const showFooter =
    showPredictionFooter &&
    (pred || (match.status === "upcoming" && onPredict));
  const points =
    match.status === "done" && pred ? computePoints(pred, match) : null;
  const pickedTeam = pred
    ? pred.pick === "a"
      ? match.teamA
      : match.teamB
    : null;

  const predictClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onPredict?.(match);
  };

  return (
    <div
      className={`relative rounded-2xl border border-line bg-surface-2 p-4 ${live ? "overflow-hidden" : ""}`}
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
        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold tracking-wide text-ink-2 uppercase">
          <span className="flex items-center gap-1.5">
            <Link
              to={`/game/${match.gameId}`}
              className="relative z-10 text-accent transition-colors hover:text-accent/80"
            >
              {gameTag}
            </Link>
            <span className="size-0.75 rounded-full bg-dim" />
            {match.phase}
            {match.bestOf && (
              <>
                <span className="size-0.75 rounded-full bg-dim" />
                <span>{match.bestOf}</span>
              </>
            )}
          </span>
          <span className="flex items-center gap-2">
            {showDay && (
              <span className="text-dim">
                {formatWeekdayShort(match.date)} {formatDayMonth(match.date)}
              </span>
            )}
            <StatusPill match={match} />
          </span>
        </div>

        {/* Équipes face-à-face : logo gros + nom en dessous */}
        <div className="flex items-center justify-between">
          {/* Équipe A */}
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <TeamLogo
              tag={match.teamA.tag}
              size={44}
              logoUrl={match.teamA.logoUrl}
            />
            <span
              className={`max-w-full truncate text-center text-[13px] font-bold ${
                match.status === "done" &&
                (match.scoreA ?? 0) < (match.scoreB ?? 0)
                  ? "text-dim"
                  : "text-ink"
              }`}
            >
              {match.teamA.name}
            </span>
          </div>

          {/* Score / heure au centre */}
          <div className="shrink-0 px-3 text-center">
            {match.status === "live" || match.status === "done" ? (
              <span
                className={`text-xl font-bold tabular-nums ${live ? "text-live" : "text-ink"}`}
              >
                {match.scoreA} – {match.scoreB}
              </span>
            ) : (
              <span className="text-xl font-semibold tabular-nums text-ink">
                {match.time}
              </span>
            )}
          </div>

          {/* Équipe B */}
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <TeamLogo
              tag={match.teamB.tag}
              size={44}
              logoUrl={match.teamB.logoUrl}
            />
            <span
              className={`max-w-full truncate text-center text-[13px] font-bold ${
                match.status === "done" &&
                (match.scoreB ?? 0) < (match.scoreA ?? 0)
                  ? "text-dim"
                  : "text-ink"
              }`}
            >
              {match.teamB.name}
            </span>
          </div>
        </div>

        {/* Info live */}
        {live && match.currentMapLabel && (
          <div className="mt-2.5 text-center text-[11px] font-semibold text-accent">
            {match.currentMapLabel}
            {match.viewers && (
              <span className="font-medium text-dim">
                {" "}
                · {match.viewers} spect.
              </span>
            )}
          </div>
        )}
      </div>

      {showFooter && (
        <div className="mt-3 border-t border-line pt-3">
          {pred && pickedTeam ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-xl bg-accent/8 px-3 py-1.5">
                <Icon
                  name="check"
                  size={14}
                  strokeWidth={2.4}
                  className="text-accent"
                />
                <span className="text-[13px] font-bold text-accent">
                  {pickedTeam.name} {pred.scoreA}–{pred.scoreB}
                </span>
                {match.status === "done" && points !== null && (
                  <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    +{points}
                  </span>
                )}
              </div>
              {match.status === "upcoming" && onPredict && (
                <button
                  onClick={predictClick}
                  className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink transition-transform active:scale-95"
                >
                  Modifier
                </button>
              )}
            </div>
          ) : match.status === "done" ? (
            <p className="text-center text-[11px] font-semibold text-dim">
              Pas de prono
            </p>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={predictClick}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12px] font-bold text-on-accent transition-transform active:scale-95"
              >
                <Icon name="trophy" size={14} strokeWidth={2.2} />
                Pronostiquer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
