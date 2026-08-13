import { describe, expect, it } from 'vitest';
import { summarize } from './summarize';
import { profileFromMiddesk, type MiddeskBusiness } from '../adapters/middesk';
import api from '../fixtures/middesk-api.json';
import type { ProfileRow } from './types';

describe('summarize', () => {
  it('writes the analyst-headline sentence for the full API-schema report', () => {
    const rows = profileFromMiddesk(api.business as unknown as MiddeskBusiness).rows;
    expect(summarize(rows)).toBe(
      'Active in WA, CO and DE, with 2 officers on file, a verified TIN and no watchlist hits.',
    );
  });

  it('surfaces failures instead of hiding them', () => {
    const rows: ProfileRow[] = [
      { section: 'registration', label: 'CO', value: 'inactive', status: 'warning' },
      { section: 'federal', label: 'TIN Match', value: 'Not found', status: 'failure' },
      { section: 'federal', label: 'Watchlists', value: '2 hit(s)', status: 'failure' },
    ];
    expect(summarize(rows)).toBe(
      'No active state registrations found, with TIN not found and 2 hit(s) on watchlists.',
    );
  });
});
