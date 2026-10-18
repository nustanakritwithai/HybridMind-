# Search adapters and evaluation

The local adapter indexes topic labels and aliases, article metadata, and section headings/metadata only when the source row is published, marked public, and has an explicit `password_protected: false` observation. Draft, private, password-protected, and unknown-password-state articles are excluded. The delivered browser projection contains only the five individually verified pilot articles and their attached sections. Raw article HTML was not captured, so this is a metadata-only index.

Search uses Thai Unicode word segmentation, transparent keyword scoring, title weighting, a small documented Thai-English alias list, and a two-distinct-concept minimum for phrase queries. It has no embeddings or semantic matching. The adapter returns `mode: "keyword"` so the UI does not claim semantic search. A match indicates lexical overlap, not that a source answers the complete question.

Meilisearch and Typesense adapters accept injected SDK-compatible clients and index/collection names. They contain no endpoint, credential, network setup, deployment, or embedding code. They return the shared result shape. They are integration seams only; the pilot does not choose a vendor.

## Thai bake-off status

`tests/fixtures/queries.json` is the 20-case Library fixture (`libfile_bc1515119f988191b4e7188ec8240375`). `expected_topic` remains a human-readable label; article and section gold IDs remain unset. Seven cases have lexical regression assertions against the actual five-source corpus (Q01–Q06 and Q15). They check retrieval of the five matching articles, not relevance rank or full answer coverage. Q11–Q14 and Q19 assert zero results on the actual corpus. Other cases describe topics that may be answerable elsewhere on the site, but are not established by this limited pilot corpus.

The local baseline is a regression target, not a relevance-quality claim. Its Thai-English aliases are intentionally small and reviewable. Broad questions can still return many sections with partial lexical overlap; only a judged query set with source/section gold IDs can establish precision, recall, Recall@5, or NDCG. No latency percentile or quality comparison is produced. The fixture includes unsupported and no-answer queries; returning zero is necessary for those cases but is not proof of complete index coverage.

The vendors' current official docs describe Thai tokenization/locale support and paths to hybrid search: [Meilisearch language support](https://www.meilisearch.com/docs/resources/help/language), [Meilisearch hybrid search](https://www.meilisearch.com/docs/capabilities/hybrid_search/overview), [Typesense locale support](https://typesense.org/docs/guide/locale.html), [Typesense search API](https://typesense.org/docs/30.2/api/search.html), and [Typesense hybrid-search example](https://typesense.org/docs/guide/reference-implementations/hn-comments-semantic-hybrid-search.html). These pages establish capability only. Engine choice requires reviewed source/section gold, representative Thai judgments, resource and latency measurements, and cost review. This pilot runs no paid embeddings or LLM evaluation.

## Known acceptance gates

The following behaviors are **not yet passing** and must remain visible in any status report:

- Previous/next topic controls follow the flat `catalog.topics` order; they do not follow each learning path's `ordered_topic_ids`.
- Opt-in device-local progress records the last-viewed section and article revision. It does not track lesson completion.
- Browser Back/Forward restores the route and reader view, but does not restore prior search text or filter state.
- Reordering a section preserves its ID when article, heading level, and heading text are unchanged. A renamed heading needs editorial reassociation of its saved section ID before regeneration; automatic continuity across a rename is not implemented.
- The supplied snapshot has zero verified WordPress anchors and zero article source hashes. The reader uses its own stable section IDs and does not invent canonical fragments.
- Full article bodies, Gutenberg media, and interactive blocks are not included. See [reader-content-blocker.md](reader-content-blocker.md).

## Reproduce

From the runnable package root with Node.js 18 or newer:

```powershell
npm run lint
npm test
npm run evaluate
```

The evaluator uses `offline/pilot-catalog-full.json` in the source worktree when available, or the public-only `data/pilot-catalog.json` in a runnable package. It prints top-five diagnostics only; it deliberately does not compare them with the human topic label or calculate ranking metrics.

## Manual acceptance checklist

- Search can open a topic, article, or section by its stable ID/deep link.
- Browser Back and Forward restore the prior reader route; interrupted navigation does not show stale content. Search/filter state restoration remains a known gate above.
- On mobile, the TOC collapses and opens with keyboard-accessible controls; desktop subject TOC and in-page headings remain usable.
- Reading progress stays device-only, is written only after explicit consent, reflects topic revision changes as updated-since-read, and reset clears it. Completion tracking remains a known gate above.
- Source text is treated as untrusted: scripts/event handlers are not executed and unsafe markup is rendered as text or sanitized.
- Stable section IDs survive reordering; absent or missing anchors fall back to the canonical article URL with a clear explanation.
- Empty searches, unsupported/no-answer queries, and filters with no matching records produce a clear empty state.
- Only published public sources and their attached sections are discoverable.

The automated tests exercise the schema/references, search contract/adapters and five-source regressions, plus the Edge browser flows for navigation, Back/Forward, mobile TOC, device-only progress/reset/revision state, safe text, missing anchors, no-results, and the loopback server's data exposure boundary. They do not pass the outstanding gates listed above. Vendor relevance quality remains unmeasured.
