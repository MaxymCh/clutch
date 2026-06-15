import type { Group, LeaderboardEntry, User } from '../../types/community';

/**
 * Fixtures — utilisateur courant, groupes de pronostics, classement mondial.
 * Supprimé quand l'API interne sera branchée.
 */

export const USER: User = {
  id: 'you',
  name: 'Toi',
  tag: 'YOU',
  countryCode: 'FR',
  points: 1240,
  globalRank: 8421,
  streak: 3,
};

export const GROUPS_SEED: Group[] = [
  {
    id: 'g1',
    name: 'Les Clutchers',
    emoji: '🔥',
    code: 'CLTCH-7K2',
    members: [
      { name: 'Naël', tag: 'NL', points: 1480 },
      { name: 'Toi', tag: 'YOU', points: 1240, isMe: true },
      { name: 'Sofia', tag: 'SF', points: 1185 },
      { name: 'Marco', tag: 'MC', points: 980 },
      { name: 'Inès', tag: 'IN', points: 870 },
    ],
  },
  {
    id: 'g2',
    name: 'Bureau Esport',
    emoji: '🏢',
    code: 'BURO-X91',
    members: [
      { name: 'Toi', tag: 'YOU', points: 1240, isMe: true },
      { name: 'Karim', tag: 'KA', points: 1120 },
      { name: 'Lena', tag: 'LN', points: 1040 },
      { name: 'Tom', tag: 'TM', points: 760 },
    ],
  },
];

export const GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'kaori_gg', tag: 'KA', points: 3120, countryCode: 'JP' },
  { rank: 2, name: 'ZeusFR', tag: 'ZE', points: 3040, countryCode: 'FR' },
  { rank: 3, name: 'mikael', tag: 'MI', points: 2980, countryCode: 'SE' },
  { rank: 4, name: 'duda', tag: 'DU', points: 2870, countryCode: 'BR' },
  { rank: 5, name: 'noemie.v', tag: 'NO', points: 2790, countryCode: 'FR' },
  { rank: 6, name: 'tarik_h', tag: 'TA', points: 2710, countryCode: 'MA' },
  { rank: 7, name: 'wang.l', tag: 'WA', points: 2655, countryCode: 'CN' },
];
