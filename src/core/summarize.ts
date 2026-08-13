import type { ProfileRow } from './types';

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * The snapshot headline, written as a sentence — echoing the one-sentence
 * analyst headline of Middesk's risk assessments (their idiom is prose, not
 * a telegraphic list). Deterministic template on purpose: it can never say
 * more than the rows below it show.
 */
export function summarize(rows: ProfileRow[]): string {
  const activeStates = rows
    .filter((r) => r.section === 'registration' && r.status === 'success' && /active/i.test(r.value))
    .map((r) => r.label);
  const lead = activeStates.length
    ? `Active in ${listJoin(activeStates)}`
    : 'No active state registrations found';

  const clauses: string[] = [];

  const officers = rows.find((r) => /officers/i.test(r.label));
  if (officers && officers.status === 'success') {
    const count = parseInt(officers.value, 10);
    if (Number.isFinite(count)) {
      clauses.push(count === 1 ? '1 officer on file' : `${count} officers on file`);
    }
  }

  const tin = rows.find((r) => r.label === 'TIN Match');
  if (tin) clauses.push(tin.status === 'success' ? 'a verified TIN' : `TIN ${tin.value.toLowerCase()}`);

  const watchlists = rows.find((r) => r.label === 'Watchlists');
  if (watchlists) {
    clauses.push(
      watchlists.status === 'success' ? 'no watchlist hits' : `${watchlists.value} on watchlists`,
    );
  }

  return clauses.length ? `${lead}, with ${listJoin(clauses)}.` : `${lead}.`;
}
