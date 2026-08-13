import { h } from '../lib/dom';
import { icon } from './icons';

/**
 * Three fictional businesses of the kinds Middesk's customers actually verify:
 * an established manufacturer, a contractor, and a fraud-shaped young merchant.
 * Each pairs with a fixture of the same id in src/fixtures.
 *
 * Sites are composed from a shared section vocabulary but declare their own
 * section order and layout variants, so switching tabs changes structure and
 * density — not just palette. Everything visual comes from the `theme` token
 * map; imagery is CSS-painted, so the demo has no external assets.
 */

type Section =
  | {
      kind: 'hero';
      variant: 'editorial' | 'industrial' | 'saas';
      eyebrow: string;
      title: string;
      sub: string;
      cta: string;
      note?: string;
    }
  | { kind: 'logos'; label: string; names: string[] }
  | { kind: 'stats'; items: [string, string][] }
  | {
      kind: 'split';
      eyebrow: string;
      title: string;
      body: string;
      bullets: string[];
      flip?: boolean;
    }
  | { kind: 'features'; eyebrow: string; title: string; items: { title: string; body: string }[] }
  | { kind: 'quote'; text: string; who: string; role: string }
  | { kind: 'cta'; title: string; body: string; button: string };

export interface SiteSpec {
  id: 'paseo' | 'harbor' | 'nimbus';
  tabTitle: string;
  tabDot: string;
  domain: string;
  brand: string;
  brandMark: 'wordmark' | 'block' | 'glyph';
  nav: string[];
  navCta: string;
  theme: Record<string, string>;
  sections: Section[];
  footerCols: { title: string; links: string[] }[];
  footerLegal: string;
}

export const SITES: SiteSpec[] = [
  {
    id: 'paseo',
    tabTitle: 'Paseo — Cold Brew Systems',
    tabDot: '#B0703C',
    domain: 'paseo.example',
    brand: 'Paseo',
    brandMark: 'wordmark',
    nav: ['Equipment', 'For roasters', 'Service', 'Story'],
    navCta: 'Request a quote',
    theme: {
      '--s-bg': '#FBF7F0',
      '--s-surface': '#FFFFFF',
      '--s-surface-2': '#F4EDE1',
      '--s-ink': '#241C14',
      '--s-muted': '#7B6B58',
      '--s-accent': '#A85F32',
      '--s-accent-ink': '#FFFDF9',
      '--s-line': '#E6DACA',
      '--s-display': "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
      '--s-display-weight': '400',
      '--s-display-size': '52px',
      '--s-case': 'none',
      '--s-track': '-0.015em',
      '--s-radius': '4px',
      '--s-pill': '999px',
      '--s-gap': '28px',
      '--s-section-y': '84px',
      '--s-nav-bg': 'rgba(251, 247, 240, 0.88)',
      '--s-nav-ink': '#241C14',
      '--s-media': 'radial-gradient(120% 90% at 30% 15%, #D9B892 0%, #B7833F 45%, #6F4622 100%)',
      '--s-media-2': 'linear-gradient(160deg, #F0E4D2 0%, #D8BE9C 100%)',
    },
    sections: [
      {
        kind: 'hero',
        variant: 'editorial',
        eyebrow: 'Small-batch brewing equipment',
        title: 'Cold brew systems built like furniture.',
        sub: 'Paseo designs and manufactures slow-extraction brewing equipment for cafés and specialty roasters. Machined in Seattle, finished by hand, serviced by the people who built it.',
        cta: 'Browse the catalog',
        note: 'Lead time 4–6 weeks · Ships nationwide',
      },
      {
        kind: 'logos',
        label: 'Pouring at',
        names: ['Fieldnote', 'Rally Coffee', 'Marrow', 'Ostro Roasters', 'Verano'],
      },
      {
        kind: 'split',
        eyebrow: 'How we build',
        title: 'One workshop, twelve-year warranty.',
        body: 'Every tower is assembled on a single bench by one technician, pressure-tested for 48 hours, and signed. When something needs attention years later, the same shop answers the phone.',
        bullets: [
          'Walnut, steel, borosilicate',
          'Serviceable without proprietary parts',
          'Field techs in WA, OR and CO',
        ],
      },
      {
        kind: 'features',
        eyebrow: 'The catalog',
        title: 'Three systems, sized to the room.',
        items: [
          {
            title: 'Tower Series',
            body: 'Slow-drip towers tuned for 8–64 hour extractions, in three heights.',
          },
          {
            title: 'Keg Systems',
            body: 'Nitro-ready kegging lines sized for cafés rather than stadiums.',
          },
          {
            title: 'Service Plans',
            body: 'Scheduled maintenance and parts from our own technicians.',
          },
        ],
      },
      {
        kind: 'quote',
        text: 'We have run the same Paseo tower every day for six years. It has been rebuilt once, by the person whose initials are on it.',
        who: 'Nora Alvidrez',
        role: 'Owner, Fieldnote Coffee',
      },
      {
        kind: 'stats',
        items: [
          ['600+', 'cafés equipped'],
          ['12 yr', 'build warranty'],
          ['2014', 'founded in Seattle'],
        ],
      },
    ],
    footerCols: [
      { title: 'Equipment', links: ['Tower Series', 'Keg systems', 'Accessories', 'Parts'] },
      { title: 'Support', links: ['Service plans', 'Manuals', 'Warranty', 'Contact'] },
      { title: 'Company', links: ['Our story', 'Workshop tour', 'Wholesale', 'Careers'] },
    ],
    footerLegal: '© 2026 Paseo, Inc. · 411 Fremont Ave N, Seattle, WA 98103',
  },
  {
    id: 'harbor',
    tabTitle: 'Harbor Line Contracting',
    tabDot: '#F0B429',
    domain: 'harborlinecontracting.example',
    brand: 'Harbor Line',
    brandMark: 'block',
    nav: ['Projects', 'Capabilities', 'Safety', 'Careers'],
    navCta: 'Request a bid',
    theme: {
      '--s-bg': '#F3F5F7',
      '--s-surface': '#FFFFFF',
      '--s-surface-2': '#E7EBEF',
      '--s-ink': '#0F1C26',
      '--s-muted': '#5A6B78',
      '--s-accent': '#F0B429',
      '--s-accent-ink': '#0F1C26',
      '--s-line': '#D5DDE3',
      '--s-display': "system-ui, -apple-system, 'Segoe UI', Helvetica, sans-serif",
      '--s-display-weight': '800',
      '--s-display-size': '46px',
      '--s-case': 'uppercase',
      '--s-track': '-0.01em',
      '--s-radius': '2px',
      '--s-pill': '2px',
      '--s-gap': '18px',
      '--s-section-y': '60px',
      '--s-nav-bg': '#0F1C26',
      '--s-nav-ink': '#FFFFFF',
      '--s-media': 'linear-gradient(150deg, #2C3E4C 0%, #16242F 60%, #0F1C26 100%)',
      '--s-media-2': 'repeating-linear-gradient(135deg, #E7EBEF 0 14px, #DCE3E8 14px 28px)',
    },
    sections: [
      {
        kind: 'hero',
        variant: 'industrial',
        eyebrow: 'Commercial general contractor · WA & OR',
        title: 'Built on the working waterfront.',
        sub: 'Tenant improvements, industrial fit-outs, and marine-adjacent structures across the Puget Sound. Licensed, bonded, and on schedule since 2011.',
        cta: 'Request a bid',
        note: 'WA UBI 603 088 412 · Bonded & insured',
      },
      {
        kind: 'stats',
        items: [
          ['240+', 'projects delivered'],
          ['0.72', 'EMR safety rating'],
          ['15 yr', 'in business'],
          ['48', 'field crew'],
        ],
      },
      {
        kind: 'features',
        eyebrow: 'Capabilities',
        title: 'What we self-perform.',
        items: [
          {
            title: 'Pre-construction',
            body: 'Budgets, permitting, and constructability review before a shovel moves.',
          },
          {
            title: 'Design-build',
            body: 'Single-contract delivery with in-house carpenters and concrete crews.',
          },
          {
            title: 'Marine & special',
            body: 'Docks, pile repair, and the work other GCs decline to bid.',
          },
        ],
      },
      {
        kind: 'split',
        eyebrow: 'Safety',
        title: 'The EMR is the résumé.',
        body: 'Weekly toolbox talks, a full-time safety manager, and an incident rate that keeps our crews working and our clients insurable. Every project ships with a site-specific safety plan.',
        bullets: [
          'OSHA 30 across all supervisors',
          'Drug-free workplace program',
          'AGC of Washington member',
        ],
        flip: true,
      },
      {
        kind: 'quote',
        text: 'They bid the pile repair nobody else would touch, then finished the tenant improvement two weeks early. We do not go out to bid anymore.',
        who: 'Ray Mendel',
        role: 'Facilities Director, Sound Cold Storage',
      },
      {
        kind: 'cta',
        title: 'Have a project on the water?',
        body: 'Send drawings or a scope and we will return a preliminary number within five business days.',
        button: 'Request a bid',
      },
    ],
    footerCols: [
      { title: 'Work', links: ['Recent projects', 'Sectors', 'Self-perform', 'Prequalify'] },
      { title: 'Company', links: ['About', 'Leadership', 'Safety record', 'Careers'] },
      { title: 'Contact', links: ['Tacoma office', 'Bid desk', 'Subcontractors', 'Billing'] },
    ],
    footerLegal:
      '© 2026 Harbor Line Contracting LLC · 2215 Port of Tacoma Rd, Tacoma, WA 98421 · WA UBI 603 088 412',
  },
  {
    id: 'nimbus',
    tabTitle: 'Nimbus Refunds — Get your money back',
    tabDot: '#7C5CFF',
    domain: 'nimbusrefunds.example',
    brand: 'Nimbus',
    brandMark: 'glyph',
    nav: ['How it works', 'Pricing', 'Reviews', 'Help'],
    navCta: 'Start a claim',
    theme: {
      '--s-bg': '#08090F',
      '--s-surface': 'rgba(255, 255, 255, 0.04)',
      '--s-surface-2': 'rgba(124, 92, 255, 0.10)',
      '--s-ink': '#F2F3FB',
      '--s-muted': '#9096B8',
      '--s-accent': '#7C5CFF',
      '--s-accent-ink': '#FFFFFF',
      '--s-line': 'rgba(255, 255, 255, 0.10)',
      '--s-display': "system-ui, -apple-system, 'Segoe UI', Helvetica, sans-serif",
      '--s-display-weight': '700',
      '--s-display-size': '58px',
      '--s-case': 'none',
      '--s-track': '-0.035em',
      '--s-radius': '18px',
      '--s-pill': '999px',
      '--s-gap': '22px',
      '--s-section-y': '76px',
      '--s-nav-bg': 'rgba(8, 9, 15, 0.72)',
      '--s-nav-ink': '#F2F3FB',
      '--s-media': 'radial-gradient(90% 80% at 25% 20%, #7C5CFF 0%, #4B2FCF 40%, #140F33 100%)',
      '--s-media-2': 'linear-gradient(140deg, rgba(124,92,255,.28) 0%, rgba(0,0,0,0) 70%)',
    },
    sections: [
      {
        kind: 'hero',
        variant: 'saas',
        eyebrow: 'Refund recovery, handled',
        title: 'Get your money back. Fast.',
        sub: 'We chase failed orders, double charges, and sellers who stopped replying — so you do not have to. One flat fee, and you keep everything we recover.',
        cta: 'Start a claim — $49',
        note: 'No refund, no fee* · Average payout in 48 hours*',
      },
      {
        kind: 'logos',
        label: 'As covered by',
        names: ['DailyCoin Wire', 'RefundHacks', 'ConsumerPost', 'TrustFeed'],
      },
      {
        kind: 'features',
        eyebrow: 'How it works',
        title: 'Three steps. That is the whole product.',
        items: [
          {
            title: '1 · Upload proof',
            body: 'Screenshots, order emails, chat logs. Our system takes it from there.',
          },
          {
            title: '2 · We escalate',
            body: 'We file with processors, banks, and platforms. They respond to us.',
          },
          {
            title: '3 · You get paid',
            body: 'Funds land in your account, usually within two business days.',
          },
        ],
      },
      {
        kind: 'stats',
        items: [
          ['92%', 'success rate*'],
          ['$4.9M', 'recovered*'],
          ['48h', 'average payout*'],
          ['30k+', 'claims filed*'],
        ],
      },
      {
        kind: 'quote',
        text: 'Paid the fee on a Tuesday, had $1,840 back by Thursday. Genuinely could not believe it worked.',
        who: 'M. Contreras',
        role: 'Verified customer review',
      },
      {
        kind: 'cta',
        title: 'Still holding a charge nobody will refund?',
        body: 'Start a claim in under four minutes. Flat $49 filing fee, refundable if we recover nothing.*',
        button: 'Start a claim — $49',
      },
    ],
    footerCols: [
      { title: 'Product', links: ['How it works', 'Pricing', 'Claim status', 'Refund policy'] },
      { title: 'Company', links: ['About', 'Press', 'Affiliates', 'Contact'] },
      { title: 'Legal', links: ['Terms', 'Privacy', 'Disclosures', 'Do not sell'] },
    ],
    footerLegal:
      '© 2026 Nimbus Refunds, Inc. · 1201 N Orange St Ste 700, Wilmington, DE 19801 · *Self-reported figures. Not a law firm and not affiliated with any bank or payment processor.',
  },
];

function media(className: string): HTMLElement {
  return h('div', className);
}

/**
 * Hero artwork, composed from positioned elements and painted in CSS — a
 * product silhouette, a structural elevation, a product screenshot. Keeps the
 * demo asset-free while reading as art direction rather than a placeholder.
 */
function heroArt(variant: 'editorial' | 'industrial' | 'saas'): HTMLElement {
  const art = h('div', `s-art s-art--${variant}`);
  if (variant === 'editorial') {
    art.append(
      h('div', 'art-globe'),
      h('div', 'art-column'),
      h('div', 'art-drip'),
      h('div', 'art-base'),
      h('div', 'art-shadow'),
    );
  } else if (variant === 'industrial') {
    art.append(
      h('div', 'art-grid'),
      h('div', 'art-beam art-beam--a'),
      h('div', 'art-beam art-beam--b'),
      h('div', 'art-deck'),
      h('div', 'art-piles'),
    );
  } else {
    const rows = h('div', 'art-rows');
    for (let i = 0; i < 3; i++) rows.append(h('div', 'art-row'));
    art.append(
      h('div', 'art-app', [
        h('div', 'art-app-top', [h('span'), h('span'), h('span')]),
        h('div', 'art-amount', ['$1,840.00']),
        h('div', 'art-status', ['Recovered']),
        rows,
      ]),
    );
  }
  return art;
}

function sectionHead(eyebrow: string, title: string): HTMLElement {
  return h('div', 's-head', [h('p', 's-kicker', [eyebrow]), h('h2', undefined, [title])]);
}

function renderSection(s: Section): HTMLElement {
  switch (s.kind) {
    case 'hero': {
      const copy = h('div', 's-hero-copy', [
        h('p', 's-kicker', [s.eyebrow]),
        h('h1', undefined, [s.title]),
        h('p', 's-sub', [s.sub]),
        h('div', 's-hero-actions', [
          h('button', 's-cta', [s.cta]),
          h('button', 's-cta-ghost', ['See how it works']),
        ]),
      ]);
      if (s.note) copy.append(h('p', 's-note', [s.note]));
      const art = media('s-media s-media--hero');
      art.append(heroArt(s.variant));
      return h('header', `s-hero s-hero--${s.variant}`, [copy, art]);
    }
    case 'logos': {
      const strip = h('div', 's-logos', [h('span', 's-logos-label', [s.label])]);
      const row = h('div', 's-logos-row');
      for (const n of s.names) row.append(h('span', 's-logo', [n]));
      strip.append(row);
      return strip;
    }
    case 'stats': {
      const wrap = h('div', 's-stats');
      for (const [num, label] of s.items) {
        wrap.append(h('div', 's-stat', [h('b', undefined, [num]), h('span', undefined, [label])]));
      }
      return wrap;
    }
    case 'split': {
      const copy = h('div', 's-split-copy', [
        sectionHead(s.eyebrow, s.title),
        h('p', 's-sub', [s.body]),
      ]);
      const list = h('ul', 's-bullets');
      for (const b of s.bullets) list.append(h('li', undefined, [b]));
      copy.append(list);
      const art = media('s-media s-media--panel');
      return h('section', `s-split${s.flip ? ' s-split--flip' : ''}`, [copy, art]);
    }
    case 'features': {
      const wrap = h('section', 's-section', [sectionHead(s.eyebrow, s.title)]);
      const grid = h('div', 's-cards');
      for (const c of s.items) {
        grid.append(
          h('article', 's-card', [
            media('s-media s-media--card'),
            h('h3', undefined, [c.title]),
            h('p', undefined, [c.body]),
          ]),
        );
      }
      wrap.append(grid);
      return wrap;
    }
    case 'quote': {
      const stars = h('div', 's-stars');
      for (let i = 0; i < 5; i++) stars.append(icon('star', 14));
      return h('section', 's-quote', [
        stars,
        h('blockquote', undefined, [`“${s.text}”`]),
        h('div', 's-quote-who', [
          h('span', 's-avatar'),
          h('span', undefined, [h('b', undefined, [s.who]), h('em', undefined, [s.role])]),
        ]),
      ]);
    }
    case 'cta':
      return h('section', 's-ctaband', [
        h('div', undefined, [h('h2', undefined, [s.title]), h('p', 's-sub', [s.body])]),
        h('button', 's-cta', [s.button]),
      ]);
  }
}

export function renderSite(site: SiteSpec): HTMLElement {
  const root = h('div', `site site--${site.id}`);
  for (const [prop, value] of Object.entries(site.theme)) root.style.setProperty(prop, value);

  const mark = h('span', `s-mark s-mark--${site.brandMark}`, [
    site.brandMark === 'wordmark' ? site.brand : site.brand.charAt(0),
  ]);
  if (site.brandMark === 'wordmark') mark.classList.add('s-mark--text');
  const brand = h('div', 's-brand', [mark]);
  if (site.brandMark !== 'wordmark') brand.append(h('span', 's-brandname', [site.brand]));

  const links = h('div', 's-links');
  for (const label of site.nav) links.append(h('a', undefined, [label]));
  const nav = h('nav', 's-nav', [brand, links, h('span', 's-navcta', [site.navCta])]);

  const main = h('main', 's-main');
  for (const section of site.sections) main.append(renderSection(section));

  const cols = h('div', 's-footer-cols');
  for (const col of site.footerCols) {
    const c = h('div', 's-footer-col', [h('h4', undefined, [col.title])]);
    for (const l of col.links) c.append(h('a', undefined, [l]));
    cols.append(c);
  }
  const footer = h('footer', 's-footer', [cols, h('p', 's-legal', [site.footerLegal])]);

  root.append(nav, main, footer);
  return root;
}
