import './panel.css';
import {
  matchCardsFromMiddesk,
  profileFromMiddesk,
  resolveMiddeskBusiness,
  type MatchCard,
  type MiddeskAccess,
  type MiddeskBusiness,
} from '../adapters/middesk';
import { summarize } from '../core/summarize';
import type { BusinessProfile, ProfileRow, SectionId } from '../core/types';
import { h } from '../lib/dom';
import harbor from '../fixtures/harbor.json';
import middeskApi from '../fixtures/middesk-api.json';
import nimbus from '../fixtures/nimbus.json';

// Fixture per demo business. The demo harness (and tests) select one via
// ?business=<id>; the default is Middesk's own canonical demo company.
const FIXTURES: Record<string, unknown> = {
  paseo: middeskApi.business,
  harbor: harbor.business,
  nimbus: nimbus.business,
};

function selectedBusiness(): MiddeskBusiness {
  const id = new URLSearchParams(location.search).get('business') ?? 'paseo';
  return (FIXTURES[id] ?? FIXTURES['paseo']) as MiddeskBusiness;
}

const SECTION_TITLES: Record<SectionId, string> = {
  registration: 'Registration',
  federal: 'Federal',
  web: 'Web',
};

function topbar(): HTMLElement {
  return h('header', 'topbar', [h('span', 'logo'), h('h1', undefined, ['Middesk Check'])]);
}

// One row grammar everywhere, matching their report's label-over-value groups.
function rowEl(row: ProfileRow): HTMLElement {
  const el = h('div', 'mrow', [
    h('div', 'mrow-top', [h('span', 'lbl', [row.label]), h('span', `st st--${row.status}`)]),
    h('div', 'val', [row.value]),
  ]);
  if (row.detail) el.append(h('div', 'detail', [row.detail]));
  return el;
}

function sectionCards(rows: ProfileRow[]): HTMLElement[] {
  const order: SectionId[] = ['registration', 'federal', 'web'];
  return order
    .filter((s) => rows.some((r) => r.section === s))
    .map((s) => {
      const card = h('section', 'card', [h('div', 'section-label', [SECTION_TITLES[s]])]);
      rows.filter((r) => r.section === s).forEach((r) => card.append(rowEl(r)));
      return card;
    });
}

/** Their report's field grammar: one card, divided rows, match verdict right. */
function matchStack(cards: MatchCard[]): HTMLElement {
  const card = h('section', 'card mstack', [h('div', 'section-label', ['Verification'])]);
  for (const c of cards) {
    const val = h('div', 'val', [c.value]);
    const row = h('div', 'mrow', [
      h('div', 'mrow-top', [
        h('span', 'lbl', [c.label]),
        h('span', `match match--${c.status}${c.quiet ? ' match--quiet' : ''}`, [c.match]),
      ]),
      val,
    ]);
    if (c.expandedValue) {
      const expand = h('button', 'expand', ['show all']);
      expand.addEventListener('click', () => {
        val.textContent = c.expandedValue ?? c.value;
        expand.remove();
      });
      row.append(expand);
    }
    card.append(row);
  }
  return card;
}

function riskCard(risk: NonNullable<MiddeskBusiness['risk_assessment']>): HTMLElement {
  const level = risk.level.charAt(0).toUpperCase() + risk.level.slice(1);
  const card = h('section', 'card riskcard', [
    h('div', 'mrow-top', [
      h('span', 'lbl', ['Fraud intelligence']),
      h('span', `pill-status pill-status--${risk.level}`, [`${level} risk`]),
    ]),
  ]);
  const tally = h('div', 'tally');
  for (const [label, count, tone] of [
    ['Positive', risk.indicators.positive, 'positive'],
    ['Neutral', risk.indicators.neutral, 'neutral'],
    ['Negative', risk.indicators.negative, 'negative'],
  ] as const) {
    tally.append(
      h('div', 'tally-row', [
        h('span', undefined, [label]),
        h('span', `tally-chip tally-chip--${tone}`, [String(count)]),
      ]),
    );
  }
  card.append(tally);
  return card;
}

function entityHeader(
  profile: BusinessProfile,
  statusPill: { label: string; tone: string } | undefined,
  onNewSearch: () => void,
): HTMLElement {
  const top = h('div', 'entity-top', [h('h2', undefined, [profile.name])]);
  if (statusPill) {
    top.append(h('span', `pill-status pill-status--${statusPill.tone}`, [statusPill.label]));
  }
  const card = h('section', 'card entity', [top]);
  const meta = [profile.domain, profile.location].filter(Boolean).join(' · ');
  if (meta) card.append(h('div', 'meta', [meta]));
  if (profile.about) card.append(h('p', 'about', [profile.about]));
  const back = h('button', 'change', ['New search']);
  back.addEventListener('click', onNewSearch);
  card.append(h('div', 'entity-foot', [back]));
  return card;
}

/**
 * Prefers the risk assessment's `title` — their real one-sentence analyst
 * headline field — and falls back to our deterministic generator when a
 * response has no assessment.
 */
function snapshotCard(rows: ProfileRow[], headline?: string): HTMLElement {
  return h('section', 'card summary', [
    h('div', 'section-label', ['Snapshot']),
    h('p', undefined, [headline ?? summarize(rows)]),
  ]);
}

/** Core verification is the panel's scope; everything deeper clicks out. */
function ctaCard(): HTMLElement {
  const card = h('section', 'cta', [
    h('p', undefined, [
      'Liens, bankruptcies, business connections, and monitoring live in the full Middesk platform.',
    ]),
  ]);
  const a = h('a', 'btn btn--lime', ['Get a demo →']);
  // Attributed link-out rather than an in-panel form: their contact page owns
  // routing and consent, and the UTM makes the extension a measurable channel.
  a.href =
    'https://www.middesk.com/contact?utm_source=middesk-check&utm_medium=extension&utm_campaign=concept-demo';
  a.target = '_blank';
  a.rel = 'noopener';
  card.append(a);
  return card;
}

function toast(): HTMLElement {
  return h('section', 'toast enter', [
    h('div', 'toast-top', [
      h('span', 'toast-mark'),
      h('span', 'toast-label', ['Verifying against authoritative sources…']),
    ]),
    h('div', 'toast-bar', [h('i')]),
  ]);
}

/**
 * Ghost of the real report, section for section — the empty state previews
 * the exact output shape, and the verify flow fills it in place.
 */
function ghostReport(): HTMLElement[] {
  const snapshot = h('section', 'card card--ghost', [h('div', 'section-label', ['Snapshot'])]);
  for (const w of ['92%', '64%']) {
    const bar = h('div', 'bar');
    bar.style.width = w;
    bar.style.marginTop = '6px';
    snapshot.append(bar);
  }

  const sections: { title: string; rows: number[] }[] = [
    { title: 'Verification', rows: [120, 96, 88, 104] },
    { title: 'Fraud intelligence', rows: [72, 60, 68] },
    { title: 'Registration', rows: [120, 88, 104] },
    { title: 'Web', rows: [110, 80] },
  ];
  const cards = sections.map(({ title, rows }) => {
    const card = h('section', 'card card--ghost', [h('div', 'section-label', [title])]);
    for (const w of rows) {
      const label = h('span', 'bar');
      label.style.width = '56px';
      const value = h('span', 'bar');
      value.style.width = `${w}px`;
      card.append(
        h('div', 'mrow mrow--ghost', [
          h('div', 'mrow-top', [label, h('span', 'st st--neutral')]),
          value,
        ]),
      );
    }
    return card;
  });

  return [snapshot, ...cards];
}

function idleView(onVerify: () => void): HTMLElement[] {
  const hero = h('section', 'hero', [
    h('h2', undefined, ['Know the business behind any site.']),
    h('p', undefined, [
      'Registration status, filings, watchlists, web presence — verified against authoritative sources.',
    ]),
  ]);
  const verify = h('button', 'btn', ['Verify this business']);
  verify.addEventListener('click', onVerify);
  hero.append(h('div', 'hero-actions', [verify]));
  return [hero, ...ghostReport()];
}

/**
 * In the extension, a Middesk key or proxy URL can be configured at runtime
 * via chrome.storage (never bundled — see README security posture). Absent
 * that — and always in the web harness — Verify renders the API-schema
 * fixture with demo latency.
 */
async function loadAccess(): Promise<MiddeskAccess | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
  const stored = await chrome.storage.local.get('middeskAccess');
  return (stored['middeskAccess'] as MiddeskAccess | undefined) ?? null;
}

async function resolveBusiness(): Promise<MiddeskBusiness> {
  const fixture = selectedBusiness();
  const access = await loadAccess();
  if (access) {
    // In the live product the query comes from page extraction (Phase 3);
    // until then the fixture's identity doubles as the query.
    return resolveMiddeskBusiness(
      { name: fixture.name, domain: fixture.website?.url?.replace(/^https?:\/\//, '') },
      access,
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 1600));
  return fixture;
}

function boot(): void {
  const app = document.getElementById('app')!;
  const column = h('div', 'col');
  const main = h('main');
  column.append(topbar(), main);

  // Staggered entrance keeps view changes from feeling like a hard swap.
  const enter = (): void => {
    Array.from(main.children).forEach((el, i) => {
      (el as HTMLElement).classList.add('enter');
      (el as HTMLElement).style.animationDelay = `${i * 45}ms`;
    });
  };

  const scrollTop = (): void => window.scrollTo(0, 0);

  const showIdle = (): void => {
    main.replaceChildren(...idleView(verifyFlow));
    enter();
    scrollTop();
  };

  const showReport = (business: MiddeskBusiness): void => {
    const profile = profileFromMiddesk(business);
    const statusPill = {
      label: business.status.replace('_', ' ').replace(/^./, (ch) => ch.toUpperCase()),
      tone:
        business.status === 'approved'
          ? 'low'
          : business.status === 'rejected'
            ? 'high'
            : 'neutral',
    };
    main.replaceChildren(
      entityHeader(profile, statusPill, showIdle),
      snapshotCard(profile.rows, business.risk_assessment?.title),
      matchStack(matchCardsFromMiddesk(business)),
      ...(business.risk_assessment ? [riskCard(business.risk_assessment)] : []),
      // TIN and watchlists live in the verification stack; the sections below
      // add the per-state and web detail.
      ...sectionCards(profile.rows.filter((r) => r.section !== 'federal')),
      ctaCard(),
    );
    enter();
    scrollTop();
  };

  const showError = (message: string): void => {
    const retry = h('button', 'btn', ['Try again']);
    retry.addEventListener('click', showIdle);
    main.replaceChildren(
      h('section', 'card', [
        h('div', 'section-label', ['Verification did not complete']),
        h('p', 'errmsg', [message]),
      ]),
      h('div', 'hero-actions', [retry]),
    );
    enter();
  };

  // Verification happens inside the first view: the hero becomes the toast
  // and the ghost report the user is already looking at starts shimmering,
  // then resolves into the real one.
  const verifyFlow = (): void => {
    main.querySelector('.hero')?.replaceWith(toast());
    main.querySelectorAll('.card--ghost .bar').forEach((b) => b.classList.add('bar--live'));
    resolveBusiness()
      .then(showReport)
      .catch((err: unknown) => showError(err instanceof Error ? err.message : String(err)));
  };

  app.append(column);
  showIdle();
}

boot();
