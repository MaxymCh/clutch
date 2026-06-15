import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { TeamLogo } from '../../components/ui/TeamLogo';
import type { BestOf, Match, Team } from '../../types/esports';
import { usePredictions } from './predictionsContext';

/** Scores possibles pour le vainqueur selon le format */
const scorelines = (bestOf: BestOf): [number, number][] =>
  bestOf === 'BO5' ? [[3, 0], [3, 1], [3, 2]] : bestOf === 'BO3' ? [[2, 0], [2, 1]] : [[1, 0]];

type TeamPickProps = { team: Team; odds: number; on: boolean; onSelect: () => void };

/** Choix du vainqueur : grande tuile équipe avec % de picks communautaires. */
const TeamPick = ({ team, odds, on, onSelect }: TeamPickProps) => (
  <button
    onClick={onSelect}
    className={`flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl border-[1.5px] px-2.5 py-4 transition-transform active:scale-[.97] ${
      on ? 'border-accent bg-accent/5' : 'border-line-2 bg-surface'
    }`}
  >
    <TeamLogo tag={team.tag} size={48} solid={on} logoUrl={team.logoUrl} />
    <span className={`text-center text-sm leading-tight font-bold ${on ? 'text-accent' : 'text-ink'}`}>
      {team.name}
    </span>
    <span className="text-[11px] leading-none font-semibold text-dim">{odds}% le pronostiquent</span>
  </button>
);

const Form = ({ match, onClose }: { match: Match; onClose: () => void }) => {
  const { predictions, setPrediction } = usePredictions();
  const existing = predictions[match.id];
  const [pick, setPick] = useState<'a' | 'b' | null>(existing?.pick ?? null);
  const [line, setLine] = useState<[number, number] | null>(
    existing ? [Math.max(existing.scoreA, existing.scoreB), Math.min(existing.scoreA, existing.scoreB)] : null,
  );

  const oddsA = match.oddsA ?? 50;
  const select = (side: 'a' | 'b') => {
    setPick(side);
    setLine(null);
  };
  const confirm = () => {
    if (!pick || !line) return;
    const [hi, lo] = line;
    setPrediction(match.id, { pick, scoreA: pick === 'a' ? hi : lo, scoreB: pick === 'a' ? lo : hi });
    onClose();
  };

  return (
    <>
      <p className="mb-3.5 text-xs font-semibold tracking-wide text-dim uppercase">
        {match.phase} · {match.bestOf}
      </p>
      <p className="mb-2 text-[13px] font-bold text-ink">1 · Qui gagne ?</p>
      <div className="flex gap-2.5">
        <TeamPick team={match.teamA} odds={oddsA} on={pick === 'a'} onSelect={() => select('a')} />
        <TeamPick team={match.teamB} odds={100 - oddsA} on={pick === 'b'} onSelect={() => select('b')} />
      </div>

      <p className={`mt-5 mb-2 text-[13px] font-bold ${pick ? 'text-ink' : 'text-faint'}`}>
        2 · Score exact <span className="text-xs font-semibold text-dim">(bonus)</span>
      </p>
      <div className="flex gap-2">
        {scorelines(match.bestOf).map(([hi, lo]) => {
          const on = line?.[0] === hi && line?.[1] === lo;
          return (
            <button
              key={`${hi}-${lo}`}
              disabled={!pick}
              onClick={() => setLine([hi, lo])}
              className={`flex-1 cursor-pointer rounded-[13px] border-[1.5px] py-3 text-[17px] font-bold tabular-nums transition-transform active:scale-[.97] disabled:cursor-default disabled:opacity-60 ${
                on ? 'border-ink bg-ink text-surface' : pick ? 'border-line-2 bg-surface text-ink' : 'border-line-2 bg-surface-2 text-faint'
              }`}
            >
              {hi}–{lo}
            </button>
          );
        })}
      </div>

      <div className="my-4.5 flex items-center gap-2 rounded-[13px] bg-surface-2 px-3.5 py-3 text-[12.5px] leading-snug font-semibold text-ink-2">
        <Icon name="info" size={16} className="shrink-0 text-accent" />
        <span>
          <b className="text-accent">+25 pts</b> si score exact · <b>+10 pts</b> si bon vainqueur.
        </span>
      </div>
      <Button full size="lg" disabled={!pick || !line} onClick={confirm}>
        <Icon name="check" size={18} strokeWidth={2.2} />
        {pick && line ? 'Valider mon prono' : 'Choisis vainqueur + score'}
      </Button>
    </>
  );
};

/** Feuille de pronostic : vainqueur + score exact. `match` null = fermée. */
export const PredictSheet = ({ match, onClose }: { match: Match | null; onClose: () => void }) => (
  <Sheet open={match !== null} onClose={onClose} title="Mon pronostic">
    {match && <Form key={match.id} match={match} onClose={onClose} />}
  </Sheet>
);
