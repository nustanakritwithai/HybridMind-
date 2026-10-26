# Hybrid Mind knowledge textbook

A local and GitHub Pages reader for **8 complete public HybridMind articles**, **233 stable sections**, **35 local image files**, and **12 reviewed interactive lab roots**. WordPress remains the canonical source; existing article URLs, visible media credits and references are preserved.

## Read and run

Live book: https://nustanakritwithai.github.io/HybridMind-/knowledge-textbook/

Use Node.js 24 and an installed Chrome/Edge. No dependencies, paid service or credentials are required.

```sh
npm run lint
npm test
npm run evaluate
npm run build:pages
npm run test:pages
npm run serve
```

Open the loopback URL printed by serve. Set HM_PILOT_PORT for another port and HM_EDGE_PATH for another installed browser. Tests use a unique temporary browser profile and loopback debugging endpoint; they do not reuse personal sessions.

## Learning journey

The book shows available content separately from proposed empty outlines. The original five-article “ตรวจสอบงาน AI” topic and its progress revisions are unchanged. The additional **proposed** path is:

1. Retrieval Evaluation — 1740: distinguish retrieval, effective context, answer accuracy and citation support.
2. Evidence Sufficiency — 1755: inspect complete applicable proof sets and question scope.
3. Claim Decomposition — 1770: preserve atomic claims and qualifiers separately from reference support.

Existing article 1077 is linked as preparation, and 2241 as further advanced reading. Each step has named previous/next topic navigation. Article and section bookmarks, topic filters, keyword search, browser Back/Forward and collapsible mobile TOC remain available.

Progress is opt-in, device-only and resettable. Completion uses stable topic IDs and explicit topic revisions; content freshness is separate. Labs retain state within a browsing session when changing chapters, and reset independently.

## Source and runtime integrity

The first five bodies were captured anonymously from public WordPress REST on 2026-10-25. Three additional bodies were captured on 2026-10-26. Public status and non-password protection, canonical URLs, source revisions, response/body SHA-256 and local media hashes are checked. This is not verification of the previously inaccessible Library source ZIP or the raw WordPress database.

The data/ directory is sufficient for a fresh checkout. Replay the additional saved sources using `node scripts/import-evidence-batch.mjs`. Source captures, checkpoints and coverage are under reference/source-exports/. The older importer is documented for its original five-source capture and is not the assembly command for this release.

Imported HTML passes through an inert parser and explicit sanitizer. Imported scripts, handlers, active embeds and inline styles never execute. Twelve exact source roots use reviewed fixed local implementations, bound to source hash/revision/URL. They perform deterministic educational simulations, with no new external runtime requests, trackers, model calls or stored lab data.

All source FACT/CLAIM/ANALYSIS/SIMULATION labels and limits are preserved where present. New sequencing guidance is labelled ANALYSIS. Taxonomy, difficulty and sequence remain proposals.

## Evidence and limits

See docs/evidence-learning-path.md and docs/evidence-interactives.md for scope, reproduction, scientific boundaries and test coverage. Earlier phase evidence remains in docs/rest-content-delivery.md, docs/interactive-runtime.md and docs/reading-journey.md.

Search is local keyword search, not semantic search. Vendor adapters remain injected, unevaluated deployment options. The original benchmark uses its five-source scope; the expanded-corpus diagnostics are reported honestly in the evidence path document. This is a bounded pilot, not a migration of all WordPress posts or certification of every device/assistive technology.

The original homepage, WordPress, Affiliate, RAMAGAN and ECC are unchanged.
