import { Avatar } from '../../components/ui/Avatar';
import { Flag } from '../../components/ui/Flag';
import { formatPoints } from '../../lib/format';

type RankRowProps = {
  rank: number;
  name: string;
  tag: string;
  points: number;
  countryCode?: string;
  isMe?: boolean;
  /** Rangs mis en avant en orange (podium…) */
  topHighlight?: boolean;
};

/** Ligne de classement (groupes + classements amis/mondial). */
export const RankRow = ({ rank, name, tag, points, countryCode, isMe, topHighlight }: RankRowProps) => (
  <div
    className={`flex items-center gap-3 border-b border-line py-3 ${
      isMe ? '-mx-2 rounded-xl bg-accent/5 px-4' : 'px-2'
    }`}
  >
    <span
      className={`w-6 text-center text-[15px] font-bold tabular-nums ${
        topHighlight ? 'text-accent' : 'text-dim'
      }`}
    >
      {rank}
    </span>
    <Avatar tag={tag} size={36} me={isMe} />
    <span className={`flex flex-1 items-center gap-2 text-[15px] text-ink ${isMe ? 'font-bold' : 'font-semibold'}`}>
      {name}
      {countryCode && <Flag countryCode={countryCode} size={12} />}
      {isMe && <span className="text-[11px] font-semibold text-accent">toi</span>}
    </span>
    <span className="text-[15px] font-bold tabular-nums text-ink">{formatPoints(points)}</span>
  </div>
);
