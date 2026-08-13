import type { BusinessProfile, EntityQuery, ProfileRow, SourceAdapter } from '../core/types';

/**
 * The production seam.
 *
 * Middesk's API is sales-gated (no self-serve keys), so this adapter ships
 * dormant — but the ingestion path is implemented, not sketched: the demo's
 * "Middesk API sample" renders a fixture shaped exactly like their documented
 * Business response (docs.middesk.com/reference/business) through the same
 * mapper the live path uses. Wire a key and the free-source fleet is
 * replaced by one call.
 *
 * Types cover the subset of their documented schema this panel renders.
 */

export interface MiddeskRegistration {
  name: string;
  state: string;
  status: 'active' | 'inactive' | 'unknown';
  /** Their normalized standing, e.g. "GOOD_STANDING". */
  sub_status: string;
  status_details?: string;
  entity_type?: string;
  file_number?: string;
  jurisdiction?: 'DOMESTIC' | 'FOREIGN';
  registration_date?: string;
  officers?: { name: string; roles: string[] }[];
}

export interface MiddeskBusiness {
  id: string;
  name: string;
  status: 'open' | 'pending' | 'in_audit' | 'in_review' | 'approved' | 'rejected';
  formation?: { entity_type?: string; formation_state?: string; formation_date?: string };
  registrations: MiddeskRegistration[];
  people?: { name: string; titles: string[] }[];
  tin?: { verified: boolean; issued?: boolean; mismatch?: boolean; name?: string } | null;
  watchlist?: { hit_count: number; lists?: { title: string; agency: string }[] } | null;
  industry_classification?: {
    categories?: {
      name: string;
      classification_system: string;
      score?: number;
      naics_codes?: string[];
    }[];
  } | null;
  website?: { url?: string; status?: string; domain?: { creation_date?: string } } | null;
  addresses?: { full_address?: string; city?: string; state?: string }[];
}

const MIDDESK_SOURCE = { label: 'Middesk · 400+ authoritative sources' };

function prettyStanding(sub: string): string {
  return sub.replaceAll('_', ' ').toLowerCase();
}

export function rowsFromMiddesk(b: MiddeskBusiness): ProfileRow[] {
  const rows: ProfileRow[] = [];

  if (b.formation) {
    rows.push({
      section: 'registration',
      label: 'Formation',
      value: [b.formation.entity_type, b.formation.formation_state, b.formation.formation_date]
        .filter(Boolean)
        .join(' · '),
      status: 'neutral',
      source: MIDDESK_SOURCE,
    });
  }

  for (const r of b.registrations) {
    rows.push({
      section: 'registration',
      label: r.state,
      value: r.status === 'active' ? `Active · ${prettyStanding(r.sub_status)}` : r.status,
      detail: [
        r.entity_type,
        r.jurisdiction?.toLowerCase(),
        r.file_number && `file ${r.file_number}`,
        r.registration_date && `reg. ${r.registration_date}`,
      ]
        .filter(Boolean)
        .join(' · '),
      status: r.status === 'active' ? 'success' : r.status === 'inactive' ? 'warning' : 'neutral',
      source: { label: 'Middesk · Secretary of State' },
    });
  }

  if (b.people?.length) {
    rows.push({
      section: 'registration',
      label: 'Officers',
      value: `${b.people.length} listed`,
      detail: b.people.map((p) => `${p.name} (${p.titles.join(', ')})`).join(' · '),
      status: 'success',
      source: MIDDESK_SOURCE,
    });
  }

  if (b.tin) {
    rows.push({
      section: 'federal',
      label: 'TIN Match',
      value: b.tin.verified ? 'Verified by IRS' : b.tin.mismatch ? 'Name mismatch' : 'Not found',
      detail: b.tin.verified ? `EIN–name match on IRS records for “${b.tin.name}”` : undefined,
      status: b.tin.verified ? 'success' : b.tin.mismatch ? 'warning' : 'failure',
      source: { label: 'Middesk · IRS' },
    });
  }

  if (b.watchlist) {
    rows.push({
      section: 'federal',
      label: 'Watchlists',
      value: b.watchlist.hit_count === 0 ? 'No hits' : `${b.watchlist.hit_count} hit(s)`,
      detail: 'OFAC (8 lists) + BIS, DDTC, ISN screened',
      status: b.watchlist.hit_count === 0 ? 'success' : 'failure',
      source: MIDDESK_SOURCE,
    });
  }

  const category = b.industry_classification?.categories?.[0];
  if (category) {
    rows.push({
      section: 'web',
      label: 'Industry',
      value: category.name,
      detail: [
        category.naics_codes?.length && `NAICS ${category.naics_codes.join(', ')}`,
        category.score !== undefined && `confidence ${category.score.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join(' · '),
      status: 'neutral',
      source: MIDDESK_SOURCE,
    });
  }

  if (b.website) {
    rows.push({
      section: 'web',
      label: 'Website',
      value: b.website.status === 'online' ? 'Online' : (b.website.status ?? 'Unknown'),
      detail: b.website.domain?.creation_date
        ? `domain created ${b.website.domain.creation_date}`
        : undefined,
      status: b.website.status === 'online' ? 'success' : 'warning',
      source: MIDDESK_SOURCE,
    });
  }

  return rows;
}

export function profileFromMiddesk(b: MiddeskBusiness): BusinessProfile {
  const addr = b.addresses?.[0];
  return {
    name: b.name,
    domain: b.website?.url?.replace(/^https?:\/\//, ''),
    location: addr ? [addr.city, addr.state].filter(Boolean).join(', ') : undefined,
    rows: rowsFromMiddesk(b),
    fetchedAt: new Date().toISOString(),
  };
}

const API_BASE = 'https://api.middesk.com/v1';

/**
 * Live path, dormant until a key exists. Their flow is asynchronous — create
 * a Business, their pipelines fill it — so this polls with a small budget;
 * production would listen to webhooks instead. Auth is HTTP Basic with the
 * key as username (their quickstart curl style: `-u mk_test_…:`).
 */
export async function fetchMiddeskBusiness(
  q: EntityQuery,
  apiKey: string,
): Promise<MiddeskBusiness> {
  const headers = {
    Authorization: `Basic ${btoa(`${apiKey}:`)}`,
    'Content-Type': 'application/json',
  };
  const created = await fetch(`${API_BASE}/businesses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: q.name,
      website: q.domain ? { url: `https://${q.domain}` } : undefined,
    }),
  });
  if (!created.ok) throw new Error(`Middesk create failed: HTTP ${created.status}`);
  let business = (await created.json()) as MiddeskBusiness;

  for (let i = 0; i < 20 && (business.status === 'open' || business.status === 'pending'); i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const res = await fetch(`${API_BASE}/businesses/${business.id}`, { headers });
    if (!res.ok) throw new Error(`Middesk poll failed: HTTP ${res.status}`);
    business = (await res.json()) as MiddeskBusiness;
  }
  return business;
}

export function createMiddeskAdapter(apiKey?: string): SourceAdapter {
  return {
    id: 'middesk',
    label: 'Middesk',
    async query(q: EntityQuery): Promise<ProfileRow[]> {
      if (!apiKey) {
        throw new Error(
          'Middesk adapter present but not configured: their API keys are sales-gated. ' +
            'The free-source adapters cover the public-record subset in the meantime.',
        );
      }
      return rowsFromMiddesk(await fetchMiddeskBusiness(q, apiKey));
    },
  };
}
