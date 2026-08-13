import { describe, expect, it } from 'vitest';
import { profileFromMiddesk, type MiddeskBusiness } from './middesk';
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
