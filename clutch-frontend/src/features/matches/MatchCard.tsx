import { Link } from "react-router-dom";
import type { Match } from "../../types/esports";
import { GameLogo } from "../../components/ui/GameLogo";
import { TeamLogo } from "../../components/ui/TeamLogo";
import { formatDDMM, formatWeekdayShort } from "../../lib/date";
import { StatusPill } from "./StatusPill";
import { usePredictions } from "../prono/predictionsContext";
import { PronoBadge } from "../prono/PronoBadge";

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
  const live = match.status === "live";
  const pred = predictions[match.id];
  const showFooter =
    showPredictionFooter &&
    (pred || (match.status === "upcoming" && onPredict));

  return (
    <div
      className={`rounded-2xl border border-line bg-surface-2 p-4 ${live ? "relative overflow-hidden" : ""}`}
    >
      {/* barre latérale orange = signal live */}
      {live && <span className="absolute top-0 bottom-0 left-0 w-1 bg-live" />}

      <Link to={`/match/${match.id}`} className="block">
        {/* Méta : jeu · phase · statut */}
        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold tracking-wide text-ink-2 uppercase">
          <span className="flex items-center gap-1.5">
            <Link
              to={`/game/${match.gameId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-md text-accent transition-transform hover:scale-[1.03]"
            >
              <GameLogo tag={gameTag} size={18} logoUrl={gameLogoUrl} />
              <span className="text-[10px] font-bold tracking-[.08em]">{gameTag}</span>
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
          <StatusPill match={match} />
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
      </Link>

      {showFooter && (
        <div className="mt-3 border-t border-line pt-3">
          <PronoBadge match={match} onPredict={onPredict} />
        </div>
      )}
    </div>
  );
};
