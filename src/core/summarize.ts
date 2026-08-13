import type { ProfileRow } from './types';

/**
 * One-line analyst headline composed from the rows, echoing the
 * one-sentence-headline idiom of Middesk's risk assessments. Deterministic
 * template on purpose: it can never say more than the rows below it show.
 */
export function summarize(rows: ProfileRow[]): string {
  const parts: string[] = [];

  const activeStates = rows
    .filter((r) => r.section === 'registration' && r.status === 'success' && /active/i.test(r.value))
    .map((r) => r.label);
  if (activeStates.length) parts.push(`Active in ${activeStates.join(', ')}`);

  const officers = rows.find((r) => /officers/i.test(r.label));
  if (officers && officers.status === 'success') parts.push(`${officers.value} officer(s)`);

  const tin = rows.find((r) => r.label === 'TIN Match');
  if (tin) parts.push(tin.status === 'success' ? 'TIN verified' : `TIN: ${tin.value.toLowerCase()}`);

  const watchlists = rows.find((r) => r.label === 'Watchlists');
  if (watchlists)
    parts.push(
      watchlists.status === 'success' ? 'no watchlist hits' : `watchlists: ${watchlists.value}`,
    );

  return parts.join(' · ');
}
