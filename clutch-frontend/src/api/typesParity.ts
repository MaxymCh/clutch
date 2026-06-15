/**
 * Garde de parité front ↔ backend, vérifiée À LA COMPILATION.
 *
 * Les types applicatifs (`src/types/*`) doivent rester assignables aux
 * schémas générés depuis l'OpenAPI du backend (`npm run gen:api`). Si le
 * backend renomme/retype un champ, `tsc` casse ici — pas en prod.
 * (Seul écart toléré : les champs `null` côté OpenAPI, absents côté front
 * car l'API les omet via exclude_none.)
 */
import type {
  Group,
  LeaderboardEntry,
  Prediction,
  User,
} from '../types/community';
import type { Game, Match, Team } from '../types/esports';
import type { components } from './generated/schema';

type Assignable<A, B> = A extends B ? true : false;

export type GameParity = Assignable<Game, components['schemas']['GameOut']>;
export type TeamParity = Assignable<Team, components['schemas']['TeamOut']>;
export type MatchParity = Assignable<Match, components['schemas']['MatchOut']>;
export type UserParity = Assignable<User, components['schemas']['UserOut']>;
export type GroupParity = Assignable<Group, components['schemas']['GroupOut']>;
export type LeaderboardParity = Assignable<LeaderboardEntry, components['schemas']['LeaderboardEntryOut']>;
export type PredictionParity = Assignable<Prediction, components['schemas']['PredictionOut']>;

// Si l'un de ces types devient `false`, le contrat a divergé : régénérer
// les types (npm run gen:api) et corriger AVANT de continuer.
type AssertAllTrue<T extends true[]> = T;
export type ContractIsAligned = AssertAllTrue<
  [GameParity, TeamParity, MatchParity, UserParity, GroupParity, LeaderboardParity, PredictionParity]
>;
