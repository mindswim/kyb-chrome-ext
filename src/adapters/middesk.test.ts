import { describe, expect, it } from 'vitest';
import { matchCardsFromMiddesk, profileFromMiddesk, type MiddeskBusiness } from './middesk';
import api from '../fixtures/middesk-api.json';

const business = api.business as unknown as MiddeskBusiness;

describe('profileFromMiddesk', () => {
  const profile = profileFromMiddesk(business);

  it('maps registrations with their normalized standing and filing detail', () => {
    const wa = profile.rows.find((r) => r.label === 'WA');
    expect(wa?.value).toBe('Active · good standing');
    expect(wa?.detail).toContain('file 604112233');
    expect(wa?.status).toBe('success');
  });

  it('maps TIN verification and watchlists into federal rows', () => {
    const tin = profile.rows.find((r) => r.label === 'TIN Match');
    expect(tin?.value).toBe('Verified by IRS');
    expect(tin?.status).toBe('success');
    const watch = profile.rows.find((r) => r.label === 'Watchlists');
    expect(watch?.value).toBe('No hits');
  });

  it('carries header metadata from the response', () => {
    expect(profile.name).toBe('Paseo, Inc.');
    expect(profile.domain).toBe('paseo.example');
    expect(profile.location).toBe('Seattle, WA');
  });
});

describe('matchCardsFromMiddesk', () => {
  const cards = matchCardsFromMiddesk(business);

  it('builds the verification stack in their field order and vocabulary', () => {
    expect(cards.map((c) => c.label)).toEqual([
      'Business name',
      'Office address',
      'SOS Filings',
      'TIN',
      'People',
      'Watchlists',
    ]);
    expect(cards.every((c) => c.match === 'Match' || c.match === 'No hits')).toBe(true);
  });

  it('shows the EIN, the filings summary, and collapsed people', () => {
    expect(cards.find((c) => c.label === 'TIN')?.value).toBe('82-4159401');
    expect(cards.find((c) => c.label === 'SOS Filings')?.value).toBe(
      'Domestic and Foreign filings found',
    );
    expect(cards.find((c) => c.label === 'People')?.value).toBe('Michael Richards +1 more');
  });
});
