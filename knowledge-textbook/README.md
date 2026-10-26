# Hybrid Mind knowledge textbook pilot

The local pilot now contains complete public REST-rendered bodies for WordPress posts 1077, 1073, 2241, 2310 and 2494, with 18 inline image placements and five featured-image placements backed by 20 local image files. It preserves source URLs, visible captions, alt text and image metadata. Editorial topic mappings remain proposed.

Run with Node.js 24 or newer:

```powershell
npm run lint
npm test
npm run evaluate
npm run build
npm run serve
```

Open http://127.0.0.1:8000/knowledge-textbook/. Set HM_PILOT_PORT for another loopback port. No package installation, credentials, hosting or paid model is required. The ZIP has the same commands. Browser acceptance uses installed Edge on Windows, or the executable named by HM_EDGE_PATH. It launches a unique temporary profile and loopback debugging port; this Windows runner uses --no-sandbox only for that isolated headless test process.

The source captures are in reference/source-exports/public-rest-2026-10-25/. This is a new anonymous public REST capture. The original Library ZIP could not be downloaded, and its supplied SHA-256 has not been verified. Each entry records a SHA-256 over the exact UTF-8 content.rendered string, a separate normalized bundle digest, the REST modified_gmt revision, and media-file hashes. These verify bytes and identity, not factual correctness or the original WordPress database serialization.

The five-body import is reproducible from the saved files with node scripts/import-public-rest-snapshot.mjs. It validates public publication status, canonical URLs, heading mappings and all downloaded media. It creates an offline content bundle and revision overlay; the original 248-row metadata inventory stays unchanged. Build and serve apply the overlay and verify body and image integrity. The checked-in data/ directory contains only the five public articles and is sufficient for a fresh checkout.

The reader copies allowlisted HTML through an inert parser into new DOM nodes. Imported scripts, inline styles, event handlers and executable embeds are never copied. The six reviewed lab roots in articles 2241/2310/2494 use fixed local modules after verifying the exact source HTML hash, revision and identity. Their 107 original controls, native-canvas scene, prompt/cost simulator and citation/authorization/approval fixtures run in the reader. Unknown or changed source remains static. See docs/interactive-runtime.md for provenance, lifecycle and precise simulation limits. Tables, lists, code, source links, figures and captions remain readable.

All 138 catalog sections map to real headings in this capture. The TOC uses persistent section IDs; available source anchors are reconciled to the current revision. Source IDs are namespaced in the combined reader to prevent collisions. Reordering preserves IDs; heading renames preserve IDs when the original source anchor remains. A rename without a retained source anchor requires editorial remapping and produces a visible fallback instead of a guessed destination.

Search is local keyword search across article bodies and section/topic metadata, with filters. It is not semantic search. Existing held-out judgments concern metadata relevance, not body-level factual support; the body tests separately verify retrieval of real code details. Meilisearch and Typesense remain pluggable, unevaluated deployment options.

Reading progress is opt-in and stored only in this browser. Reset clears progress and consent. Article revisions affect last-read freshness; explicit topic revisions govern completion history. Topic-path previous/next and source-article/section previous/next show destination names. No-JavaScript fallback links lead to the five canonical articles.

Only these five explicitly public articles enter the server and ZIP. The other 243 inventory rows remain excluded. The original WordPress site is unchanged. The same reader is published at https://nustanakritwithai.github.io/HybridMind-/knowledge-textbook/ through the existing Pages workflow. Taxonomy approval, broader inventory verification, full Thai relevance review, field performance, screen-reader review and production unpublish/purge SLA remain separate decisions. See docs/interactive-runtime.md for current behavior and docs/rest-content-delivery.md for the earlier import evidence.

The textbook root now opens the book overview. Filter without a keyword, open an article at its title, or return to the book at the end of a topic. See docs/reading-journey.md for routes, coverage and limits.
