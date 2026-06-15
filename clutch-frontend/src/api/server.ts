/**
 * Endpoints de l'API interne — remplace le simulateur `mocks/server.ts`.
 * Mêmes signatures que les mocks : les hooks et composants ne changent pas.
 */
import type {
  Group,
  GroupHistoryMatch,
  LeaderboardEntry,
  PredictionHistoryItem,
  Preferences,
  Prediction,
  PredictionMap,
  User,
} from "../types/community";
import type { Game, Match, Player, Team } from "../types/esports";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

/** GET /games */
export const fetchGames = (): Promise<Game[]> => apiGet<Game[]>("/games");

/** GET /teams */
export const fetchTeams = (): Promise<Team[]> => apiGet<Team[]>("/teams");

/** GET /teams/:id */
export const fetchTeam = (id: string): Promise<Team> =>
  apiGet<Team>(`/teams/${encodeURIComponent(id)}`);

/** GET /teams/:id/players — roster d'une équipe */
export const fetchTeamPlayers = (id: string): Promise<Player[]> =>
  apiGet<Player[]>(`/teams/${encodeURIComponent(id)}/players`);

/** GET /matches */
export const fetchMatches = (): Promise<Match[]> => apiGet<Match[]>("/matches");

/** GET /matches/:id */
export const fetchMatch = (id: string): Promise<Match> =>
  apiGet<Match>(`/matches/${encodeURIComponent(id)}`);

/** GET /me — crée le profil au premier appel */
export const fetchUser = (): Promise<User> => apiGet<User>("/me");

/** PATCH /me — met à jour le pseudo */
export const patchUser = (patch: { name: string }): Promise<User> =>
  apiPatch<User>("/me", patch);

/** GET /leaderboard */
export const fetchGlobalLeaderboard = (): Promise<LeaderboardEntry[]> =>
  apiGet<LeaderboardEntry[]>("/leaderboard");

/** GET /groups */
export const fetchGroups = (): Promise<Group[]> => apiGet<Group[]>("/groups");

/** GET /groups/:id */
export const fetchGroup = (id: string): Promise<Group> =>
  apiGet<Group>(`/groups/${encodeURIComponent(id)}`);

/** GET /groups/:id/history */
export const fetchGroupHistory = (id: string): Promise<GroupHistoryMatch[]> =>
  apiGet<GroupHistoryMatch[]>(`/groups/${encodeURIComponent(id)}/history`);

/** POST /groups */
export const createGroup = (input: {
  name: string;
  emoji: string;
  gameIds?: string[];
}): Promise<Group> => apiPost<Group>("/groups", input);

/** POST /groups/join */
export const joinGroup = (code: string): Promise<Group> =>
  apiPost<Group>("/groups/join", { code });

/** DELETE /groups/:id — supprime la ligue (admin uniquement) */
export const deleteGroup = (id: string): Promise<void> =>
  apiDelete(`/groups/${encodeURIComponent(id)}`);

/** POST /groups/:id/leave — quitter la ligue */
export const leaveGroup = (id: string): Promise<void> =>
  apiPost<void>(`/groups/${encodeURIComponent(id)}/leave`, {});

/** DELETE /groups/:id/members/:tag — expulser un membre (admin) */
export const removeMember = (
  groupId: string,
  memberTag: string,
): Promise<Group> =>
  apiDelete<Group>(
    `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberTag)}`,
  );

/** GET /predictions — PredictionMap de l'utilisateur courant */
export const fetchPredictions = (): Promise<PredictionMap> =>
  apiGet<PredictionMap>("/predictions");

/** GET /predictions/history — historique des pronostics terminés */
export const fetchPredictionHistory = (): Promise<PredictionHistoryItem[]> =>
  apiGet<PredictionHistoryItem[]>("/predictions/history");

/** POST /predictions — refusé par l'API si le match a déjà commencé */
export const postPrediction = (
  matchId: string,
  prediction: Prediction,
): Promise<Prediction> =>
  apiPost<Prediction>("/predictions", { matchId, ...prediction });

/** GET /me/preferences */
export const fetchPreferences = (): Promise<Preferences> =>
  apiGet<Preferences>("/me/preferences");

/** PATCH /me/preferences — mise à jour partielle */
export const patchPreferences = (
  patch: Partial<Preferences>,
): Promise<Preferences> => apiPatch<Preferences>("/me/preferences", patch);
