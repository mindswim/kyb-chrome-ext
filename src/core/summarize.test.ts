import { describe, expect, it } from 'vitest';
import { summarize } from './summarize';
import paseo from '../fixtures/paseo.json';
import thin from '../fixtures/thin.json';
import type { ProfileRow } from './types';

const rows = (f: { profile: { rows: unknown } }) => f.profile.rows as ProfileRow[];

describe('summarize', () => {
  it('leads with active registrations and includes checks for a healthy profile', () => {
    const s = summarize(rows(paseo));
    expect(s).toContain('Active in Colorado');
    expect(s).toContain('SEC: Form D · 2021');
    expect(s).toContain('no sanctions hits');
    expect(s).toContain('domain registered 2014');
  });

  it('states the absence and surfaces the flag for a thin profile', () => {
    const s = summarize(rows(thin));
    expect(s).toContain('No registrations found in covered states');
    expect(s).toContain('no SEC filings');
    expect(s).toContain('flagged: registered 6 weeks ago');
  });
});
