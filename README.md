# Middesk Check

A Chrome side-panel that answers *"is this company real?"* without leaving the page: it identifies the legal entity behind the business website you're on, you confirm the match, and it renders a public-record snapshot — registration status, SEC presence, sanctions screen, domain age — every row linked to its government source.

**Concept demo by a candidate. Not affiliated with Middesk.** It borrows Middesk's design language deliberately: the concept is a free GTM surface for their paid KYB platform, so the panel is built to read like a detached window of their product. Rows only the paid API can fill (TIN match, all-50-state coverage, liens, Business Connections) render as locked rows — the funnel, visible in the UI.

## Status

- [x] **Phase 1 — UI shell.** Side panel + fixture harness, full design-token treatment, all row states (success / warning / failure / neutral / locked), candidate-confirm flow, loading & empty states.
- [ ] **Phase 2 — live data.** On-click page extraction (`activeTab`), source adapters (SEC EDGAR, CO/NY/CT/OR/TX open data, OFAC/CSL sanctions, FinCEN MSB, GLEIF, RDAP), Cloudflare Worker for the one keyed source + pre-baked indexes.
- [ ] **Phase 2.5 — hosted web demo.** The panel is a plain web page, so the same build deploys as a zero-install demo link (fetches route through the Worker where CORS requires it). Extension = the real artifact; link = what you can put in an email.
- [ ] **Phase 3 — demo polish.** Florida index, PDF snapshot, Business-Connections teaser, rehearsed demo script.

## Run it

```sh
npm install
npm run dev          # then open http://localhost:5173/sidepanel.html?fixture=paseo
```

Harness states: `?fixture=paseo` (healthy card), `?fixture=thin` (the honest Delaware-wall case), `?fixture=paseo&state=loading`.

**As the real side panel:** `npm run build`, then chrome://extensions → enable Developer mode → Load unpacked → select `dist/` → click the Middesk Check toolbar icon on any tab. The panel opens with sample-data buttons until Phase 2 wires live sources. After code changes: rebuild, then hit ↻ on the extension card.

![Confirmed profile view](docs/panel-profile.jpg)

## Architecture

```
page (on click, activeTab only)
  └─ extractor: schema.org Organization → footer © line → ToS naming
       └─ side panel: candidates + confidence → USER CONFIRMS
            └─ service worker: fan-out over source adapters (Promise.allSettled)
                 ├─ adapters/edgar      SEC submissions + full-text (keyless, public domain)
                 ├─ adapters/socrata    CO · NY · CT · OR · TX registries (keyless open data)
                 ├─ adapters/csl        Trade.gov consolidated sanctions (key → Worker)
                 ├─ adapters/msb        FinCEN MSB registrants (pre-baked index)
                 ├─ adapters/gleif      LEI + parent/child relationships (CC0)
                 ├─ adapters/rdap       domain registration date (keyless)
                 └─ adapters/middesk    ← the production seam (see below)
                      └─ renderer: normalized ProfileRow[] → sectioned card
```

Design decisions worth stating:

- **`adapters/middesk.ts` exists from day one, typed against Middesk's documented API shapes, deliberately inert.** The free-source fleet exists because Middesk's API is sales-gated; if a key is wired in, one `POST /v1/businesses` replaces all of it. The adapter interface is the pitch, in code.
- **Status vocabulary mirrors Middesk's review tasks** (`success`/`warning`/`failure`) so their API maps in without renames.
- **Entity confirmation is ambiguity-gated.** Domain→legal-entity resolution is genuinely hard (it's part of what Middesk sells). Past the conservative thresholds in `core/resolve.ts` the panel auto-confirms and says where the identification came from; anything murky gets the chooser, and "change entity" is always one click.
- **No LLM in the data path.** Parse → query → render. A row either cites a government source or shows a designed absence; the tool is hallucination-free by construction.
- **Vanilla TypeScript, no framework.** A panel of list rows doesn't need React; reviewers can read the whole thing in one sitting.

## Privacy stance

The only data that ever leaves the browser is the entity name the user confirms, sent to public government APIs (and, in Phase 2, one caching proxy). Never the URL, never page content, no account, no tracking. `activeTab` means zero host permissions on the sites you browse — the extension cannot see any page until you click it.

## Design language

Tokens verified against middesk.com's shipped CSS and product screenshots: midnight `#0B3139`, lime `#A7FF1C` (one accent moment per view, never wallpaper), snow `#F8F8F8`, borders `#CED6D7`; status colors sampled from their real app (`#0D7435` hollow-ring pass, `#C4440E` warning, `#CD2523` fail). Their licensed typefaces (ABC Arizona Serif, ABC Monument Grotesk) are **not** bundled — the panel falls back to Georgia + system-ui, and swapping the real faces in is a licensed-font drop-in.

## Honest limits

Free public sources cover roughly half of real-world lookups end-to-end (six states publish usable registry data; Delaware publishes none). No free source can verify an EIN/TIN, and US beneficial-ownership data does not publicly exist. Those gaps render as locked rows rather than being papered over — in a GTM demo, the gap *is* the pitch.
