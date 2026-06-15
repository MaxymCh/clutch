import type { Game, GameId, Team } from '../../types/esports';

/**
 * Fixtures — catalogue jeux + équipes (EWC 2026 fictif, aucun asset officiel).
 * Supprimé quand l'API interne sera branchée.
 */

export const GAMES: Record<GameId, Game> = {
  val: { id: 'val', name: 'Valorant', short: 'Valorant', tag: 'VAL', bgUrl: '' },
  lol: { id: 'lol', name: 'League of Legends', short: 'LoL', tag: 'LOL', bgUrl: '' },
  cs2: { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', tag: 'CS2', bgUrl: '' },
  dota: { id: 'dota', name: 'Dota 2', short: 'Dota 2', tag: 'DOTA', bgUrl: '' },
  rl: { id: 'rl', name: 'Rocket League', short: 'Rocket L.', tag: 'RL', bgUrl: '' },
  ow: { id: 'ow', name: 'Overwatch 2', short: 'Overwatch', tag: 'OW', bgUrl: '' },
};

export const GAME_ORDER: GameId[] = ['val', 'lol', 'cs2', 'dota', 'rl', 'ow'];

export const TEAMS: Record<string, Team> = {
  flcn: { id: 'flcn', name: 'Team Falcons', tag: 'FLCN', countryCode: 'SA' },
  t1: { id: 't1', name: 'T1', tag: 'T1', countryCode: 'KR' },
  g2: { id: 'g2', name: 'G2 Esports', tag: 'G2', countryCode: 'EU' },
  faze: { id: 'faze', name: 'FaZe Clan', tag: 'FAZE', countryCode: 'US' },
  fnc: { id: 'fnc', name: 'Fnatic', tag: 'FNC', countryCode: 'EU' },
  navi: { id: 'navi', name: 'Natus Vincere', tag: 'NAVI', countryCode: 'UA' },
  geng: { id: 'geng', name: 'Gen.G', tag: 'GENG', countryCode: 'KR' },
  tl: { id: 'tl', name: 'Team Liquid', tag: 'TL', countryCode: 'EU' },
  vit: { id: 'vit', name: 'Team Vitality', tag: 'VIT', countryCode: 'FR' },
  spirit: { id: 'spirit', name: 'Team Spirit', tag: 'TS', countryCode: 'RU' },
  blg: { id: 'blg', name: 'Bilibili Gaming', tag: 'BLG', countryCode: 'CN' },
  drx: { id: 'drx', name: 'DRX', tag: 'DRX', countryCode: 'KR' },
  sen: { id: 'sen', name: 'Sentinels', tag: 'SEN', countryCode: 'US' },
  eg: { id: 'eg', name: 'Evil Geniuses', tag: 'EG', countryCode: 'US' },
};
