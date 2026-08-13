import { describe, expect, it } from 'vitest';
import { summarize } from './summarize';
import { profileFromMiddesk, type MiddeskBusiness } from '../adapters/middesk';
import api from '../fixtures/middesk-api.json';
import type { ProfileRow } from './types';

describe('summarize', () => {
  it('headlines the full API-schema report', () => {
    const rows = profileFromMiddesk(api.business as unknown as MiddeskBusiness).rows;
    const s = summarize(rows);
    expect(s).toContain('Active in WA, CO, DE');
    expect(s).toContain('2 listed officer(s)');
    expect(s).toContain('TIN verified');
    expect(s).toContain('no watchlist hits');
  });

  it('surfaces failures instead of hiding them', () => {
    const rows: ProfileRow[] = [
      { section: 'registration', label: 'CO', value: 'inactive', status: 'warning' },
      { section: 'federal', label: 'TIN Match', value: 'Not found', status: 'failure' },
      { section: 'federal', label: 'Watchlists', value: '2 hit(s)', status: 'failure' },
    ];
    const s = summarize(rows);
    expect(s).toContain('TIN: not found');
    expect(s).toContain('watchlists: 2 hit(s)');
    expect(s).not.toContain('Active in');
  });
});
