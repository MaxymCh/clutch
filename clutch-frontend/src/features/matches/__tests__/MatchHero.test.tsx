import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Match } from '../../../types/esports';
import { MatchHero } from '../MatchHero';

const baseMatch: Match = {
  id: 'm-hero',
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
  resultB: 'L',
};

describe('MatchHero forfeit hints', () => {
  it('shows probable forfeit hint when match is done and likelyForfeit is true without FF result', () => {
    render(
      <MemoryRouter>
        <MatchHero match={{ ...baseMatch, likelyForfeit: true }} gameName="Dota 2" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Forfait probable')).toBeInTheDocument();
  });

  it('shows forfeit state and hides probable hint when explicit FF result exists', () => {
    render(
      <MemoryRouter>
        <MatchHero
          match={{ ...baseMatch, resultB: 'FF', likelyForfeit: true }}
          gameName="Dota 2"
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Forfait').length).toBeGreaterThan(0);
    expect(screen.queryByText('Forfait probable')).not.toBeInTheDocument();
  });
});
