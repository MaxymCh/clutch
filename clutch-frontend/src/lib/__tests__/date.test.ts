import { describe, expect, it } from 'vitest';
import type { Match } from '../../types/esports';
import { canPredictMatch, isMatchLive, phaseMetaLabel } from '../date';

const baseMatch: Match = {
  id: 'm1',
  gameId: 'dota',
  teamA: { id: 'a', name: 'Alpha', tag: 'ALP', countryCode: 'FR' },
  teamB: { id: 'b', name: 'Beta', tag: 'BET', countryCode: 'DE' },
  status: 'upcoming',
  phase: 'Finale',
  bestOf: 'BO3',
  date: '2026-06-20',
  time: '18:00',
};

describe('canPredictMatch', () => {
  it('returns true before start time for upcoming matches', () => {
    const now = new Date('2026-06-20T17:59:00');
    expect(canPredictMatch(baseMatch, now)).toBe(true);
  });

  it('returns false at or after start time', () => {
    expect(canPredictMatch(baseMatch, new Date('2026-06-20T18:00:00'))).toBe(false);
    expect(canPredictMatch(baseMatch, new Date('2026-06-20T18:10:00'))).toBe(false);
  });

  it('returns false for done matches even if date is in the future', () => {
    const doneMatch: Match = { ...baseMatch, status: 'done' };
    expect(canPredictMatch(doneMatch, new Date('2026-06-20T17:00:00'))).toBe(false);
  });
});

describe('isMatchLive', () => {
  it('returns true for upcoming matches once start time has been reached', () => {
    expect(isMatchLive(baseMatch, new Date('2026-06-20T18:00:00'))).toBe(true);
    expect(isMatchLive(baseMatch, new Date('2026-06-20T18:30:00'))).toBe(true);
  });

  it('returns false before start or when match is done', () => {
    expect(isMatchLive(baseMatch, new Date('2026-06-20T17:59:00'))).toBe(false);
    expect(isMatchLive({ ...baseMatch, status: 'done' }, new Date('2026-06-20T18:30:00'))).toBe(false);
  });
});

describe('phaseMetaLabel', () => {
  it('converts date-like phases to localized day-month labels', () => {
    expect(phaseMetaLabel('June 17', '2026-06-17')).toBe('17 juin');
  });

  it('keeps regular phase labels untouched', () => {
    expect(phaseMetaLabel('Upper Bracket Semi')).toBe('Upper Bracket Semi');
  });
});
