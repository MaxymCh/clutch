/**
 * Types communauté / pronostics — TEMPORAIRES (mêmes règles que esports.ts) :
 * remplacés par les types générés depuis OpenAPI quand le backend existera.
 */

export interface User {
  id: string;
  name: string;
  tag: string;
  countryCode: string;
  points: number;
  globalRank: number;
  /** Pronostics gagnants d'affilée */
  streak: number;
}

export interface GroupMember {
  name: string;
  tag: string;
  points: number;
  /** true si c'est l'utilisateur courant */
  isMe?: boolean;
}

/** Groupe de pronostics entre amis (style MPG) */
export interface Group {
  id: string;
  name: string;
  emoji: string;
  /** Code d'invitation partageable */
  code: string;
  /** Périmètre optionnel : seuls les matchs de ce jeu comptent */
  gameId?: string;
  /** Périmètre optionnel : seuls les matchs impliquant cette équipe comptent */
  teamId?: string;
  members: GroupMember[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  tag: string;
  points: number;
  countryCode?: string;
}

export interface Preferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  onboarded: boolean;
  favTeams: string[];
  favGames: string[];
}

/** Pronostic local sur un match (stocké côté client en attendant l'API) */
export interface Prediction {
  pick: 'a' | 'b';
  scoreA: number;
  scoreB: number;
}

export type PredictionMap = Record<string, Prediction>;

export interface PredictionHistoryItem {
  match: import('./esports').Match;
  prediction: Prediction;
  points?: number;
}

export interface GroupHistoryMember {
  name: string;
  tag: string;
  /** true si c'est l'utilisateur courant */
  isMe?: boolean;
  prediction?: Prediction;
  points?: number;
}

export interface GroupHistoryMatch {
  match: import('./esports').Match;
  members: GroupHistoryMember[];
}
