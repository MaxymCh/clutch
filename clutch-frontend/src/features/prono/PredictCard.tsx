import { Card } from "../../components/ui/Card";
import { GameLogo } from "../../components/ui/GameLogo";
import { Icon } from "../../components/ui/Icon";
import { TeamLogo } from "../../components/ui/TeamLogo";
import { formatDayMonth, formatWeekdayShort } from "../../lib/date";
import type { Match } from "../../types/esports";
import { usePredictions } from "./predictionsContext";

type PredictCardProps = {
  match: Match;
  gameTag: string;
  gameLogoUrl?: string;
  onPredict: (match: Match) => void;
  compact?: boolean;
};

/** Carte « à pronostiquer » — logos centraux, bouton discret intégré. */
export const PredictCard = ({
  match,
  gameTag,
  gameLogoUrl,
  onPredict,
  compact,
}: PredictCardProps) => {
  const { predictions } = usePredictions();
  const pred = predictions[match.id];
  const hasPredicted = !!pred;

  return (
    <Card
      inset
      className={`cursor-pointer transition-transform active:scale-[.98] ${compact ? 'px-4 py-6' : 'p-4'}`}
      onClick={() => onPredict(match)}
    >
      {/* Méta : jeu · phase · date */}
      <div className={`mb-5 flex items-center justify-between text-ink-2 uppercase ${compact ? 'text-[12px] font-semibold tracking-wide' : 'text-[10.5px] font-semibold tracking-wide'}`}>
        <span className="flex items-center gap-1 truncate">
          <GameLogo tag={gameTag} size={18} logoUrl={gameLogoUrl} />
          <span className="text-[11px] font-bold tracking-[.08em] text-dim">{gameTag}</span>
          {!compact && (
            <>
              <span className="size-0.75 rounded-full bg-dim" />
              {match.phase}
            </>
          )}
          {match.bestOf && (
            <>
              <span className="size-0.75 rounded-full bg-dim" />
              {match.bestOf}
            </>
          )}
        </span>
        {!compact && (
          <span className="shrink-0 text-dim">
            {formatWeekdayShort(match.date)} {formatDayMonth(match.date)} ·{" "}
            {match.time}
          </span>
        )}
      </div>

      {/* Équipes + score central */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-2.5">
          <TeamLogo
            tag={match.teamA.tag}
            size={compact ? 52 : 40}
            logoUrl={match.teamA.logoUrl}
          />
          <span className={`max-w-full truncate text-center font-bold text-ink ${compact ? 'text-[13px]' : 'text-xs'}`}>
            {match.teamA.name}
          </span>
        </div>

        {/* Score prono affiché comme des champs éditables */}
        {hasPredicted && pred ? (
          <div className={`flex items-center gap-1.5 ${compact ? 'mx-2' : 'mx-2 gap-1.5'}`}>
            <span className={`grid place-items-center rounded-lg border border-dashed border-accent/50 bg-accent/5 font-black tabular-nums text-accent ${compact ? 'size-10 text-[20px]' : 'size-10 text-[20px]'}`}>
              {pred.scoreA}
            </span>
            <span className="text-[12px] font-bold text-dim">–</span>
            <span className={`grid place-items-center rounded-lg border border-dashed border-accent/50 bg-accent/5 font-black tabular-nums text-accent ${compact ? 'size-10 text-[20px]' : 'size-10 text-[20px]'}`}>
              {pred.scoreB}
            </span>
          </div>
        ) : (
          <span className={`text-dim uppercase ${compact ? 'mx-2 text-[14px] font-bold' : 'mx-3 text-[11px] font-semibold'}`}>
            vs
          </span>
        )}

        <div className="flex flex-1 flex-col items-center gap-2.5">
          <TeamLogo
            tag={match.teamB.tag}
            size={compact ? 52 : 40}
            logoUrl={match.teamB.logoUrl}
          />
          <span className={`max-w-full truncate text-center font-bold text-ink ${compact ? 'text-[13px]' : 'text-xs'}`}>
            {match.teamB.name}
          </span>
        </div>
      </div>

      {/* Date compact */}
      {compact && (
        <p className="mt-4 text-center text-[13px] font-medium text-dim">
          {formatDayMonth(match.date)} · {match.time}
        </p>
      )}

      {/* CTA en bas */}
      <div className={`flex justify-center ${compact ? 'mt-4' : 'mt-4'}`}>
        {hasPredicted ? (
          <span className={`inline-flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/5 font-bold text-accent ${compact ? 'px-4 py-2 text-[13px]' : 'gap-1.5 px-3.5 py-1.5 text-[11px]'}`}>
            <Icon name="pencil" size={13} strokeWidth={2.2} />
            Modifier
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-xl bg-accent font-bold text-on-accent ${compact ? 'px-4 py-2.5 text-[13px]' : 'gap-1.5 px-5 py-2 text-[13px]'}`}>
            <Icon name="trophy" size={14} strokeWidth={2} />
            Prono
          </span>
        )}
      </div>
    </Card>
  );
};
