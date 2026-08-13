import type { EntityQuery, ProfileRow, SourceAdapter } from '../core/types';

/**
 * The production seam.
 *
 * This adapter is intentionally present and intentionally inert. Middesk's API
 * is sales-gated (no self-serve keys, docs.middesk.com), so the prototype runs
 * on the free public-record adapters instead. If Middesk wires in a key, one
 * call to POST /v1/businesses replaces the entire free-source fleet: their
 * Business object already carries registrations (all 50 states + DC), TIN
 * verification, watchlists, liens, bankruptcies, website analysis, industry
 * classification, and Business Connections — every row this panel renders as
 * `locked`, unlocked.
 *
 * The types below cover just the subset of their documented response shape
 * (docs.middesk.com/reference/business) needed to map into ProfileRow.
 */

interface MiddeskRegistration {
  state: string;
  status: 'active' | 'inactive' | 'unknown';
  sub_status: string; // e.g. "GOOD_STANDING"
  registration_date: string;
  officers: { name: string; roles: string[] }[];
}

interface MiddeskBusinessSubset {
  name: string;
  registrations: MiddeskRegistration[];
  tin: { verified: boolean; issued: boolean; mismatch: boolean } | null;
  watchlist: { hit_count: number } | null;
  formation: { formation_date: string; formation_state: string } | null;
}

const NOT_CONFIGURED =
  'Middesk adapter present but not configured: requires a Middesk API key, which is sales-gated. ' +
  'The free-source adapters cover the public-record subset in the meantime.';

export const middeskAdapter: SourceAdapter = {
  id: 'middesk',
  label: 'Middesk',
  query(_q: EntityQuery): Promise<ProfileRow[]> {
    return Promise.reject(new Error(NOT_CONFIGURED));
  },
};

/** Mapping sketch kept alongside the stub so the swap path is legible in review. */
export function mapMiddeskBusiness(b: MiddeskBusinessSubset): ProfileRow[] {
  return b.registrations.map((r) => ({
    section: 'registration',
    label: r.state,
    value: r.status === 'active' ? `Active · ${r.sub_status.replaceAll('_', ' ').toLowerCase()}` : r.status,
    detail: r.officers.length ? `${r.officers.length} officer(s) on file` : undefined,
    status: r.status === 'active' ? 'success' : r.status === 'inactive' ? 'warning' : 'neutral',
    source: { label: 'Middesk · Secretary of State' },
  }));
}
