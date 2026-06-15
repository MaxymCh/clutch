import { Card } from '../../components/ui/Card';
import type { Match } from '../../types/esports';

/** Infos pratiques du match : format, heure, arène. */
export const MatchInfoGrid = ({ match }: { match: Match }) => (
  <div className="grid grid-cols-3 gap-2.5 px-5 pt-5">
    {(
      [
        ['Format', match.bestOf],
        ['Heure', match.time],
        ['Arène', 'Riyad'],
      ] as const
    ).map(([label, value]) => (
      <Card key={label} inset className="rounded-[14px] px-3 py-3">
        <div className="text-[10px] font-bold tracking-wide text-dim uppercase">{label}</div>
        <div className="mt-1.5 text-[15px] font-bold text-ink">{value}</div>
      </Card>
    ))}
  </div>
);
