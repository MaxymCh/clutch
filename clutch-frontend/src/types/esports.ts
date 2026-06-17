/**
 * Types du domaine esport — TEMPORAIRES.
 * Le backend n'existe pas encore : ces types miment la future réponse de
 * notre API interne. Quand la spec OpenAPI sera disponible, ils seront
 * remplacés par les types générés dans `src/api/generated/` (source de
 * vérité = le backend) et ce fichier sera supprimé.
 */

export type GameId =
  | 'val' | 'lol' | 'cs2' | 'dota' | 'rl' | 'ow'
  | 'apex' | 'r6' | 'pubg' | 'fn' | 'ff' | 'mlbb' | 'hok' | 'sf6' | 'tk8' | 'bo7' | 'tft';

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
  /** Icône/logo du jeu (chemin local, ex. /games/icons/val.svg) */
  logoUrl?: string;
  /** Logo horizontal complet (chemin local, ex. /games/full-logo/val.svg) */
  fullLogoUrl?: string;
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

/** Joueur d'un roster d'équipe (ingéré depuis Liquipedia) */
export interface Player {
  id: string;
  /** Pseudo in-game affiché */
  name: string;
  /** Code pays ISO 3166-1 alpha-2 ("FR", "KR"…) */
  countryCode: string;
  /** Poste/rôle ("Duelist", "Mid", "IGL"…) — absent si inconnu */
  role?: string;
}

/** Lien de diffusion d'un match (Twitch, YouTube…) */
export interface Stream {
  /** Plateforme lisible ("Twitch", "YouTube"…) */
  platform: string;
  url: string;
}

/** Stats d'un joueur sur une carte (scoreboard) */
export interface MapPlayer {
  /** Côté du joueur : 'a' = teamA, 'b' = teamB */
  side: 'a' | 'b';
  name: string;
  countryCode: string;
  kills: number;
  deaths: number;
  assists: number;
  /** Average Combat Score (Valorant) */
  acs?: number;
  /** Average Damage per Round (Valorant / CS2) */
  adr?: number;
  /** % de headshots (Valorant) */
  hs?: number;
  /** Agent joué (Valorant) */
  agent?: string;
  /** Champion joué (League of Legends) */
  champion?: string;
  /** Poste/rôle ("Top", "Mid", "Support"…) — League of Legends */
  role?: string;
  /** Héros joué (Dota 2) */
  hero?: string;
  /** Gold par minute (Dota 2) */
  gpm?: number;
  /** XP par minute (Dota 2) */
  xpm?: number;
  /** Last hits / CS (Dota 2) */
  lasthits?: number;
  /** Net worth / or total (Dota 2) */
  networth?: number;
  /** Niveau du héros (Dota 2) */
  level?: number;
}

/** Une étape du veto des cartes (ban / pick / decider) */
export interface VetoStep {
  order: number;
  type: 'ban' | 'pick' | 'decider';
  /** Équipe qui agit ('a'/'b') ; absent pour la decider */
  team?: 'a' | 'b';
  map: string;
}

/** Score d'une carte (map) jouée ou en cours dans un match */
export interface MapScore {
  name: string;
  scoreA: number;
  scoreB: number;
  winner?: 'a' | 'b';
  live?: boolean;
  /** Scoreboard par joueur (si disponible, ex. Valorant) */
  players?: MapPlayer[];
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
  /** Liens de diffusion (Twitch, YouTube…) — absent si non fourni */
  streams?: Stream[];
  /** Veto des cartes (ban/pick/decider) — absent si non fourni */
  veto?: VetoStep[];
  /** Signal best-effort : victoire administrative / forfait probable */
  likelyForfeit?: boolean;
  /** % de la communauté qui pronostique l'équipe A gagnante */
  oddsA?: number;
}
