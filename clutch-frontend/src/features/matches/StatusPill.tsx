import type { Match } from '../../types/esports';
import { Badge, LiveBadge } from '../../components/ui/Badge';
import { isMatchLive } from '../../lib/date';

/** Statut compact d'un match : LIVE orange, Final discret, ou format BOx. */
export const StatusPill = ({ match }: { match: Match }) => {
  if (isMatchLive(match)) return <LiveBadge />;
  if (match.status === 'done') return <Badge variant="neutral">Final</Badge>;
  return <span className="text-[10px] font-bold tracking-[.08em] text-faint">{match.bestOf}</span>;
};
