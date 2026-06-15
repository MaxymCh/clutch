import type { Group } from "../../types/community";

/** Libellé du périmètre d'un groupe (tous / jeux sélectionnés). */
export const getGroupScopeLabel = (
  group: Pick<Group, "gameIds">,
  games?: { id: string; short: string }[],
): string => {
  if (group.gameIds && group.gameIds.length > 0) {
    const names = group.gameIds
      .map((id) => games?.find((g) => g.id === id)?.short ?? id.toUpperCase())
      .join(", ");
    return names;
  }
  return "Tous les jeux";
};
