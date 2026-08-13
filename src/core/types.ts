/**
 * Domain model for a business snapshot.
 *
 * Status names deliberately mirror Middesk's own review-task vocabulary
 * (success / warning / failure — see docs.middesk.com/review-insights) so that
 * mapping their API into this model is a rename-free exercise. Two additions:
 * `neutral` for informational rows and `locked` for capabilities only the
 * paid Middesk API can fill.
 */
export type RowStatus = 'success' | 'warning' | 'failure' | 'neutral' | 'locked';

export type SectionId = 'registration' | 'federal' | 'web';

export interface SourceRef {
  /** Short human label, e.g. "CO Secretary of State". */
  label: string;
  url?: string;
}

export interface ProfileRow {
  section: SectionId;
  label: string;
  value: string;
  /** Secondary line under the value (officer names, filing detail, why a gap exists). */
  detail?: string;
  status: RowStatus;
  source?: SourceRef;
}

export interface BusinessProfile {
  name: string;
  domain?: string;
  location?: string;
  /** Business description, e.g. from Middesk's web analysis. */
  about?: string;
  rows: ProfileRow[];
  fetchedAt: string;
}

export interface EntityQuery {
  name: string;
  domain?: string;
  state?: string;
}

/**
 * One data source = one adapter. Adapters are independent and fail
 * independently; the orchestrator renders whatever settles. Swapping the
 * whole free-source fleet for Middesk's API means adding one adapter
 * (see adapters/middesk.ts) — that seam is the point of the design.
 */
export interface SourceAdapter {
  id: string;
  label: string;
  query(q: EntityQuery): Promise<ProfileRow[]>;
}
