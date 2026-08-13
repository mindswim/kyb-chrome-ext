import './panel.css';
import type { BusinessProfile, EntityCandidate, ProfileRow, SectionId } from '../core/types';
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
  const bar = h('header', 'topbar', [h('span', 'logo'), h('h1', undefined, ['Middesk Check'])]);
  bar.append(h('span', 'chip', ['CONCEPT']));
  return bar;
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

function entityHeader(profile: BusinessProfile, onChange: () => void): HTMLElement {
  const card = h('section', 'card entity', [h('h2', undefined, [profile.name])]);
  const meta = [profile.domain, profile.location].filter(Boolean).join(' · ');
  if (meta) card.append(h('div', 'meta', [meta]));
  const change = h('button', 'change', ['change entity']);
  change.addEventListener('click', onChange);
  card.append(change);
  return card;
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

function disclaimer(): HTMLElement {
  return h('p', 'disclaimer', [
    'Public records only — not a compliance decision, credit decision, or consumer report. ' +
      'Every row links to its government source. Candidate concept demo; not affiliated with Middesk.',
  ]);
}

function loadingView(): HTMLElement[] {
  const card = h('section', 'card', [h('div', 'searching', ['Searching authoritative sources…'])]);
  for (let i = 0; i < 4; i++) {
    const bone = h('div', 'skeleton');
    bone.style.width = `${85 - i * 12}%`;
    card.append(bone);
  }
  return [card];
}

function idleView(): HTMLElement[] {
  const card = h('section', 'card idle', [
    h('p', undefined, [
      'Open this panel on a business website to identify the company behind it. ' +
        'Live page scanning lands in Phase 2 — until then, preview with sample data:',
    ]),
  ]);
  const buttons = h('div', 'confirm-row');
  for (const [label, search] of [
    ['Paseo, Inc. (healthy)', '?fixture=paseo'],
    ['Vantis Labs (thin)', '?fixture=thin'],
    ['Loading state', '?fixture=paseo&state=loading'],
  ] as const) {
    const b = h('button', 'btn btn--ghost', [label]);
    // Navigating our own page URL keeps this working identically in the web
    // harness and inside the real chrome-extension:// side panel.
    b.addEventListener('click', () => (location.search = search));
    buttons.append(b);
  }
  card.append(buttons);
  return [card];
}

function devStrip(): HTMLElement {
  const strip = h('nav', 'devstrip');
  for (const [label, href] of [
    ['paseo', '?fixture=paseo'],
    ['thin', '?fixture=thin'],
    ['loading', '?fixture=paseo&state=loading'],
  ] as const) {
    const a = h('a', undefined, [label]);
    a.href = href;
    strip.append(a);
  }
  return strip;
}

function render(): void {
  const app = document.getElementById('app')!;
  app.replaceChildren(topbar());
  const main = h('main');
  app.append(main);

  const params = new URLSearchParams(location.search);
  const fixture = params.get('fixture') ? FIXTURES[params.get('fixture')!] : undefined;

  if (!fixture) {
    idleView().forEach((el) => main.append(el));
    return;
  }
  if (params.get('state') === 'loading') {
    loadingView().forEach((el) => main.append(el));
    main.append(disclaimer());
    app.append(devStrip());
    return;
  }

  const showProfile = () => {
    main.replaceChildren(
      entityHeader(fixture.profile, showCandidates),
      ...sectionCards(fixture.profile.rows),
      lockedBlock(),
      disclaimer(),
    );
  };
  const showCandidates = () => {
    main.replaceChildren(candidatesCard(fixture.candidates, showProfile), disclaimer());
  };

  showCandidates();
  app.append(devStrip());
}

render();
