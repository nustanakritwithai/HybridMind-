# Public inventory coverage (phase one snapshot)

## Captured source and materialized catalog

The source snapshot in `reference/inventory/knowledge-inventory/` was captured on 2026-10-18 20:36:21 UTC through anonymous, read-only WordPress REST GETs. It reports `status=publish`, 248 unique posts from three pages (100, 100, 48), no duplicate IDs, and complete coverage against the first-page `X-WP-Total=248` / `X-WP-TotalPages=3` values. It excludes pages and custom post types. It did not use credentials or write to WordPress.

`node scripts/ingest-public-wp.mjs` deterministically materializes that local snapshot into `offline/pilot-catalog-full.json`; it does not make a network request. This full coverage file remains offline and is not copied into the runnable build. `scripts/public-projection.mjs` produces the browser/package catalog with only the five explicitly verified public, non-password-protected rows, their sections, and relationships whose endpoints remain in the projection.

The delivered refresh path is `scripts/fetch-public-wp-inventory.mjs`. It uses anonymous GET only, waits 1.5 seconds between requests, persists every page/body-read checkpoint, and stops on HTTP 429 with a retry-after pause instead of retrying immediately. It fetches article excerpt/body headings only after an explicit `password_protected: false` response and rechecks that flag on the body read. This live refresh script was **not run** for this handoff; we used the supplied snapshot and avoided another full crawl.

| Metric | Observed |
| --- | ---: |
| Unique published articles in source snapshot | 248 |
| Public REST pages captured | 3 of 3 |
| Full offline catalog article rows | 248 |
| Browser/package catalog article rows | 5 |
| Source category-to-chapter proposed relationships | 300 |
| Full-read pilot article-to-topic proposed relationships | 6 |
| Topic hubs (8 chapters + child pilot topic) | 9 |
| H2/H3 metadata sections | 5,672 |
| Sections with verified live anchors | 0 |
| Article rows with cross-list review flag | 46 |

The full offline catalog preserves each post's title, excerpt, canonical URL, WordPress ID, publication and modified timestamps, source category through proposed relationship edges, and independent `unknown` content type / audience level. All 248 article records remain `review_needed`; no relationship is approved and no article's `topic_ids` or `primary_topic_id` is populated. The exact 46 IDs in `cross_listed_articles.csv` are marked with `inventory_flags: ["cross_listed_for_editorial_review"]`. The full catalog and raw input snapshot stay in the source worktree's `offline/` and `reference/inventory/` folders; neither is included in the distributable ZIP or the static server's route allowlist.

`password_protected` is `false` only for the five original pilot URLs individually checked through read-only WordPress post lookups (IDs 1077, 1073, 2241, 2310, and 2494). It is `null` for all other records, including full-read pilot article 1053, because the snapshot does not record this field and no independent check was made. `visibility` is `public` only for the five checked rows and `unknown` for the remaining 243. Runtime indexing must exclude rows unless both `visibility === "public"` and `password_protected === false`; unknown visibility must never enter public search. The shared schema must allow these nullable values for catalog validation.

## Full-read pilot evidence

The six proposed child-topic mappings are IDs **1077, 1073, 2241, 2310, 2494, and 1053**. The six article bodies were individually reviewed in the connected read-only WordPress flow; mapping rationale and article-specific limitations are carried in each relationship. In brief: 1077 checks facts, quantities and citations; 1073 checks AI-generated code; 2241 checks RAG citation freshness; 2310 checks document authorization before hydration; 2494 binds approval to a specific action; and 1053 provides an umbrella acceptance checklist. Article 1053 is retained as a proposed mapping but has unknown password status in this snapshot and is excluded from reader cards and search.

The mappings remain proposed. The source articles use synthetic or mocked examples in places; several code or test walkthroughs explicitly say **NOT RUN**. No benchmark, security certification, production readiness, source truth, or test execution is inferred. The body HTML, Gutenberg blocks, media and interactive behavior remain canonical at their original WordPress URLs.

## Sections and stable IDs

The source snapshot contains rendered heading text but no verified source anchor IDs. The catalog therefore emits only H2/H3 metadata rows with `anchor: null` and `anchor_status: missing`. The reader's own section route uses the stable section ID; its canonical WordPress link has no invented fragment until an editor verifies an anchor. Section IDs receive random editorial keys on first generation and are reused from the existing catalog when the same article, heading level and heading text are encountered, so reordering alone does not shift IDs. A heading rename needs its prior ID re-associated before regeneration; the inventory snapshot alone cannot infer that editorial continuity.

## Limits and reconciliation notes

The full offline catalog is a complete metadata snapshot of 248 published posts, not a complete set of reviewed textbook lessons. The public browser/package projection contains only five individually verified public rows and their attached sections; its `coverage_complete` is false and it does not expose the other 243 rows. The full catalog is intentionally tied to the dated 2026-10-18 20:36:21Z snapshot and its 46 cross-listed review rows. A later independent live read reported 249 published posts and 98 cross-listed rows; taxonomy and post counts are mutable, so production use requires a new checkpointed snapshot and explicit reconciliation. The parent has directed that no additional full crawl be performed in this pilot.

The input does not contain raw source HTML, so `source_hash` is null for all rows. The snapshot was taken anonymously with `status=publish`, but it has no separate password-protection field; only the five individually checked posts can be admitted to runtime indexing from this snapshot. The search adapter drops known generic navigation headings and never indexes raw body HTML; the snapshot is insufficient to audit every possible ad/navigation string in metadata, so a fresh public-only source extraction needs that editorial cleanup before production. WordPress remains authoritative for revisions and content. The snapshot warns that category term counts differ from assignment counts; those discrepancies are preserved in the source files rather than normalized.

The reader handoff includes a bounded five-article path with source excerpts, heading outlines, revision metadata where present, and direct HTTPS links. Local full-body and media rendering is blocked: a read-only REST request was denied by the executor network sandbox (`EACCES`) before an HTTP response, and the source snapshot has no raw HTML or media URLs. See [reader-content-blocker.md](reader-content-blocker.md) for the retrieval evidence and safe completion criteria. No partial crawler extraction is presented as a complete lesson.

The full catalog is generated offline from the materialized published-post inventory, so a live re-fetch was unnecessary and was not claimed. If a future refresh is needed, first capture a new public-only REST snapshot with pagination/checkpoints and compare its observed total and IDs; never add unpublished or password-protected content to the public projection. The server serves only fixed asset routes plus the projected JSON endpoint and listens on loopback; `/offline`, `/reference`, and arbitrary file paths are not exposed.
