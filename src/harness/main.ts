import './browser.css';
import './site.css';
import { h } from '../lib/dom';
import { overlayScrollbar } from '../lib/overlay-scrollbar';
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
  ink: string;
}

/** Set dressing, and a small signature: the demo author's own sites. */
const BOOKMARKS: Bookmark[] = [
  { label: 'juan.so', href: 'https://juan.so', host: 'juan.so', color: '#0B3139', ink: '#A7FF1C' },
  {
    label: 'os.juan.so',
    href: 'https://os.juan.so',
    host: 'os.juan.so',
    color: '#4B7D00',
    ink: '#FFFFFF',
  },
  {
    label: 'Mindswim',
    href: 'https://mindswim.co',
    host: 'mindswim.co',
    color: '#7C5CFF',
    ink: '#FFFFFF',
  },
];

type TabView =
  { kind: 'business'; site: SiteSpec } | { kind: 'bookmark'; bm: Bookmark } | { kind: 'newtab' };

interface Tab {
  id: number;
  view: TabView;
  /** The three business tabs are the demo — they stay put. */
  pinned?: boolean;
}

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

let nextId = 1;
let tabs: Tab[] = SITES.map((site) => ({
  id: nextId++,
  view: { kind: 'business', site },
  pinned: true,
}));
let activeId = tabs[0]!.id;
/** Tab currently showing Chrome's favicon spinner during a navigation beat. */
let loadingId: number | null = null;
let panelOpen = true;

const tabstrip = h('div', 'tabstrip');
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

function glyphOf(view: TabView): { letter: string; color: string; ink: string } {
  if (view.kind === 'business') {
    return { letter: view.site.brand.charAt(0), color: view.site.tabDot, ink: view.site.tabInk };
  }
  if (view.kind === 'bookmark') {
    return {
      letter: view.bm.label.charAt(0).toUpperCase(),
      color: view.bm.color,
      ink: view.bm.ink,
    };
  }
  return { letter: '', color: '#e8eaed', ink: '#5f6368' };
}

function panelTargetOf(view: TabView): string {
  return view.kind === 'business' ? view.site.id : 'none';
}

function mountPanel(businessId: string): void {
  const frame = document.createElement('iframe');
  frame.className = 'panel-frame';
  frame.title = 'KYB Check';
  frame.src = `sidepanel.html?business=${businessId}`;
  dock.replaceChildren(frame);
}

/** Chrome's new-tab shortcuts — and the way to reopen anything you closed. */
function newTabPage(): HTMLElement {
  const grid = h('div', 'nt-shortcuts');
  const entries: { label: string; glyph: ReturnType<typeof glyphOf>; go: () => void }[] = [
    ...SITES.map((site) => ({
      label: site.brand,
      glyph: glyphOf({ kind: 'business', site } as TabView),
      go: () => focusBusiness(site),
    })),
    ...BOOKMARKS.map((bm) => ({
      label: bm.label,
      glyph: glyphOf({ kind: 'bookmark', bm } as TabView),
      go: () => navigateHere({ kind: 'bookmark', bm }),
    })),
  ];
  for (const e of entries) {
    const tile = h('button', 'nt-tile');
    const swatch = h('span', 'nt-swatch', [e.glyph.letter]);
    swatch.style.background = e.glyph.color;
    swatch.style.color = e.glyph.ink;
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

function renderTabs(): void {
  tabstrip.replaceChildren(h('div', 'traffic', [h('i'), h('i'), h('i')]));
  for (const t of tabs) {
    const glyph = glyphOf(t.view);
    const favicon = h('span', 'tab-favicon', [glyph.letter]);
    favicon.style.background = glyph.color;
    favicon.style.color = glyph.ink;
    if (t.id === loadingId) favicon.classList.add('is-loading');
    const el = h('button', `tab${t.id === activeId ? ' is-active' : ''}`, [
      favicon,
      h('span', 'tab-title', [titleOf(t.view)]),
    ]);
    el.title = titleOf(t.view);
    if (!t.pinned) {
      const close = h('span', 'tab-close', [icon('close', 12)]);
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(t.id);
      });
      el.append(close);
      el.addEventListener('auxclick', (e) => {
        if (e.button === 1) closeTab(t.id);
      });
    }
    el.addEventListener('click', () => activate(t.id));
    tabstrip.append(el);
  }
  const add = h('button', 'icon-btn tab-new');
  add.title = 'New tab';
  add.append(icon('add', 16));
  add.addEventListener('click', () => {
    tabs.push({ id: nextId++, view: { kind: 'newtab' } });
    activate(tabs[tabs.length - 1]!.id, true);
  });
  tabstrip.append(add);
}

function renderActive(): void {
  const tab = activeTab();
  if (!tab) return;
  renderContent(tab.view);
  if (panelOpen) mountPanel(panelTargetOf(tab.view));
}

function render(): void {
  renderTabs();
  renderActive();
}

/**
 * Chrome's navigation beat: the favicon becomes a spinner briefly before the
 * page paints. Skipped under reduced motion — the swap is instant there.
 */
function load(): void {
  if (REDUCED_MOTION.matches) {
    loadingId = null;
    render();
    return;
  }
  loadingId = activeId;
  renderTabs();
  window.setTimeout(() => {
    loadingId = null;
    render();
  }, 420);
}

function activate(id: number, force = false): void {
  if (id === activeId && !force) return;
  activeId = id;
  load();
}

function openInNewTab(view: TabView): void {
  tabs.push({ id: nextId++, view });
  activate(tabs[tabs.length - 1]!.id, true);
}

/** New-tab shortcuts behave like Chrome's: they navigate the tab you are on. */
function navigateHere(view: TabView): void {
  const tab = activeTab();
  if (!tab || tab.pinned) {
    openInNewTab(view);
    return;
  }
  tab.view = view;
  load();
}

/** The businesses are always open, so their tiles focus rather than duplicate. */
function focusBusiness(site: SiteSpec): void {
  const existing = tabs.find((t) => t.view.kind === 'business' && t.view.site.id === site.id);
  if (existing) {
    activate(existing.id);
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
  // Fresh tabs have no history, so back and forward render disabled — which
  // is what real Chrome shows.
  const back = h('button', 'icon-btn is-disabled');
  back.append(icon('back', 18));
  const forward = h('button', 'icon-btn is-disabled');
  forward.append(icon('forward', 18));
  const reload = h('button', 'icon-btn');
  reload.title = 'Reload';
  reload.append(icon('reload', 18));
  reload.addEventListener('click', () => {
    if (activeTab()) load();
  });

  const lock = h('span', 'lock');
  lock.append(icon('lock', 13));
  const star = h('span', 'url-star');
  star.append(icon('star', 15));
  const urlbar = h('div', 'urlbar', [lock, urlText, star]);
  urlbar.tabIndex = 0;

  const puzzle = h('button', 'icon-btn');
  puzzle.append(icon('extensions', 17));
  pin.title = 'KYB Check';
  pin.addEventListener('click', togglePanel);
  const more = h('button', 'icon-btn');
  more.append(icon('more', 17));

  return h('div', 'toolbar', [
    h('div', 'nav-btns', [back, forward, reload]),
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
  overlayScrollbar(siteRegion);

  // The sticky site nav earns its shadow only once the page has scrolled.
  siteRegion.addEventListener(
    'scroll',
    () => siteRegion.firstElementChild?.classList.toggle('is-scrolled', siteRegion.scrollTop > 8),
    { passive: true },
  );

  render();
}

boot();
