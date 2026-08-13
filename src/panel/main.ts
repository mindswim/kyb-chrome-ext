import './panel.css';
import {
  matchCardsFromMiddesk,
  profileFromMiddesk,
  type MatchCard,
  type MiddeskBusiness,
} from '../adapters/middesk';
import { pickAutoConfirm } from '../core/resolve';
import { summarize } from '../core/summarize';
import type { BusinessProfile, EntityCandidate, ProfileRow, SectionId } from '../core/types';
import middeskApi from '../fixtures/middesk-api.json';
import paseo from '../fixtures/paseo.json';
import thin from '../fixtures/thin.json';

interface Fixture {
  candidates: EntityCandidate[];
  profile: BusinessProfile;
}

const FIXTURES: Record<string, Fixture> = {
  paseo: paseo as unknown as Fixture,
  thin: thin as unknown as Fixture,
};

// In the real extension this page runs at chrome-extension:// inside Chrome's
// native side panel (a narrow full-height column). Everywhere else — dev
// server, hosted demo — we simulate that dock so the form factor reads true.
const IS_EXTENSION = location.protocol === 'chrome-extension:';

const SECTION_TITLES: Record<SectionId, string> = {
  registration: 'Registration',
  federal: 'Federal',
  web: 'Web',
};

const ORIGIN_LABELS: Record<EntityCandidate['origin'], string> = {
  jsonld: 'schema.org markup',
  footer: 'page footer',
  tos: 'terms of service',
  title: 'page title',
  manual: 'manual search',
};

/** Capabilities rendered as the paid-product block, using Middesk's real product names. */
const LOCKED_CAPS =
  'TIN Match · Registrations in all 50 states + DC · UCC Liens & Bankruptcies · ' +
  'Watchlists (5,704 sources) · Business Connections · Web Analysis · Industry Classification';

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

function statusIcon(row: ProfileRow): HTMLElement {
  return h('span', `st st--${row.status}`);
}

function rowEl(row: ProfileRow): HTMLElement {
  const el = h('div', `row${row.status === 'locked' ? ' row--locked' : ''}`, [
    h('span', 'label', [row.label]),
    h('span', 'value', [row.value]),
    statusIcon(row),
  ]);
  if (row.detail) el.append(h('span', 'detail', [row.detail]));
  if (row.source) {
    const a = h('a', 'source', [`Source: ${row.source.label} ↗`]);
    if (row.source.url) {
      a.href = row.source.url;
      a.target = '_blank';
      a.rel = 'noopener';
    }
    el.append(a);
  }
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

function candidatesCard(candidates: EntityCandidate[], onConfirm: (c: EntityCandidate) => void) {
  let selected = 0;
  const card = h('section', 'card');
  card.append(h('div', 'section-label', ['Identified on this page']));

  const rows = candidates.map((c, i) => {
    const row = h('div', 'candidate', [
      h('span', 'radio'),
      h('span', undefined, [
        h('span', 'name', [c.name]),
        h('span', 'origin', [`from ${ORIGIN_LABELS[c.origin]}`]),
      ]),
      (() => {
        const meter = h('div', 'meter', [h('i')]);
        (meter.firstElementChild as HTMLElement).style.width = `${Math.round(c.confidence * 100)}%`;
        meter.title = `confidence ${c.confidence.toFixed(2)}`;
        return meter;
      })(),
    ]);
    row.setAttribute('role', 'radio');
    row.tabIndex = 0;
    const select = () => {
      selected = i;
      rows.forEach((r, j) => r.setAttribute('aria-checked', String(j === selected)));
    };
    row.addEventListener('click', select);
    row.addEventListener('keydown', (e) => e.key === 'Enter' && select());
    return row;
  });
  rows.forEach((r) => card.append(r));
  rows[0]?.setAttribute('aria-checked', 'true');

  const confirm = h('button', 'btn', ['Confirm']);
  confirm.addEventListener('click', () => {
    const chosen = candidates[selected];
    if (chosen) onConfirm(chosen);
  });
  const search = h('input', 'search') as HTMLInputElement;
  search.placeholder = 'Search a different name…';
  card.append(h('div', 'confirm-row', [confirm, search]));
  return card;
}

function entityHeader(
  profile: BusinessProfile,
  onChange: () => void,
  opts?: { identifiedFrom?: string; statusPill?: string },
): HTMLElement {
  const top = h('div', 'entity-top', [h('h2', undefined, [profile.name])]);
  if (opts?.statusPill) top.append(h('span', 'pill-status pill-status--low', [opts.statusPill]));
  const card = h('section', 'card entity', [top]);
  const meta = [profile.domain, profile.location].filter(Boolean).join(' · ');
  if (meta) card.append(h('div', 'meta', [meta]));
  const foot = h('div', 'entity-foot');
  if (opts?.identifiedFrom) {
    foot.append(h('span', 'idfrom', [`identified from ${opts.identifiedFrom}`]));
  }
  const change = h('button', 'change', ['change entity']);
  change.addEventListener('click', onChange);
  foot.append(change);
  card.append(foot);
  return card;
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

function snapshotCard(rows: ProfileRow[]): HTMLElement {
  return h('section', 'card summary', [
    h('div', 'section-label', ['Snapshot']),
    h('p', undefined, [summarize(rows)]),
  ]);
}

function lockedBlock(): HTMLElement {
  const block = h('section', 'locked-block', [
    h('div', 'section-label', ['Full record — Middesk']),
    h('p', undefined, []),
  ]);
  const p = block.querySelector('p')!;
  p.append('This card shows the free public-record slice. ');
  p.append(h('b', undefined, ['One Middesk API call returns the rest: ']));
  p.append(LOCKED_CAPS + '.');
  block.append(h('button', 'btn btn--lime', ['See a full sample report →']));
  return block;
}

/** Their agents' verification steps, cycled by the toast while "working". */
const AGENT_STEPS = [
  'Searching Secretary of State records…',
  'Verifying TIN with the IRS…',
  'Screening OFAC and watchlists…',
  'Analyzing web presence…',
];

function agentToast(): HTMLElement {
  const label = h('span', 'toast-label', [AGENT_STEPS[0] ?? '']);
  const clock = h('span', 'toast-clock', ['0:00']);
  const toast = h('section', 'toast', [
    h('div', 'toast-top', [h('span', 'toast-mark'), label, clock]),
    h('div', 'toast-bar', [h('i')]),
  ]);
  let seconds = 0;
  let step = 0;
  // Self-cleaning: the interval dies with the element, so views can swap
  // freely without tracking timers.
  const tick = setInterval(() => {
    if (!toast.isConnected) {
      clearInterval(tick);
      return;
    }
    seconds += 1;
    clock.textContent = `0:${String(seconds % 60).padStart(2, '0')}`;
    if (seconds % 2 === 0) {
      step = (step + 1) % AGENT_STEPS.length;
      label.textContent = AGENT_STEPS[step] ?? '';
    }
  }, 1000);
  return toast;
}

function loadingView(): HTMLElement[] {
  const bones = h('section', 'card');
  for (let i = 0; i < 4; i++) {
    const bone = h('div', 'skeleton');
    bone.style.width = `${85 - i * 12}%`;
    bones.append(bone);
  }
  return [agentToast(), bones];
}

/** Ghosted preview of the report shape — the "empty" state teaches the output. */
function ghostPreview(): HTMLElement[] {
  const widths: Record<SectionId, number[]> = {
    registration: [120, 88, 104],
    federal: [96, 128],
    web: [110, 80],
  };
  return (Object.keys(widths) as SectionId[]).map((s) => {
    const card = h('section', 'card card--ghost', [
      h('div', 'section-label', [SECTION_TITLES[s]]),
    ]);
    for (const w of widths[s]) {
      const row = h('div', 'row row--ghost');
      const label = h('span', 'bar');
      label.style.width = '56px';
      const value = h('span', 'bar');
      value.style.width = `${w}px`;
      row.append(label, value, h('span', 'st st--neutral'));
      card.append(row);
    }
    return card;
  });
}

interface Controller {
  showIdle(): void;
  showLoading(): void;
  showFixture(key: string): void;
  showMiddeskSample(): void;
}

function matchStack(cards: MatchCard[]): HTMLElement {
  const wrap = h('section', 'mstack', [h('div', 'section-label', ['Verification'])]);
  for (const c of cards) {
    wrap.append(
      h('div', 'mcard', [
        h('div', 'mcard-top', [
          h('span', 'lbl', [c.label]),
          h('span', `match match--${c.status}`, [c.match]),
        ]),
        h('div', 'val', [c.value]),
      ]),
    );
  }
  return wrap;
}

/** Fraud-intelligence card + indicator tally, cloned from their product imagery. */
function riskCard(risk: NonNullable<MiddeskBusiness['risk_assessment']>): HTMLElement {
  const band = risk.band.charAt(0).toUpperCase() + risk.band.slice(1);
  const card = h('section', 'card riskcard', [
    h('div', 'mcard-top', [
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

function idleView(ctl: Controller): HTMLElement[] {
  const hero = h('section', 'hero', [
    h('h2', undefined, ['Know the business behind any site.']),
    h('p', undefined, [
      'Registration status, filings, watchlists, web presence — verified against authoritative sources.',
    ]),
  ]);
  const verify = h('button', 'btn', ['Verify this business']);
  verify.addEventListener('click', () => {
    // Long enough for the agent toast to play a couple of steps.
    ctl.showLoading();
    setTimeout(() => ctl.showMiddeskSample(), 2600);
  });
  hero.append(h('div', 'confirm-row samples', [verify]));
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

function devStrip(ctl: Controller): HTMLElement {
  const strip = h('nav', 'devstrip');
  const entries: [string, () => void][] = [
    ['home', () => ctl.showIdle()],
    ['api', () => ctl.showMiddeskSample()],
    ['paseo', () => ctl.showFixture('paseo')],
    ['thin', () => ctl.showFixture('thin')],
    ['loading', () => ctl.showLoading()],
  ];
  for (const [label, fn] of entries) {
    const b = h('button', 'devlink', [label]);
    b.addEventListener('click', fn);
    strip.append(b);
  }
  return strip;
}

function boot(): void {
  const app = document.getElementById('app')!;
  const column = h('div', 'col');
  const main = h('main');
  const footer = h('footer', 'panel-footer');

  const ctl: Controller = {
    showIdle: () => main.replaceChildren(...idleView(ctl)),
    showLoading: () => main.replaceChildren(...loadingView()),
    showFixture: (key: string) => {
      const f = FIXTURES[key];
      if (!f) return;
      const auto = pickAutoConfirm(f.candidates);
      const showProfile = (identifiedFrom?: string) =>
        main.replaceChildren(
          entityHeader(f.profile, showCandidates, { identifiedFrom }),
          snapshotCard(f.profile.rows),
          ...sectionCards(f.profile.rows),
          ...aboutCard(f.profile),
          lockedBlock(),
        );
      const showCandidates = () =>
        main.replaceChildren(candidatesCard(f.candidates, () => showProfile()));
      if (auto) showProfile(ORIGIN_LABELS[auto.origin]);
      else showCandidates();
    },
    showMiddeskSample: () => {
      const business = middeskApi.business as unknown as MiddeskBusiness;
      const profile = profileFromMiddesk(business);
      const statusPill =
        business.status === 'approved'
          ? 'Approved'
          : business.status.replace('_', ' ').replace(/^./, (ch) => ch.toUpperCase());
      main.replaceChildren(
        entityHeader(profile, () => ctl.showIdle(), { statusPill }),
        snapshotCard(profile.rows),
        matchStack(matchCardsFromMiddesk(business)),
        ...(business.risk_assessment ? [riskCard(business.risk_assessment)] : []),
        // TIN and watchlists live in the stack above; the remaining sections
        // add the per-state and web detail beneath it.
        ...sectionCards(profile.rows.filter((r) => r.section !== 'federal')),
      );
    },
  };

  column.append(topbar(), main, footer);

  if (IS_EXTENSION) {
    app.append(column);
  } else {
    document.body.classList.add('harness');
    footer.append(devStrip(ctl));
    app.append(h('div', 'frame', [stage(), h('div', 'dock', [column])]));
  }

  const params = new URLSearchParams(location.search);
  const key = params.get('fixture');
  if (params.get('state') === 'loading') ctl.showLoading();
  else if (key && key in FIXTURES) ctl.showFixture(key);
  else ctl.showIdle();
}

boot();
