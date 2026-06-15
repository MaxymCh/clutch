import type { BestOf, GameId, Match, MatchStatus } from '../../types/esports';
import { TEAMS } from './catalog';

/**
 * Fixtures — matchs de l'EWC 2026 (fictifs, réalistes : noms longs, plusieurs
 * jeux, les trois statuts). Supprimé quand l'API interne sera branchée.
 */

/** « Aujourd'hui » figé côté fixtures (jour 2 du tournoi) */
export const FIXTURE_TODAY = '2026-07-11';

// [game, teamA, teamB, status, phase, bestOf, date, time, scoreA?, scoreB?]
type Row = [GameId, string, string, MatchStatus, string, BestOf, string, string, number?, number?];

const ROWS: Row[] = [
  // 10 juil — hier (terminés)
  ['val', 'sen', 'drx', 'done', 'Phase de groupes', 'BO3', '2026-07-10', '14:00', 2, 0],
  ['cs2', 'g2', 'eg', 'done', 'Phase de groupes', 'BO3', '2026-07-10', '17:00', 2, 1],
  ['lol', 'blg', 'tl', 'done', 'Phase de groupes', 'BO3', '2026-07-10', '20:00', 0, 2],
  // 11 juil — aujourd'hui
  ['rl', 'vit', 'g2', 'done', 'Quart de finale', 'BO5', '2026-07-11', '13:30', 4, 2],
  ['val', 'drx', 'fnc', 'done', 'Quart de finale', 'BO3', '2026-07-11', '15:30', 0, 2],
  ['val', 'flcn', 't1', 'live', 'Demi-finale', 'BO5', '2026-07-11', '18:00', 2, 1],
  ['cs2', 'faze', 'navi', 'live', 'Quart de finale', 'BO3', '2026-07-11', '18:30', 1, 1],
  ['lol', 'geng', 'blg', 'upcoming', 'Demi-finale', 'BO5', '2026-07-11', '20:00'],
  ['dota', 'spirit', 'tl', 'upcoming', 'Quart de finale', 'BO3', '2026-07-11', '21:30'],
  // 12 juil — demain
  ['val', 'sen', 'geng', 'upcoming', 'Quart de finale', 'BO3', '2026-07-12', '16:00'],
  ['lol', 't1', 'fnc', 'upcoming', 'Finale', 'BO5', '2026-07-12', '19:00'],
  ['cs2', 'flcn', 'vit', 'upcoming', 'Demi-finale', 'BO3', '2026-07-12', '21:00'],
  // 13 juil
  ['rl', 'vit', 'faze', 'upcoming', 'Demi-finale', 'BO5', '2026-07-13', '15:00'],
  ['dota', 'spirit', 'navi', 'upcoming', 'Demi-finale', 'BO3', '2026-07-13', '17:00'],
  ['val', 'flcn', 'fnc', 'upcoming', 'Finale', 'BO5', '2026-07-13', '19:30'],
  // 14 juil
  ['lol', 'geng', 't1', 'upcoming', 'Grande Finale', 'BO5', '2026-07-14', '17:30'],
  ['cs2', 'navi', 'faze', 'upcoming', 'Grande Finale', 'BO5', '2026-07-14', '20:00'],
];

// Cartes jouées, indexées par id de match (déterministe, pas d'aléatoire)
const MAPS: Record<string, Match['maps']> = {
  m1: [
    { name: 'Ascent', scoreA: 13, scoreB: 7, winner: 'a' },
    { name: 'Bind', scoreA: 13, scoreB: 10, winner: 'a' },
  ],
  m2: [
    { name: 'Inferno', scoreA: 13, scoreB: 9, winner: 'a' },
    { name: 'Mirage', scoreA: 8, scoreB: 13, winner: 'b' },
    { name: 'Nuke', scoreA: 13, scoreB: 11, winner: 'a' },
  ],
  m3: [
    { name: 'Faille 1', scoreA: 0, scoreB: 1, winner: 'b' },
    { name: 'Faille 2', scoreA: 0, scoreB: 1, winner: 'b' },
  ],
  m4: [
    { name: 'Manche 1', scoreA: 3, scoreB: 2, winner: 'a' },
    { name: 'Manche 2', scoreA: 1, scoreB: 2, winner: 'b' },
    { name: 'Manche 3', scoreA: 4, scoreB: 1, winner: 'a' },
    { name: 'Manche 4', scoreA: 2, scoreB: 3, winner: 'b' },
    { name: 'Manche 5', scoreA: 3, scoreB: 0, winner: 'a' },
    { name: 'Manche 6', scoreA: 5, scoreB: 2, winner: 'a' },
  ],
  m5: [
    { name: 'Lotus', scoreA: 9, scoreB: 13, winner: 'b' },
    { name: 'Haven', scoreA: 11, scoreB: 13, winner: 'b' },
  ],
  m6: [
    { name: 'Ascent', scoreA: 13, scoreB: 6, winner: 'a' },
    { name: 'Bind', scoreA: 9, scoreB: 13, winner: 'b' },
    { name: 'Lotus', scoreA: 13, scoreB: 10, winner: 'a' },
    { name: 'Split', scoreA: 11, scoreB: 9, live: true },
  ],
  m7: [
    { name: 'Inferno', scoreA: 13, scoreB: 8, winner: 'a' },
    { name: 'Ancient', scoreA: 10, scoreB: 13, winner: 'b' },
    { name: 'Anubis', scoreA: 7, scoreB: 5, live: true },
  ],
};

const LIVE_EXTRAS: Record<string, Pick<Match, 'currentMapLabel' | 'viewers'>> = {
  m6: { currentMapLabel: 'Split · 11–9', viewers: '74K' },
  m7: { currentMapLabel: 'Anubis · 7–5', viewers: '52K' },
};

// % de picks « équipe A » par match (cote communautaire fictive)
const ODDS_A = [62, 48, 71, 55, 40, 58, 66, 44, 52, 60, 47, 69, 51, 57, 43, 64, 50];

export const MATCHES: Match[] = ROWS.map((r, i) => {
  const [gameId, a, b, status, phase, bestOf, date, time, scoreA, scoreB] = r;
  const id = `m${i + 1}`;
  return {
    oddsA: ODDS_A[i] ?? 50,
    id,
    gameId,
    teamA: TEAMS[a],
    teamB: TEAMS[b],
    status,
    phase,
    bestOf,
    date,
    time,
    scoreA,
    scoreB,
    maps: MAPS[id],
    ...LIVE_EXTRAS[id],
  };
});
