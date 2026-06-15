import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { TeamLogo } from "../../components/ui/TeamLogo";
import { formatDayMonth, formatWeekdayShort } from "../../lib/date";
import type { Match } from "../../types/esports";
import { usePredictions } from "./predictionsContext";

type PredictCardProps = {
  match: Match;
  gameTag: string;
  onPredict: (match: Match) => void;
};

/** Carte « à pronostiquer » — logos centraux, bouton discret intégré. */
export const PredictCard = ({
  match,
  gameTag,
  onPredict,
}: PredictCardProps) => {
  const { predictions } = usePredictions();
  const pred = predictions[match.id];
  const pickedTeam = pred
    ? pred.pick === "a"
      ? match.teamA
      : match.teamB
    : null;

  return (
    <Card
      inset
      className="cursor-pointer p-4 transition-transform active:scale-[.98]"
      onClick={() => onPredict(match)}
    >
      {/* Méta : jeu · phase · date */}
      <div className="mb-4 flex items-center justify-between text-[10.5px] font-semibold tracking-wide text-ink-2 uppercase">
        <span className="flex items-center gap-1.5">
          {gameTag}
          <span className="size-[3px] rounded-full bg-dim" />
          {match.phase}
        </span>
        <span className="text-dim">
          {formatWeekdayShort(match.date)} {formatDayMonth(match.date)} ·{" "}
          {match.time}
        </span>
      </div>

      {/* Équipes face-à-face : logo gros + nom en dessous */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <TeamLogo
            tag={match.teamA.tag}
            size={40}
            logoUrl={match.teamA.logoUrl}
          />
          <span className="max-w-full truncate text-center text-xs font-bold text-ink">
            {match.teamA.name}
          </span>
        </div>

        <span className="mx-3 text-[11px] font-semibold text-dim uppercase">
          vs
        </span>

        <div className="flex flex-1 flex-col items-center gap-1.5">
          <TeamLogo
            tag={match.teamB.tag}
            size={40}
            logoUrl={match.teamB.logoUrl}
          />
          <span className="max-w-full truncate text-center text-xs font-bold text-ink">
            {match.teamB.name}
          </span>
        </div>
      </div>

      {/* Bouton / état du prono — discret, intégré */}
      <div className="mt-4 flex justify-center">
        {pred && pickedTeam ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/8 px-3 py-1.5 text-[12px] font-bold text-accent">
            <Icon name="check" size={13} strokeWidth={2.4} />
            {pickedTeam.tag} {pred.scoreA}–{pred.scoreB}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[12px] font-semibold text-on-accent">
            <Icon name="trophy" size={13} strokeWidth={2} />
            Pronostiquer
          </span>
        )}
      </div>
    </Card>
  );
};
