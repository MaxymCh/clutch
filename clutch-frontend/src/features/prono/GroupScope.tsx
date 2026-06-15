import { useGames } from '../../api/queries/useGames';
import { useTeams } from '../../api/queries/useTeams';
import type { Group } from '../../types/community';
import { getGroupScopeLabel } from './groupScopeLabel';

/** Badge affichant le périmètre d'un groupe. */
export const GroupScopeBadge = ({ group }: { group: Pick<Group, 'gameId' | 'teamId'> }) => {
  const { data: games } = useGames();
  const { data: teams } = useTeams();
  const label = getGroupScopeLabel(group, games, teams);

  return (
    <span className="inline-flex items-center rounded-lg bg-accent/8 px-2.5 py-1 text-[11px] font-bold text-accent">
      {label}
    </span>
  );
};
