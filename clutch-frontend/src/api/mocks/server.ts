import type { Group, LeaderboardEntry, User } from "../../types/community";
import type { Game, Match, Team } from "../../types/esports";
import { GAMES, GAME_ORDER, TEAMS } from "./catalog";
import { GLOBAL_LEADERBOARD, GROUPS_SEED, USER } from "./community";
import { MATCHES } from "./matches";

/**
 * Simulateur de l'API interne (le backend n'existe pas encore).
 * Chaque fonction imite un endpoint REST : latence + copie des données.
 * À terme, l'intérieur de ces fonctions est remplacé par le client généré
 * depuis OpenAPI — les signatures (et donc les hooks) ne changent pas.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET /games */
export const fetchGames = async (): Promise<Game[]> => {
  await delay(150);
  return GAME_ORDER.map((id) => GAMES[id]);
};

/** GET /teams */
export const fetchTeams = async (): Promise<Team[]> => {
  await delay(150);
  return Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name));
};

/** GET /teams/:id */
export const fetchTeam = async (id: string): Promise<Team> => {
  await delay(200);
  const team = TEAMS[id];
  if (!team) throw new Error(`Équipe introuvable : ${id}`);
  return team;
};

/** GET /matches */
export const fetchMatches = async (): Promise<Match[]> => {
  await delay(300);
  return [...MATCHES];
};

/** GET /matches/:id */
export const fetchMatch = async (id: string): Promise<Match> => {
  await delay(200);
  const match = MATCHES.find((m) => m.id === id);
  if (!match) throw new Error(`Match introuvable : ${id}`);
  return match;
};

/** GET /me */
export const fetchUser = async (): Promise<User> => {
  await delay(150);
  return { ...USER };
};

/** GET /leaderboard */
export const fetchGlobalLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  await delay(250);
  return [...GLOBAL_LEADERBOARD];
};

// État mutable en mémoire : les groupes créés/rejoints pendant la session
let groups: Group[] = [...GROUPS_SEED];

/** GET /groups */
export const fetchGroups = async (): Promise<Group[]> => {
  await delay(200);
  return [...groups];
};

/** GET /groups/:id */
export const fetchGroup = async (id: string): Promise<Group> => {
  await delay(150);
  const group = groups.find((g) => g.id === id);
  if (!group) throw new Error(`Groupe introuvable : ${id}`);
  return group;
};

/** POST /groups */
export const createGroup = async (input: {
  name: string;
  emoji: string;
  gameIds?: string[];
}): Promise<Group> => {
  await delay(300);
  const group: Group = {
    id: `g${Date.now() % 100000}`,
    name: input.name.trim() || "Mon groupe",
    emoji: input.emoji,
    code: `CLTCH-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    gameIds:
      input.gameIds && input.gameIds.length > 0 ? input.gameIds : undefined,
    members: [
      { name: USER.name, tag: USER.tag, points: USER.points, isMe: true },
    ],
  };
  groups = [...groups, group];
  return group;
};

/** POST /groups/join */
export const joinGroup = async (code: string): Promise<Group> => {
  await delay(300);
  const group: Group = {
    id: `g${Date.now() % 100000}`,
    name: "Groupe rejoint",
    emoji: "🎮",
    code: code.trim().toUpperCase() || "CLTCH-JOIN",
    members: [
      { name: "Hôte", tag: "HT", points: 1310 },
      { name: USER.name, tag: USER.tag, points: USER.points, isMe: true },
      { name: "Amel", tag: "AM", points: 920 },
    ],
  };
  groups = [...groups, group];
  return group;
};
