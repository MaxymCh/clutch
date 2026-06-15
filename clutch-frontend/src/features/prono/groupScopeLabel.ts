import type { Group } from '../../types/community';

/** Libellé du périmètre d'un groupe (tous / jeu / équipe). */
export const getGroupScopeLabel = (
  group: Pick<Group, 'gameId' | 'teamId'>,
  games?: { id: string; short: string }[],
  teams?: { id: string; tag: string }[],
): string => {
  if (group.gameId) {
    const game = games?.find((g) => g.id === group.gameId);
    return game ? `Jeu · ${game.short}` : `Jeu · ${group.gameId.toUpperCase()}`;
  }
  if (group.teamId) {
    const team = teams?.find((t) => t.id === group.teamId);
    return team ? `Équipe · ${team.tag}` : `Équipe · ${group.teamId.toUpperCase()}`;
  }
  return 'Tous les matchs';
};
