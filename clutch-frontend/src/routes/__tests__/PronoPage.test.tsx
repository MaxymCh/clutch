import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PredictionsContext, type Predictions } from '../../features/prono/predictionsContext';
import { PronoPage } from '../PronoPage';
import type { Match } from '../../types/esports';

vi.mock('../../api/queries/useGroups', () => ({ useGroups: vi.fn() }));
vi.mock('../../api/queries/useMatches', () => ({ useMatches: vi.fn(), usePredictionHistory: vi.fn() }));
vi.mock('../../api/queries/useGames', () => ({ useGames: vi.fn() }));
vi.mock('../../api/queries/useUser', () => ({ useUser: vi.fn() }));
vi.mock('../../api/queries/useLeaderboard', () => ({ useLeaderboard: vi.fn() }));

import { useGroups } from '../../api/queries/useGroups';
import { useMatches, usePredictionHistory } from '../../api/queries/useMatches';
import { useGames } from '../../api/queries/useGames';
import { useUser } from '../../api/queries/useUser';
import { useLeaderboard } from '../../api/queries/useLeaderboard';

const mockedUseGroups = vi.mocked(useGroups);
const mockedUseMatches = vi.mocked(useMatches);
const mockedUsePredictionHistory = vi.mocked(usePredictionHistory);
const mockedUseGames = vi.mocked(useGames);
const mockedUseUser = vi.mocked(useUser);
const mockedUseLeaderboard = vi.mocked(useLeaderboard);

const predictionsValue: Predictions = {
  predictions: {},
  setPrediction: vi.fn(),
  predictedWinnerId: () => null,
};

const baseMatch: Match = {
  id: 'm-prono-page',
  gameId: 'dota',
  teamA: { id: 'a', name: 'Flame Esports', tag: 'FE', countryCode: 'TR' },
  teamB: { id: 'b', name: 'Dandelions', tag: 'DAND', countryCode: 'DE' },
  status: 'upcoming',
  phase: 'Playoffs',
  bestOf: 'BO3',
  date: '2099-06-17',
  time: '09:00',
};

const setDefaultMocks = () => {
  mockedUseGroups.mockReturnValue({ data: [] } as never);
  mockedUseMatches.mockReturnValue({ data: [], isPending: false } as never);
  mockedUsePredictionHistory.mockReturnValue({ data: [], isPending: false } as never);
  mockedUseGames.mockReturnValue({
    data: [{ id: 'dota', name: 'Dota 2', short: 'Dota', tag: 'DOTA', bgUrl: '/dota.jpg' }],
  } as never);
  mockedUseUser.mockReturnValue({
    data: { name: 'Alice Test', tag: 'ALC', points: 120, globalRank: 42, countryCode: 'FR', streak: 2, id: 'u1' },
  } as never);
  mockedUseLeaderboard.mockReturnValue({ data: [], isPending: false } as never);
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <PredictionsContext.Provider value={predictionsValue}>
        <PronoPage />
      </PredictionsContext.Provider>
    </MemoryRouter>,
  );

describe('PronoPage', () => {
  it('shows only predict-open matches in "A pronostiquer"', () => {
    setDefaultMocks();
    mockedUseMatches.mockReturnValue({
      data: [
        { ...baseMatch, id: 'open', date: '2099-06-17', time: '12:00' },
        { ...baseMatch, id: 'closed', date: '2000-01-01', time: '12:00' },
      ],
      isPending: false,
    } as never);

    renderPage();

    expect(screen.getByText(/À pronostiquer/i)).toBeInTheDocument();
    expect(screen.getByText('Flame Esports')).toBeInTheDocument();
    expect(screen.queryByText('Prêt à jouer ?')).not.toBeInTheDocument();
  });

  it('renders history entry with points and exact prediction text', () => {
    setDefaultMocks();
    mockedUsePredictionHistory.mockReturnValue({
      data: [
        {
          match: {
            ...baseMatch,
            id: 'done-1',
            status: 'done',
            scoreA: 2,
            scoreB: 0,
            time: '09:00',
          },
          prediction: { pick: 'a', scoreA: 2, scoreB: 0 },
          points: 25,
        },
      ],
      isPending: false,
    } as never);

    renderPage();

    expect(screen.getByText('Pronos passés')).toBeInTheDocument();
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('Mon prono : FE 2–0')).toBeInTheDocument();
  });

  it('switches to classement tab and shows global ranking row', async () => {
    setDefaultMocks();
    mockedUseLeaderboard.mockReturnValue({
      data: [
        { rank: 1, name: 'Alice Test', tag: 'ALC', points: 120, countryCode: 'FR' },
      ],
      isPending: false,
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: 'Classement' }));

    expect(screen.getAllByText('Alice Test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('120').length).toBeGreaterThan(0);
  });
});
