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
  else if (rows.some((r) => r.section === 'registration' && /no registrations/i.test(r.value)))
    parts.push('No registrations found in covered states');

  const officers = rows.find((r) => /officers/i.test(r.label));
  if (officers && officers.status === 'success') parts.push(`${officers.value} officer(s)`);

  const sec = rows.find((r) => r.label === 'SEC EDGAR');
  if (sec) parts.push(sec.status === 'neutral' ? 'no SEC filings' : `SEC: ${sec.value}`);

  const sanctions = rows.find((r) => r.label === 'Sanctions');
  if (sanctions)
    parts.push(sanctions.status === 'success' ? 'no sanctions hits' : `sanctions: ${sanctions.value}`);

  const domain = rows.find((r) => r.label === 'Domain');
  if (domain)
    parts.push(
      domain.status === 'failure'
        ? `flagged: ${domain.value.toLowerCase()}`
        : `domain ${domain.value.toLowerCase()}`,
    );

  return parts.join(' · ');
}
