import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import type { Group } from '../../types/community';

/** Carte de groupe (carrousel de l'écran Prono) : emblème, rang, membres. */
export const GroupCard = ({ group }: { group: Group }) => {
  const rank =
    [...group.members].sort((a, b) => b.points - a.points).findIndex((m) => m.isMe) + 1;

  return (
    <Link to={`/prono/group/${group.id}`} className="shrink-0 snap-start">
      <Card className="w-[12.5rem] min-w-[12.5rem] p-4 transition-transform active:scale-[.97]">
        <div className="flex items-center justify-between">
          <span className="text-[26px] leading-none">{group.emoji}</span>
          {rank > 0 && (
            <span className="rounded-lg bg-accent/8 px-2 py-1 text-xs font-bold text-accent">
              #{rank}
            </span>
          )}
        </div>
        <div className="mt-3.5 truncate text-base leading-tight font-bold tracking-tight text-ink">
          {group.name}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex">
            {group.members.slice(0, 4).map((member, i) => (
              <span
                key={member.name}
                className={`rounded-full border-2 border-surface ${i > 0 ? '-ml-2' : ''}`}
              >
                <Avatar tag={member.tag} size={24} me={member.isMe} />
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold text-dim">{group.members.length}</span>
        </div>
      </Card>
    </Link>
  );
};
