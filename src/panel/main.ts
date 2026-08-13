import './panel.css';
import {
  matchCardsFromMiddesk,
  profileFromMiddesk,
  type MatchCard,
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
  const band = risk.band.charAt(0).toUpperCase() + risk.band.slice(1);
  const card = h('section', 'card riskcard', [
    h('div', 'mrow-top', [
      h('span', 'lbl', ['Fraud intelligence']),
      h('span', `pill-status pill-status--${risk.band}`, [`${band} risk`]),
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
  const back = h('button', 'change', ['New search']);
  back.addEventListener('click', onNewSearch);
  card.append(h('div', 'entity-foot', [back]));
  return card;
}

function snapshotCard(rows: ProfileRow[]): HTMLElement {
  return h('section', 'card summary', [
    h('div', 'section-label', ['Snapshot']),
    h('p', undefined, [summarize(rows)]),
  ]);
}

function aboutCard(profile: BusinessProfile): HTMLElement[] {
  if (!profile.about) return [];
  return [
    h('section', 'card aboutcard', [
      h('div', 'section-label', ['Business description']),
      h('p', undefined, [profile.about]),
    ]),
  ];
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

function loadingView(): HTMLElement[] {
  const toast = h('section', 'toast', [
    h('div', 'toast-top', [
      h('span', 'toast-mark'),
      h('span', 'toast-label', ['Verifying against authoritative sources…']),
    ]),
    h('div', 'toast-bar', [h('i')]),
  ]);
  const bones = h('section', 'card');
  for (let i = 0; i < 4; i++) {
    const bone = h('div', 'skeleton');
    bone.style.width = `${85 - i * 12}%`;
    bones.append(bone);
  }
  return [toast, bones];
}

/** Ghosted preview of the report shape — the empty state teaches the output. */
function ghostPreview(): HTMLElement[] {
  const widths: Record<SectionId, number[]> = {
    registration: [120, 88, 104],
    federal: [96, 128],
    web: [110, 80],
  };
  return (Object.keys(widths) as SectionId[]).map((s) => {
    const card = h('section', 'card card--ghost', [h('div', 'section-label', [SECTION_TITLES[s]])]);
    for (const w of widths[s]) {
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
  return [hero, ...ghostPreview()];
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

function boot(): void {
  const app = document.getElementById('app')!;
  const column = h('div', 'col');
  const main = h('main');
  column.append(topbar(), main);

  const business = middeskApi.business as unknown as MiddeskBusiness;
  const profile = profileFromMiddesk(business);

  const showIdle = (): void => {
    main.replaceChildren(...idleView(verifyFlow));
  };

  const showReport = (): void => {
    const statusPill =
      business.status === 'approved'
        ? 'Approved'
        : business.status.replace('_', ' ').replace(/^./, (ch) => ch.toUpperCase());
    main.replaceChildren(
      entityHeader(profile, statusPill, showIdle),
      snapshotCard(profile.rows),
      matchStack(matchCardsFromMiddesk(business)),
      ...(business.risk_assessment ? [riskCard(business.risk_assessment)] : []),
      // TIN and watchlists live in the verification stack; the sections below
      // add the per-state and web detail.
      ...sectionCards(profile.rows.filter((r) => r.section !== 'federal')),
      ...aboutCard(profile),
      ctaCard(),
    );
    main.scrollTop = 0;
  };

  const verifyFlow = (): void => {
    main.replaceChildren(...loadingView());
    setTimeout(showReport, 1400);
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
