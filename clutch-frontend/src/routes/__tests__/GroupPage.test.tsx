import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PredictionsContext, type Predictions } from '../../features/prono/predictionsContext';
import { GroupPage } from '../GroupPage';
import type { Match } from '../../types/esports';

vi.mock('../../api/queries/useGroups', () => ({
  useGroup: vi.fn(),
  useGroupHistory: vi.fn(),
  useDeleteGroup: vi.fn(),
  useLeaveGroup: vi.fn(),
  useRemoveMember: vi.fn(),
}));
vi.mock('../../api/queries/useMatches', () => ({ useMatches: vi.fn() }));
vi.mock('../../api/queries/useGames', () => ({ useGames: vi.fn() }));

import {
  useDeleteGroup,
  useGroup,
  useGroupHistory,
  useLeaveGroup,
  useRemoveMember,
} from '../../api/queries/useGroups';
import { useMatches } from '../../api/queries/useMatches';
import { useGames } from '../../api/queries/useGames';

const mockedUseGroup = vi.mocked(useGroup);
const mockedUseGroupHistory = vi.mocked(useGroupHistory);
const mockedUseMatches = vi.mocked(useMatches);
const mockedUseGames = vi.mocked(useGames);
const mockedUseDeleteGroup = vi.mocked(useDeleteGroup);
const mockedUseLeaveGroup = vi.mocked(useLeaveGroup);
const mockedUseRemoveMember = vi.mocked(useRemoveMember);

const predictionsValue: Predictions = {
  predictions: {},
  setPrediction: vi.fn(),
  predictedWinnerId: () => null,
};

const todayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const addHours = (hours: number): string => {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const baseMatch: Match = {
  id: 'm-group',
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
  mockedUseGroup.mockReturnValue({
    data: {
      id: 'g1',
      name: 'Ligue Dota',
      emoji: '🔥',
      code: 'ABC123',
      gameIds: ['dota'],
      isAdmin: true,
      members: [
        { name: 'Alice', tag: 'ALC', points: 120, isMe: true },
        { name: 'Bob', tag: 'BOB', points: 80 },
      ],
    },
    isPending: false,
    isError: false,
  } as never);
  mockedUseGroupHistory.mockReturnValue({ data: [], isPending: false } as never);
  mockedUseMatches.mockReturnValue({ data: [], isPending: false } as never);
  mockedUseGames.mockReturnValue({
    data: [{ id: 'dota', name: 'Dota 2', short: 'Dota', tag: 'DOTA', bgUrl: '/dota.jpg' }],
  } as never);
  mockedUseDeleteGroup.mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  mockedUseLeaveGroup.mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  mockedUseRemoveMember.mockReturnValue({ mutate: vi.fn() } as never);
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/ligues/g1']}>
      <PredictionsContext.Provider value={predictionsValue}>
        <Routes>
          <Route path="/ligues/:id" element={<GroupPage />} />
        </Routes>
      </PredictionsContext.Provider>
    </MemoryRouter>,
  );

describe('GroupPage', () => {
  it('filters upcoming predictions by group scope and prediction cutoff', () => {
    setDefaultMocks();
    mockedUseMatches.mockReturnValue({
      data: [
        { ...baseMatch, id: 'open-dota', gameId: 'dota', date: '2099-06-17', time: '12:00' },
        { ...baseMatch, id: 'other-game', gameId: 'val' },
        { ...baseMatch, id: 'started', gameId: 'dota', date: '2000-01-01', time: '12:00' },
      ],
      isPending: false,
    } as never);

    renderPage();

    expect(screen.getByText(/À pronostiquer/i)).toBeInTheDocument();
    expect(screen.getByText('Flame Esports')).toBeInTheDocument();
    expect(screen.queryByText('Aucun match à venir dans cette ligue.')).not.toBeInTheDocument();
  });

  it('renders finished match history with my prediction and points', () => {
    setDefaultMocks();
    mockedUseGroupHistory.mockReturnValue({
      data: [
        {
          match: {
            ...baseMatch,
            id: 'done-history',
            status: 'done',
            scoreA: 2,
            scoreB: 0,
            time: '09:00',
          },
          members: [
            {
              name: 'Alice',
              tag: 'ALC',
              isMe: true,
              prediction: { pick: 'a', scoreA: 2, scoreB: 0 },
              points: 25,
            },
            {
              name: 'Bob',
              tag: 'BOB',
              prediction: { pick: 'b', scoreA: 1, scoreB: 2 },
              points: 0,
            },
          ],
        },
      ],
      isPending: false,
    } as never);

    renderPage();

    expect(screen.getByText(/Matchs terminés/i)).toBeInTheDocument();
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('Mon prono : FE 2–0')).toBeInTheDocument();
    expect(screen.getByText('Alice (moi) 2-0')).toBeInTheDocument();
  });

  it('switches to classement tab and shows ranked members', async () => {
    setDefaultMocks();
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Classement' }));

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('120').length).toBeGreaterThan(0);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('admin can open settings sheet with copy code option', async () => {
    setDefaultMocks();
    const user = userEvent.setup();

    renderPage();

    const settingsBtn = screen.getByText('Réglages');
    await user.click(settingsBtn);

    expect(screen.getByText('Copier le code')).toBeInTheDocument();
    expect(screen.getAllByText('ABC123').length).toBeGreaterThan(1);
  });

  it('non-admin cannot see member deletion option', () => {
    setDefaultMocks();
    mockedUseGroup.mockReturnValue({
      data: {
        id: 'g1',
        name: 'Ligue Dota',
        emoji: '🔥',
        code: 'ABC123',
        gameIds: ['dota'],
        isAdmin: false,
        members: [
          { name: 'Alice', tag: 'ALC', points: 120, isMe: true },
          { name: 'Bob', tag: 'BOB', points: 80 },
        ],
      },
      isPending: false,
      isError: false,
    } as never);

    renderPage();

    const settingsBtn = screen.getByText('Réglages');
    expect(settingsBtn).toBeInTheDocument();
    expect(screen.queryByText('Supprimer des participants')).not.toBeInTheDocument();
  });
});
