import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Match } from '../../../types/esports';
import { PredictionsContext, type Predictions } from '../../prono/predictionsContext';
import { MatchCard } from '../MatchCard';

const match: Match = {
  id: 'm-ff',
  gameId: 'dota',
  teamA: { id: 'a', name: 'Flame Esports', tag: 'FE', countryCode: 'TR' },
  teamB: { id: 'b', name: 'Dandelions', tag: 'DAND', countryCode: 'DE' },
  status: 'done',
  phase: 'Playoffs',
  bestOf: 'BO3',
  date: '2026-06-17',
  time: '09:00',
  scoreA: 2,
  scoreB: 0,
  resultA: 'W',
  resultB: 'FF',
  likelyForfeit: true,
};

const predictionsValue: Predictions = {
  predictions: {},
  setPrediction: () => undefined,
  predictedWinnerId: () => null,
};

describe('MatchCard forfeit display', () => {
  it('shows the forfeit label for FF results', () => {
    render(
      <MemoryRouter>
        <PredictionsContext.Provider value={predictionsValue}>
          <MatchCard match={match} gameTag="DOTA" />
        </PredictionsContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Forfait')).toBeInTheDocument();
    expect(screen.getByText('FF')).toBeInTheDocument();
  });
});
