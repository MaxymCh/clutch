import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Match } from '../../../types/esports';
import { PredictionsContext, type Predictions } from '../predictionsContext';
import { PredictSheet } from '../PredictSheet';

const baseMatch: Match = {
  id: 'm-predict-sheet',
  gameId: 'dota',
  teamA: { id: 'a', name: 'Flame Esports', tag: 'FE', countryCode: 'TR' },
  teamB: { id: 'b', name: 'Dandelions', tag: 'DAND', countryCode: 'DE' },
  status: 'upcoming',
  phase: 'Playoffs',
  bestOf: 'BO3',
  date: '2099-06-17',
  time: '09:00',
  oddsA: 60,
};

const renderWithContext = (
  match: Match | null,
  overrides?: Partial<Predictions>,
  onClose: () => void = vi.fn(),
) => {
  const value: Predictions = {
    predictions: {},
    setPrediction: vi.fn(),
    predictedWinnerId: () => null,
    ...overrides,
  };

  const view = render(
    <PredictionsContext.Provider value={value}>
      <PredictSheet match={match} onClose={onClose} />
    </PredictionsContext.Provider>,
  );

  return { ...view, value, onClose };
};

describe('PredictSheet', () => {
  it('does not render when match is null', () => {
    renderWithContext(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits selected winner and exact score with proper score mapping', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { value } = renderWithContext(baseMatch, undefined, onClose);

    await user.click(screen.getByRole('button', { name: /dandelions/i }));
    await user.click(screen.getByRole('button', { name: '2–1' }));
    await user.click(screen.getByRole('button', { name: /valider mon prono/i }));

    expect(value.setPrediction).toHaveBeenCalledWith('m-predict-sheet', {
      pick: 'b',
      scoreA: 1,
      scoreB: 2,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows closed state and disabled action for done matches', () => {
    const doneMatch: Match = { ...baseMatch, status: 'done', date: '2025-01-01' };
    renderWithContext(doneMatch);

    expect(screen.getByText('Ce match a commencé, les pronostics sont fermés.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pronostics fermés/i })).toBeDisabled();
  });
});
