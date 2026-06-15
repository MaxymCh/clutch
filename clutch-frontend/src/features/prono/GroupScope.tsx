import { useGames } from "../../api/queries/useGames";
import type { Group } from "../../types/community";
import { getGroupScopeLabel } from "./groupScopeLabel";

/** Badge affichant le périmètre d'un groupe. */
export const GroupScopeBadge = ({
  group,
}: {
  group: Pick<Group, "gameIds">;
}) => {
  const { data: games } = useGames();
  const label = getGroupScopeLabel(group, games);

  return (
    <span className="inline-flex items-center rounded-lg bg-accent/8 px-2.5 py-1 text-[11px] font-bold text-accent">
      {label}
    </span>
  );
};
