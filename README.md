# HYBRID MIND — Modern AI Lifestyle

**Live Smarter. Live Future.**

Project website: https://hybridmind.online  
Editorial platform: WordPress.com (Assembler/Gutenberg)  
This repository: design prototypes, specifications and supporting code; **not** the live WordPress database or production content.

## Business mission

Help Thai readers understand advances in AI and modern technology and make informed decisions about products that improve daily life. Content must be useful even without a purchase. Initial affiliate category: smart audio glasses, via approved Shopee Affiliate links after verification.

## Editorial pillars

1. AI News — verified, dated, sourced news and context.
2. Explained — practical, understandable technology education.
3. Future Lifestyle — Smart Wear, Smart Work, Smart Living, Smart Everyday.
4. Smart Buying — buyer guides, independent comparisons and clear limitations.

## Agent handoff

**Continue here:** [Verified Handoff V0.2 (2026-10-09)](docs/HANDOFF_2026-10-09.md). Start at R1 mobile visual QA; homepage #16 is published/assigned but site remains Coming Soon.

## Current operational status (2026-10-09)

- WordPress site: `hybridmind.online`; WordPress.com Atomic; theme **Assembler**.
- Site remains **Coming Soon** and is not publicly launched. Static homepage is now published and assigned; authenticated editors can preview it.
- WordPress homepage page ID **16** (`hybrid-mind-home`) is **published** and assigned as the site's static front page.
- WordPress Smart Glasses Hub draft: page ID **17** (`smart-glasses`).
- Explainer article draft: post ID **18** (`audio-glasses-vs-ai-glasses`).
- Categories created: `ai-news`, `explained`, `future-lifestyle`, `smart-buying`.
- No affiliate tracking links have been configured; no products claimed hands-on tested.
- Gutenberg Header/Footer and navigation are branded HYBRID MIND, theme Assembler unchanged. A pre-change Gutenberg snapshot is stored at `docs/wordpress/ASSEMBLER_PRECHANGE_2026-10-09.md`.
- GitHub Pages is intended as a **separate design preview**, not the publishing system of record.
- Project Control in Drive: https://docs.google.com/document/d/1fQj8Yd7nVYL8WY5qkZGs-n1lgeWgHfWetKudbS5JXW4/edit

## Release rules

**UNKNOWN ≠ PASS.** A completed AI draft is not an approved article, and a discovered Shopee listing does not mean inventory or commission was verified.

1. Verify sources and original event/publication dates.
2. Separate factual claims, interpretation, and speculation.
3. Do not present AI illustration as real product photos or hands-on tests.
4. Link approved affiliate URLs only, disclose commercial relationships, and avoid auto-clicks and scraping.
5. No WordPress publish, visibility or site-wide theme change without explicit approval.
6. Do not commit API keys, credentials, personal data or customer lists.

## Where to work

- `index.html`: GitHub Pages design prototype (illustrative; **not** live CMS).
- `docs/PROJECT_CONTROL.md`: release gates, work plan and owners.
- WordPress drafts and actual content must stay in WordPress.

## Next milestones

- **W1:** Brand design, homepage structure and navigation draft.
- **W2:** Editorial templates, policies and content pilot.
- **W3:** Smart Glasses buyer guide with verified sources and approved affiliate links.
- **W4:** Multi-Agent newsroom drafts-only integration.
- **W5–W6:** Quality assurance, analytics, soft launch decision.

Project docs reflect a plan and evidence from connector readbacks, not proof that all milestones are complete.
# HybridMind knowledge textbook phase-one pilot

## Run locally

Requires Node.js 18 or newer. From the repository root:

```powershell
node .\scripts\serve-pilot.mjs
```

Then open `http://127.0.0.1:8000/knowledge-textbook/`. The static server binds to loopback only. Use `HM_PILOT_PORT` to select another local port.

The runnable reader receives a public-only projection of five individually verified, non-password-protected WordPress articles and their 138 sections, with proposed editorial mappings. The full 248-row catalog and raw inventory remain offline in the source worktree and are excluded from the runnable build and server routes. WordPress remains canonical for article bodies, Gutenberg media and interactive examples; the reader links back to those source URLs. A typed import contract and safe block renderer can be used when a structured public export is supplied, but the current local snapshot has no bodies/media. See [docs/reader-content-blocker.md](docs/reader-content-blocker.md).

`node scripts/ingest-public-wp.mjs` rebuilds the full catalog offline to `offline/pilot-catalog-full.json` when its four source files under `reference/inventory/knowledge-inventory/` are available. They are not shipped in the runnable ZIP. For a separately approved future refresh, `node scripts/fetch-public-wp-inventory.mjs` uses anonymous GET requests, waits 1.5 seconds between requests, checkpoints each page, and stops on HTTP 429. It captures excerpt/body headings only when WordPress explicitly reports `password_protected: false`; unknown/protected rows retain metadata only. That live capture was not run for this handoff.

Search is a transparent keyword baseline with a small Thai-English alias list, not semantic search. The held-out metrics use metadata judgments only, not body-level answer verification. See [docs/search-evaluation.md](docs/search-evaluation.md) for regressions, results, and limitations.

## Checks and build

```powershell
npm run lint
npm test
npm run evaluate
npm run build
```

The browser acceptance test uses installed Microsoft Edge without adding a dependency. Set `HM_EDGE_PATH` if Edge is installed at a non-default path. The build stages a runnable copy under `dist/hybridmind-knowledge-phase1`.

## Knowledge textbook pilot (2026-10-25)

The phase-one local reader now includes five full public WordPress article bodies and local media. See [runnable pilot instructions](knowledge-textbook/README.md) and [delivery evidence](docs/rest-content-delivery.md).
