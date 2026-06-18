import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ForYouPage } from '../ForYouPage';
import type { Match } from '../../types/esports';

vi.mock('../../api/queries/useMatches', () => ({ useMatches: vi.fn() }));
vi.mock('../../api/queries/useGames', () => ({ useGames: vi.fn() }));
vi.mock('../../api/queries/useTeams', () => ({ useTeams: vi.fn() }));
vi.mock('../../api/queries/useUser', () => ({ useUser: vi.fn() }));
vi.mock('../../features/favorites/favoritesContext', () => ({ useFavorites: vi.fn() }));

import { useMatches } from '../../api/queries/useMatches';
import { useGames } from '../../api/queries/useGames';
import { useTeams } from '../../api/queries/useTeams';
import { useUser } from '../../api/queries/useUser';
import { useFavorites } from '../../features/favorites/favoritesContext';

const mockedUseMatches = vi.mocked(useMatches);
const mockedUseGames = vi.mocked(useGames);
const mockedUseTeams = vi.mocked(useTeams);
const mockedUseUser = vi.mocked(useUser);
const mockedUseFavorites = vi.mocked(useFavorites);

const todayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const nowMinusOneHour = (): string => {
  const d = new Date(Date.now() - 60 * 60 * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const baseMatch: Match = {
  id: 'm-for-you',
  gameId: 'dota',
  teamA: { id: 'a', name: 'Flame Esports', tag: 'FE', countryCode: 'TR' },
  teamB: { id: 'b', name: 'Dandelions', tag: 'DAND', countryCode: 'DE' },
  status: 'done',
  phase: 'Playoffs',
  bestOf: 'BO3',
  date: todayIso(),
  time: '09:00',
  scoreA: 2,
  scoreB: 0,
  resultA: 'W',
  resultB: 'L',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForYouPage />
    </MemoryRouter>,
  );

const setDefaultMocks = () => {
  mockedUseMatches.mockReturnValue({ data: [], isPending: false } as never);
  mockedUseGames.mockReturnValue({
    data: [{ id: 'dota', name: 'Dota 2', short: 'Dota', tag: 'DOTA', bgUrl: '/dota.jpg' }],
  } as never);
  mockedUseTeams.mockReturnValue({ data: [] } as never);
  mockedUseUser.mockReturnValue({ data: { name: 'Alice Test', points: 120, globalRank: 42 } } as never);
  mockedUseFavorites.mockReturnValue({ teams: [], games: [], toggleTeam: vi.fn(), toggleGame: vi.fn() });
};

describe('ForYouPage', () => {
  it('shows empty personalization state when no favorites are configured', () => {
    setDefaultMocks();
    renderPage();

    expect(screen.getByText('Personnalise ton feed')).toBeInTheDocument();
    expect(screen.getByText('Ajoute des jeux et équipes favoris pour voir leurs matchs ici.')).toBeInTheDocument();
  });

  it('shows forfeit hint for done likely-forfeit matches in favorite games', () => {
    setDefaultMocks();
    mockedUseFavorites.mockReturnValue({
      teams: [],
      games: ['dota'],
      toggleTeam: vi.fn(),
      toggleGame: vi.fn(),
    });
    mockedUseMatches.mockReturnValue({
      data: [{ ...baseMatch, likelyForfeit: true }],
      isPending: false,
    } as never);

    renderPage();

    expect(screen.getByText('Matchs de mes jeux')).toBeInTheDocument();
    expect(screen.getByText('Forfait')).toBeInTheDocument();
  });

  it('does not show prediction CTA when match already started (cutoff reached)', () => {
    setDefaultMocks();
    mockedUseFavorites.mockReturnValue({
      teams: [],
      games: ['dota'],
      toggleTeam: vi.fn(),
      toggleGame: vi.fn(),
    });
    mockedUseMatches.mockReturnValue({
      data: [
        {
          ...baseMatch,
          id: 'm-live-cutoff',
          status: 'upcoming',
          date: todayIso(),
          time: nowMinusOneHour(),
          scoreA: undefined,
          scoreB: undefined,
          resultA: undefined,
          resultB: undefined,
        },
      ],
      isPending: false,
    } as never);

    renderPage();

    expect(screen.getByText('En direct')).toBeInTheDocument();
    expect(screen.queryByText('Pronostiquer')).not.toBeInTheDocument();
  });
});
