import type { Match } from "../../types/esports";
import type { Group } from "../../types/community";

/** Filtre client par jeu et/ou équipe (même logique que le calendrier). */
export const filterMatches = (
  matches: Match[],
  game: string | null,
  team: string | null,
): Match[] =>
  matches.filter((m) => {
    if (game && m.gameId !== game) return false;
    if (team && m.teamA.id !== team && m.teamB.id !== team) return false;
    return true;
  });

/** Filtre selon le périmètre d'un groupe (gameIds optionnels). */
export const filterMatchesByGroupScope = (
  matches: Match[],
  group: Pick<Group, "gameIds">,
): Match[] => {
  if (group.gameIds && group.gameIds.length > 0) {
    return matches.filter((m) => group.gameIds!.includes(m.gameId));
  }
  return matches;
};
