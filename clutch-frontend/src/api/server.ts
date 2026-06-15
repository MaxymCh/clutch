/**
 * Endpoints de l'API interne — remplace le simulateur `mocks/server.ts`.
 * Mêmes signatures que les mocks : les hooks et composants ne changent pas.
 */
import type {
  Group,
  LeaderboardEntry,
  Prediction,
  PredictionMap,
  User,
} from '../types/community';
import type { Game, Match, Team } from '../types/esports';
import { apiGet, apiPost } from './client';

/** GET /games */
export const fetchGames = (): Promise<Game[]> => apiGet<Game[]>('/games');

/** GET /teams */
export const fetchTeams = (): Promise<Team[]> => apiGet<Team[]>('/teams');

/** GET /teams/:id */
export const fetchTeam = (id: string): Promise<Team> => apiGet<Team>(`/teams/${encodeURIComponent(id)}`);

/** GET /matches */
export const fetchMatches = (): Promise<Match[]> => apiGet<Match[]>('/matches');

/** GET /matches/:id */
export const fetchMatch = (id: string): Promise<Match> => apiGet<Match>(`/matches/${encodeURIComponent(id)}`);

/** GET /me — crée la session anonyme (cookie) au premier appel */
export const fetchUser = (): Promise<User> => apiGet<User>('/me');

/** GET /leaderboard */
export const fetchGlobalLeaderboard = (): Promise<LeaderboardEntry[]> =>
  apiGet<LeaderboardEntry[]>('/leaderboard');

/** GET /groups */
export const fetchGroups = (): Promise<Group[]> => apiGet<Group[]>('/groups');

/** GET /groups/:id */
export const fetchGroup = (id: string): Promise<Group> => apiGet<Group>(`/groups/${encodeURIComponent(id)}`);

/** POST /groups */
export const createGroup = (input: { name: string; emoji: string }): Promise<Group> =>
  apiPost<Group>('/groups', input);

/** POST /groups/join */
export const joinGroup = (code: string): Promise<Group> => apiPost<Group>('/groups/join', { code });

/** GET /predictions — PredictionMap de l'utilisateur courant */
export const fetchPredictions = (): Promise<PredictionMap> => apiGet<PredictionMap>('/predictions');

/** POST /predictions — refusé par l'API si le match a déjà commencé */
export const postPrediction = (matchId: string, prediction: Prediction): Promise<Prediction> =>
  apiPost<Prediction>('/predictions', { matchId, ...prediction });
