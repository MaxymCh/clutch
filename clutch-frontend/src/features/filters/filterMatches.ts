import type { Match } from '../../types/esports';

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
