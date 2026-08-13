import './browser.css';
import './site.css';
import { h } from '../lib/dom';
import { icon } from './icons';
import { renderSite, SITES, type SiteSpec } from './sites';

/**
 * The zero-install demo: a believable Chrome window with one tab per demo
 * business and the real panel — the actual sidepanel.html, embedded as an
 * iframe — docked on the right. The panel has no knowledge of this harness;
 * switching tabs reloads the iframe with ?business=<id>.
 */

let active: SiteSpec = SITES[0]!;
let panelOpen = true;

const tabButtons = new Map<string, HTMLElement>();
const bookmarkButtons = new Map<string, HTMLElement>();
const siteRegion = h('div', 'site-region');
const urlText = h('span', 'url-text');
const dock = h('aside', 'panel-dock');

function mountPanel(): void {
  const frame = document.createElement('iframe');
  frame.className = 'panel-frame';
  frame.title = 'Middesk Check';
  frame.src = `sidepanel.html?business=${active.id}`;
  dock.replaceChildren(frame);
}

function switchSite(site: SiteSpec): void {
  active = site;
  for (const [id, tab] of tabButtons) tab.classList.toggle('is-active', id === site.id);
  for (const [id, bm] of bookmarkButtons) bm.classList.toggle('is-active', id === site.id);
  urlText.textContent = site.domain;
  siteRegion.replaceChildren(renderSite(site));
  siteRegion.scrollTop = 0;
  if (panelOpen) mountPanel();
}

function togglePanel(pin: HTMLElement): void {
  panelOpen = !panelOpen;
  pin.classList.toggle('is-open', panelOpen);
  document.getElementById('browser')!.classList.toggle('panel-open', panelOpen);
  if (panelOpen) mountPanel();
  else dock.replaceChildren();
}

function tabstrip(): HTMLElement {
  const strip = h('div', 'tabstrip', [h('div', 'traffic', [h('i'), h('i'), h('i')])]);
  for (const site of SITES) {
    const favicon = h('span', 'tab-favicon');
    favicon.style.background = site.tabDot;
    const tab = h('button', 'tab', [
      favicon,
      h('span', 'tab-title', [site.tabTitle]),
      h('span', 'tab-close', [icon('close', 12)]),
    ]);
    tab.addEventListener('click', () => switchSite(site));
    tabButtons.set(site.id, tab);
    strip.append(tab);
  }
  const add = h('button', 'icon-btn tab-new');
  add.append(icon('add', 16));
  strip.append(add);
  return strip;
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
  const pin = h('button', 'mdk-pin is-open');
  pin.title = 'Middesk Check';
  pin.addEventListener('click', () => togglePanel(pin));
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
  for (const site of SITES) {
    const dot = h('span', 'bm-dot');
    dot.style.background = site.tabDot;
    const bm = h('button', 'bookmark', [dot, h('span', undefined, [site.brand])]);
    bm.addEventListener('click', () => switchSite(site));
    bookmarkButtons.set(site.id, bm);
    bar.append(bm);
  }
  return bar;
}

function boot(): void {
  const browser = document.getElementById('browser')!;
  browser.classList.add('panel-open');
  browser.append(
    tabstrip(),
    toolbar(),
    bookmarksBar(),
    h('div', 'browser-body', [siteRegion, dock]),
  );
  switchSite(active);
}

boot();
