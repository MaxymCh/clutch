import type { Game, GameId, Team } from '../../types/esports';

/**
 * Fixtures — catalogue jeux + équipes (EWC 2026 fictif, aucun asset officiel).
 * Supprimé quand l'API interne sera branchée.
 */

export const GAMES: Record<GameId, Game> = {
  val: { id: 'val', name: 'Valorant', short: 'Valorant', tag: 'VAL', bgUrl: '/games/bg/val.jpg', logoUrl: '/games/icons/val.svg', fullLogoUrl: '/games/full-logo/val.svg' },
  lol: { id: 'lol', name: 'League of Legends', short: 'LoL', tag: 'LOL', bgUrl: '/games/bg/lol.jpg', logoUrl: '/games/icons/lol.svg', fullLogoUrl: '/games/full-logo/lol.png' },
  cs2: { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', tag: 'CS2', bgUrl: '/games/bg/cs2.jpg', logoUrl: '/games/icons/cs2.svg', fullLogoUrl: '/games/full-logo/cs2.svg' },
  dota: { id: 'dota', name: 'Dota 2', short: 'Dota 2', tag: 'DOTA', bgUrl: '/games/bg/dota.jpg', logoUrl: '/games/icons/dota.svg', fullLogoUrl: '/games/full-logo/dota.svg' },
  rl: { id: 'rl', name: 'Rocket League', short: 'Rocket L.', tag: 'RL', bgUrl: '/games/bg/rl.jpg', logoUrl: '/games/icons/rl.svg', fullLogoUrl: '/games/full-logo/rl.png' },
  ow: { id: 'ow', name: 'Overwatch 2', short: 'Overwatch', tag: 'OW', bgUrl: '/games/bg/ow.jpg', logoUrl: '/games/icons/ow.svg', fullLogoUrl: '/games/full-logo/ow.svg' },
  apex: { id: 'apex', name: 'Apex Legends', short: 'Apex', tag: 'APEX', bgUrl: '/games/bg/apex.jpg', logoUrl: '/games/icons/apex.svg', fullLogoUrl: '/games/full-logo/apex.png' },
  r6: { id: 'r6', name: 'Rainbow Six Siege', short: 'R6', tag: 'R6', bgUrl: '/games/bg/r6.jpg', logoUrl: '/games/icons/r6.svg', fullLogoUrl: '/games/full-logo/r6.png' },
  pubg: { id: 'pubg', name: 'PUBG Mobile', short: 'PUBG', tag: 'PUBG', bgUrl: '/games/bg/pubg.png', logoUrl: '/games/icons/pubg-mobile.svg', fullLogoUrl: '/games/full-logo/pubg-mobile.png' },
  fn: { id: 'fn', name: 'Fortnite', short: 'Fortnite', tag: 'FN', bgUrl: '/games/bg/fortnite.png', logoUrl: '/games/icons/fortnite.svg', fullLogoUrl: '/games/full-logo/fortnite.png' },
  ff: { id: 'ff', name: 'Free Fire', short: 'Free Fire', tag: 'FF', bgUrl: '/games/bg/free-fire.png', logoUrl: '/games/icons/free-fire.svg', fullLogoUrl: '/games/full-logo/free-fire.svg' },
  mlbb: { id: 'mlbb', name: 'Mobile Legends', short: 'MLBB', tag: 'MLBB', bgUrl: '/games/bg/mobile-legends.png', logoUrl: '/games/icons/mobile-legends.svg', fullLogoUrl: '/games/full-logo/mobile-legends.png' },
  hok: { id: 'hok', name: 'Honor of Kings', short: 'HoK', tag: 'HOK', bgUrl: '/games/bg/honor-of-king.png', logoUrl: '/games/icons/honor-of-king.svg', fullLogoUrl: '/games/full-logo/honor-of-king.png' },
  sf6: { id: 'sf6', name: 'Street Fighter 6', short: 'SF6', tag: 'SF6', bgUrl: '/games/bg/street-fighter.jpg', logoUrl: '/games/icons/street-fighter.svg', fullLogoUrl: '/games/full-logo/street-fighter.svg' },
  tk8: { id: 'tk8', name: 'Tekken 8', short: 'Tekken 8', tag: 'TK8', bgUrl: '/games/bg/tekken-8.jpg', logoUrl: '/games/icons/tekken-8.svg', fullLogoUrl: '/games/full-logo/tekken-8.svg' },
  bo7: { id: 'bo7', name: 'Call of Duty: BO7', short: 'CoD BO7', tag: 'COD', bgUrl: '/games/bg/bo7.png', logoUrl: '/games/icons/bo7.svg', fullLogoUrl: '/games/full-logo/bo7.svg' },
  tft: { id: 'tft', name: 'Teamfight Tactics', short: 'TFT', tag: 'TFT', bgUrl: '/games/bg/tt.png', logoUrl: '/games/icons/tft.svg', fullLogoUrl: '/games/full-logo/tft.svg' },
};

export const GAME_ORDER: GameId[] = [
  'val', 'lol', 'cs2', 'dota', 'rl', 'ow',
  'apex', 'r6', 'pubg', 'fn', 'ff', 'mlbb', 'hok', 'sf6', 'tk8', 'bo7', 'tft',
];

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
