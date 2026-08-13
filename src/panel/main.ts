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
import middeskApi from '../fixtures/middesk-api.json';

// In the real extension this page runs at chrome-extension:// inside Chrome's
// native side panel (a narrow full-height column). Everywhere else — dev
// server, hosted demo — we simulate that dock so the form factor reads true.
const IS_EXTENSION = location.protocol === 'chrome-extension:';

const SECTION_TITLES: Record<SectionId, string> = {
  registration: 'Registration',
  federal: 'Federal',
  web: 'Web',
};

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  for (const child of children ?? []) el.append(child);
  return el;
}

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
    card.append(
      h('div', 'mrow', [
        h('div', 'mrow-top', [
          h('span', 'lbl', [c.label]),
          h('span', `match match--${c.status}`, [c.match]),
        ]),
        h('div', 'val', [c.value]),
      ]),
    );
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
  statusPill: string | undefined,
  onNewSearch: () => void,
): HTMLElement {
  const top = h('div', 'entity-top', [h('h2', undefined, [profile.name])]);
  if (statusPill) top.append(h('span', 'pill-status pill-status--low', [statusPill]));
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
  a.href = 'https://www.middesk.com';
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

/** The simulated webpage behind the dock, so the harness reads as a side panel. */
function stage(): HTMLElement {
  const s = h('div', 'stage');
  const page = h('div', 'ph-page', [
    h('div', 'ph ph--nav'),
    h('div', 'ph ph--hero'),
    h('div', 'ph-cols', [h('div', 'ph'), h('div', 'ph'), h('div', 'ph')]),
    h('div', 'ph ph--block'),
  ]);
  s.append(page, h('p', 'stage-note', ['any business website · the panel docks beside it →']));
  return s;
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
  const fixture = middeskApi.business as unknown as MiddeskBusiness;
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

  const scrollTop = (): void => {
    const dock = document.querySelector('.dock');
    if (dock) dock.scrollTop = 0;
    else window.scrollTo(0, 0);
  };

  const showIdle = (): void => {
    main.replaceChildren(...idleView(verifyFlow));
    enter();
    scrollTop();
  };

  const showReport = (business: MiddeskBusiness): void => {
    const profile = profileFromMiddesk(business);
    const statusPill =
      business.status === 'approved'
        ? 'Approved'
        : business.status.replace('_', ' ').replace(/^./, (ch) => ch.toUpperCase());
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

  if (IS_EXTENSION) {
    app.append(column);
  } else {
    document.body.classList.add('harness');
    app.append(h('div', 'frame', [stage(), h('div', 'dock', [column])]));
  }

  showIdle();
}

boot();
