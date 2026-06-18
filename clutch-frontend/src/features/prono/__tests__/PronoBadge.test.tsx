import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Match } from '../../../types/esports';
import { PredictionsContext, type Predictions } from '../predictionsContext';
import { PronoBadge } from '../PronoBadge';

const baseMatch: Match = {
  id: 'm-prono',
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
};

const renderWithPredictions = (predictions: Predictions['predictions'], match: Match = baseMatch) => {
  const value: Predictions = {
    predictions,
    setPrediction: () => undefined,
    predictedWinnerId: () => null,
  };

  return render(
    <PredictionsContext.Provider value={value}>
      <PronoBadge match={match} />
    </PredictionsContext.Provider>,
  );
};

describe('PronoBadge scoring display', () => {
  it('shows +25 for an exact score prediction', () => {
    renderWithPredictions({
      'm-prono': { pick: 'a', scoreA: 2, scoreB: 0 },
    });

    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  it('shows +10 for correct winner with wrong exact score', () => {
    renderWithPredictions({
      'm-prono': { pick: 'a', scoreA: 2, scoreB: 1 },
    });

    expect(screen.getByText('+10')).toBeInTheDocument();
  });
});
