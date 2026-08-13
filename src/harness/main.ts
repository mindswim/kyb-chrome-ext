import './browser.css';
import './site.css';
import { h } from '../lib/dom';
import { fadeScrollbars } from '../lib/scroll-fade';
import { icon } from './icons';
import { renderSite, SITES, type SiteSpec } from './sites';

/**
 * The zero-install demo: a believable Chrome window with tabs, bookmarks, and
 * the real panel — the actual sidepanel.html, embedded as an iframe — docked
 * on the right. The panel has no knowledge of this harness; navigation just
 * reloads the iframe with ?business=<id>, and `none` renders its
 * no-business-found state, which is the honest result off-ICP.
 */

interface Bookmark {
  label: string;
  href: string;
  host: string;
  color: string;
}

/** Set dressing, and a small signature: the demo author's own sites. */
const BOOKMARKS: Bookmark[] = [
  { label: 'juan.so', href: 'https://juan.so', host: 'juan.so', color: '#0B3139' },
  { label: 'os.juan.so', href: 'https://os.juan.so', host: 'os.juan.so', color: '#4B7D00' },
  { label: 'Mindswim', href: 'https://mindswim.co', host: 'mindswim.co', color: '#7C5CFF' },
];

type TabView =
  { kind: 'business'; site: SiteSpec } | { kind: 'bookmark'; bm: Bookmark } | { kind: 'newtab' };

interface Tab {
  id: number;
  view: TabView;
  /** The three business tabs are the demo — they stay put. */
  pinned?: boolean;
}

let nextId = 1;
let tabs: Tab[] = SITES.map((site) => ({
  id: nextId++,
  view: { kind: 'business', site },
  pinned: true,
}));
let activeId = tabs[0]!.id;
let panelOpen = true;

const tabstrip = h('div', 'tabstrip', [h('div', 'traffic', [h('i'), h('i'), h('i')])]);
const siteRegion = h('div', 'site-region');
const urlText = h('span', 'url-text');
const dock = h('aside', 'panel-dock');
const pin = h('button', 'mdk-pin is-open');

const activeTab = (): Tab | undefined => tabs.find((t) => t.id === activeId);

function titleOf(view: TabView): string {
  if (view.kind === 'business') return view.site.tabTitle;
  if (view.kind === 'bookmark') return view.bm.label;
  return 'New Tab';
}

function colorOf(view: TabView): string {
  if (view.kind === 'business') return view.site.tabDot;
  if (view.kind === 'bookmark') return view.bm.color;
  return '#c4c7cc';
}

function panelTargetOf(view: TabView): string {
  return view.kind === 'business' ? view.site.id : 'none';
}

function mountPanel(businessId: string): void {
  const frame = document.createElement('iframe');
  frame.className = 'panel-frame';
  frame.title = 'Middesk Check';
  frame.src = `sidepanel.html?business=${businessId}`;
  dock.replaceChildren(frame);
}

/** Chrome's new-tab shortcuts — and the way to reopen anything you closed. */
function newTabPage(): HTMLElement {
  const grid = h('div', 'nt-shortcuts');
  const entries: { label: string; color: string; go: () => void }[] = [
    ...SITES.map((site) => ({
      label: site.brand,
      color: site.tabDot,
      go: () => focusBusiness(site),
    })),
    ...BOOKMARKS.map((bm) => ({
      label: bm.label,
      color: bm.color,
      go: () => navigateHere({ kind: 'bookmark', bm }),
    })),
  ];
  for (const e of entries) {
    const tile = h('button', 'nt-tile');
    const swatch = h('span', 'nt-swatch');
    swatch.style.background = e.color;
    tile.append(swatch, h('span', 'nt-label', [e.label]));
    tile.addEventListener('click', e.go);
    grid.append(tile);
  }
  const search = h('div', 'nt-search', [h('span', 'nt-search-text', ['Search or type a URL'])]);
  return h('div', 'newtab', [h('div', 'nt-mark', ['Chrome']), search, grid]);
}

function renderContent(view: TabView): void {
  if (view.kind === 'business') {
    urlText.textContent = view.site.domain;
    siteRegion.replaceChildren(renderSite(view.site));
  } else if (view.kind === 'bookmark') {
    urlText.textContent = view.bm.host;
    const frame = document.createElement('iframe');
    frame.className = 'site-frame';
    frame.title = view.bm.label;
    frame.src = view.bm.href;
    siteRegion.replaceChildren(frame);
  } else {
    urlText.textContent = '';
    siteRegion.replaceChildren(newTabPage());
  }
  siteRegion.scrollTop = 0;
}

function render(): void {
  const tab = activeTab();
  if (!tab) return;

  tabstrip.replaceChildren(h('div', 'traffic', [h('i'), h('i'), h('i')]));
  for (const t of tabs) {
    const favicon = h('span', 'tab-favicon');
    favicon.style.background = colorOf(t.view);
    const el = h('button', `tab${t.id === activeId ? ' is-active' : ''}`, [
      favicon,
      h('span', 'tab-title', [titleOf(t.view)]),
    ]);
    if (!t.pinned) {
      const close = h('span', 'tab-close', [icon('close', 12)]);
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(t.id);
      });
      el.append(close);
    }
    el.addEventListener('click', () => {
      activeId = t.id;
      render();
    });
    tabstrip.append(el);
  }
  const add = h('button', 'icon-btn tab-new');
  add.append(icon('add', 16));
  add.addEventListener('click', () => {
    tabs.push({ id: nextId++, view: { kind: 'newtab' } });
    activeId = tabs[tabs.length - 1]!.id;
    render();
  });
  tabstrip.append(add);

  renderContent(tab.view);
  if (panelOpen) mountPanel(panelTargetOf(tab.view));
}

/** Bookmarks always open a new focused tab, never displacing a business. */
function openInNewTab(view: TabView): void {
  tabs.push({ id: nextId++, view });
  activeId = tabs[tabs.length - 1]!.id;
  render();
}

/** New-tab shortcuts behave like Chrome's: they navigate the tab you are on. */
function navigateHere(view: TabView): void {
  const tab = activeTab();
  if (!tab || tab.pinned) {
    openInNewTab(view);
    return;
  }
  tab.view = view;
  render();
}

/** The businesses are always open, so their tiles focus rather than duplicate. */
function focusBusiness(site: SiteSpec): void {
  const existing = tabs.find((t) => t.view.kind === 'business' && t.view.site.id === site.id);
  if (existing) {
    activeId = existing.id;
    render();
    return;
  }
  openInNewTab({ kind: 'business', site });
}

function closeTab(id: number): void {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1 || tabs[index]!.pinned) return;
  tabs = tabs.filter((t) => t.id !== id);
  if (activeId === id) activeId = (tabs[index] ?? tabs[tabs.length - 1]!).id;
  render();
}

function togglePanel(): void {
  panelOpen = !panelOpen;
  pin.classList.toggle('is-open', panelOpen);
  document.getElementById('browser')!.classList.toggle('panel-open', panelOpen);
  const tab = activeTab();
  if (panelOpen && tab) mountPanel(panelTargetOf(tab.view));
  else dock.replaceChildren();
}

function toolbar(): HTMLElement {
  const nav = h('div', 'nav-btns');
  for (const name of ['back', 'forward', 'reload'] as const) {
    const b = h('button', 'icon-btn');
    b.append(icon(name, 18));
    nav.append(b);
  }

  const lock = h('span', 'lock');
  lock.append(icon('lock', 13));
  const urlbar = h('div', 'urlbar', [lock, urlText]);

  const puzzle = h('button', 'icon-btn');
  puzzle.append(icon('extensions', 17));
  pin.title = 'Middesk Check';
  pin.addEventListener('click', togglePanel);
  const more = h('button', 'icon-btn');
  more.append(icon('more', 17));

  return h('div', 'toolbar', [
    nav,
    urlbar,
    h('div', 'ext-area', [puzzle, pin, more, h('span', 'avatar')]),
  ]);
}

function bookmarksBar(): HTMLElement {
  const bar = h('div', 'bookmarks');
  for (const bm of BOOKMARKS) {
    const dot = h('span', 'bm-dot');
    dot.style.background = bm.color;
    const button = h('button', 'bookmark', [dot, h('span', undefined, [bm.label])]);
    button.addEventListener('click', () => openInNewTab({ kind: 'bookmark', bm }));
    bar.append(button);
  }
  return bar;
}

function boot(): void {
  const browser = document.getElementById('browser')!;
  browser.classList.add('panel-open');
  browser.append(tabstrip, toolbar(), bookmarksBar(), h('div', 'browser-body', [siteRegion, dock]));
  fadeScrollbars(siteRegion);
  render();
}

boot();
