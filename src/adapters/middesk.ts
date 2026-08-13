import type {
  BusinessProfile,
  EntityQuery,
  ProfileRow,
  RowStatus,
  SourceAdapter,
} from '../core/types';

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
  tin?: {
    tin?: string;
    verified: boolean;
    issued?: boolean;
    mismatch?: boolean;
    name?: string;
  } | null;
  watchlist?: { hit_count: number; lists?: { title: string; agency: string }[] } | null;
  industry_classification?: {
    categories?: {
      name: string;
      classification_system: string;
      score?: number;
      naics_codes?: string[];
    }[];
  } | null;
  website?: {
    url?: string;
    status?: string;
    description?: string;
    domain?: { creation_date?: string };
  } | null;
  addresses?: { full_address?: string; city?: string; state?: string }[];
  /** Subset of their risk-assessment shape (0–100, banded low/moderate/high). */
  risk_assessment?: {
    score: number;
    band: 'low' | 'moderate' | 'high';
    indicators: { positive: number; neutral: number; negative: number };
  } | null;
}

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
    });
  }

  if (b.people?.length) {
    rows.push({
      section: 'registration',
      label: 'Officers',
      value: `${b.people.length} listed`,
      detail: b.people.map((p) => `${p.name} (${p.titles.join(', ')})`).join(' · '),
      status: 'success',
    });
  }

  if (b.tin) {
    rows.push({
      section: 'federal',
      label: 'TIN Match',
      value: b.tin.verified ? 'Verified by IRS' : b.tin.mismatch ? 'Name mismatch' : 'Not found',
      detail: b.tin.verified ? `EIN–name match on IRS records for “${b.tin.name}”` : undefined,
      status: b.tin.verified ? 'success' : b.tin.mismatch ? 'warning' : 'failure',
    });
  }

  if (b.watchlist) {
    rows.push({
      section: 'federal',
      label: 'Watchlists',
      value: b.watchlist.hit_count === 0 ? 'No hits' : `${b.watchlist.hit_count} hit(s)`,
      detail: 'OFAC (8 lists) + BIS, DDTC, ISN screened',
      status: b.watchlist.hit_count === 0 ? 'success' : 'failure',
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
    });
  }

  return rows;
}

/**
 * The verification stack — a clone of the field-card grammar in Middesk's own
 * report UI (label on top, value large, match verdict with a status dot at
 * top right). Vocabulary is theirs: "Match", "Similar match", "Not found".
 */
export interface MatchCard {
  label: string;
  value: string;
  match: string;
  status: RowStatus;
}

export function matchCardsFromMiddesk(b: MiddeskBusiness): MatchCard[] {
  const cards: MatchCard[] = [];
  cards.push({ label: 'Business name', value: b.name, match: 'Match', status: 'success' });

  const addr = b.addresses?.[0];
  if (addr?.full_address) {
    cards.push({ label: 'Office address', value: addr.full_address, match: 'Match', status: 'success' });
  }

  if (b.registrations.length) {
    const domestic = b.registrations.some((r) => r.jurisdiction === 'DOMESTIC');
    const foreign = b.registrations.some((r) => r.jurisdiction === 'FOREIGN');
    cards.push({
      label: 'SOS Filings',
      value:
        domestic && foreign
          ? 'Domestic and Foreign filings found'
          : domestic
            ? 'Domestic filings found'
            : 'Foreign filings found',
      match: 'Match',
      status: 'success',
    });
  }

  if (b.tin) {
    cards.push({
      label: 'TIN',
      value: b.tin.tin ?? (b.tin.verified ? 'EIN found' : '—'),
      match: b.tin.verified ? 'Match' : b.tin.mismatch ? 'Similar match' : 'Not found',
      status: b.tin.verified ? 'success' : b.tin.mismatch ? 'warning' : 'failure',
    });
  }

  const [firstPerson, ...morePeople] = b.people ?? [];
  if (firstPerson) {
    cards.push({
      label: 'People',
      value: morePeople.length ? `${firstPerson.name} +${morePeople.length} more` : firstPerson.name,
      match: 'Match',
      status: 'success',
    });
  }

  if (b.watchlist) {
    cards.push({
      label: 'Watchlists',
      value: b.watchlist.hit_count === 0 ? 'None' : `${b.watchlist.hit_count} hit(s)`,
      match: b.watchlist.hit_count === 0 ? 'No hits' : 'Hits found',
      status: b.watchlist.hit_count === 0 ? 'success' : 'failure',
    });
  }

  return cards;
}

export function profileFromMiddesk(b: MiddeskBusiness): BusinessProfile {
  const addr = b.addresses?.[0];
  return {
    name: b.name,
    domain: b.website?.url?.replace(/^https?:\/\//, ''),
    location: addr ? [addr.city, addr.state].filter(Boolean).join(', ') : undefined,
    about: b.website?.description,
    rows: rowsFromMiddesk(b),
    fetchedAt: new Date().toISOString(),
  };
}

const API_BASE = 'https://api.middesk.com/v1';

/**
 * Access design is the security stance: extension code is world-readable, so
 * an API key must never exist in this bundle.
 *
 * - `proxy` (the only shippable mode): the extension calls our own backend,
 *   which holds the Middesk key server-side, adds caching/rate limits, and
 *   forwards nothing but the confirmed entity name.
 * - `direct-sandbox`: local demos only, with your own sandbox key entered at
 *   runtime and kept in chrome.storage — never bundled, never committed.
 *   Exists so a Middesk reviewer can wire their sandbox key and watch the
 *   panel go live without standing up the proxy first.
 */
export type MiddeskAccess =
  | { mode: 'proxy'; proxyUrl: string }
  | { mode: 'direct-sandbox'; apiKey: string };

/**
 * Direct path against their documented REST API (Bearer auth, per
 * docs.middesk.com/api-reference). Their flow is asynchronous — create a
 * Business, their pipelines fill it — so this polls with a small budget;
 * the proxy would use webhooks instead.
 */
export async function fetchMiddeskBusiness(
  q: EntityQuery,
  apiKey: string,
): Promise<MiddeskBusiness> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
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

async function fetchViaProxy(q: EntityQuery, proxyUrl: string): Promise<MiddeskBusiness> {
  const res = await fetch(`${proxyUrl.replace(/\/$/, '')}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: q.name, domain: q.domain }),
  });
  if (!res.ok) throw new Error(`Verification proxy failed: HTTP ${res.status}`);
  return (await res.json()) as MiddeskBusiness;
}

export function createMiddeskAdapter(access?: MiddeskAccess): SourceAdapter {
  return {
    id: 'middesk',
    label: 'Middesk',
    async query(q: EntityQuery): Promise<ProfileRow[]> {
      if (!access) {
        throw new Error(
          'Middesk adapter present but not configured: their API keys are sales-gated. ' +
            'The demo renders their response schema from fixtures in the meantime.',
        );
      }
      const business =
        access.mode === 'proxy'
          ? await fetchViaProxy(q, access.proxyUrl)
          : await fetchMiddeskBusiness(q, access.apiKey);
      return rowsFromMiddesk(business);
    },
  };
}
