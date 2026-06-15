/**
 * Types du domaine esport — TEMPORAIRES.
 * Le backend n'existe pas encore : ces types miment la future réponse de
 * notre API interne. Quand la spec OpenAPI sera disponible, ils seront
 * remplacés par les types générés dans `src/api/generated/` (source de
 * vérité = le backend) et ce fichier sera supprimé.
 */

export type GameId = 'val' | 'lol' | 'cs2' | 'dota' | 'rl' | 'ow';

export type MatchStatus = 'upcoming' | 'live' | 'done';

export type BestOf = 'BO1' | 'BO3' | 'BO5';

export interface Game {
  id: GameId;
  name: string;
  /** Nom court affiché dans les filtres ("LoL", "CS2"…) */
  short: string;
  /** Tag majuscule ("VAL", "DOTA"…) */
  tag: string;
  /** URL de l'image de fond de la carte jeu */
  bgUrl: string;
  /** Icône/logo du jeu (chemin local, ex. /games/val-icon.png) */
  logoUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  /** Code pays ISO 3166-1 alpha-2 ("FR", "KR"…) */
  countryCode: string;
  /** URL du logo Liquipedia (Special:FilePath) — absent si pas encore enrichi */
  logoUrl?: string;
}

/** Score d'une carte (map) jouée ou en cours dans un match */
export interface MapScore {
  name: string;
  scoreA: number;
  scoreB: number;
  winner?: 'a' | 'b';
  live?: boolean;
}

export interface Match {
  id: string;
  gameId: GameId;
  /** L'API embarque les équipes dans la réponse match */
  teamA: Team;
  teamB: Team;
  status: MatchStatus;
  /** Phase du tournoi ("Quart de finale", "Grande Finale"…) */
  phase: string;
  bestOf: BestOf;
  /** Date locale du match, ISO "YYYY-MM-DD" */
  date: string;
  /** Heure locale "HH:mm" */
  time: string;
  scoreA?: number;
  scoreB?: number;
  maps?: MapScore[];
  /** Libellé de la carte en cours, ex. "Lotus · 11–9" (live uniquement) */
  currentMapLabel?: string;
  /** Audience approximative, ex. "52K" (live uniquement) */
  viewers?: string;
  /** % de la communauté qui pronostique l'équipe A gagnante */
  oddsA?: number;
}
