# Search adapters and evaluation

The local adapter indexes topic labels and aliases, article metadata, and section headings/metadata only when the source row is published, marked public, and has an explicit `password_protected: false` observation. Draft, private, password-protected, and unknown-password-state articles are excluded. The delivered browser projection contains only the five individually verified pilot articles and their attached sections. Raw article HTML was not captured, so this is a metadata-only index.

Search uses Thai Unicode word segmentation, transparent keyword scoring, title weighting, a small documented Thai-English alias list, and a two-distinct-concept minimum for phrase queries. Section documents are matched on their own heading and concise summary; the parent article title is not copied into every section, which had caused many weak duplicate matches. Section body excerpts are not used for matching. It has no embeddings or semantic matching. The adapter returns `mode: "keyword"` so the UI does not claim semantic search. A match indicates lexical overlap, not that a source answers the complete question.

Query safety does not suppress ordinary questions merely because they contain “draft” or “unpublished”. The runtime index still contains only explicitly public published records. A narrow generic empty response applies when a query combines a private/draft target, a snippet/content target, and an explicit retrieval action. This does not reveal whether a matching private record exists. A general public question about draft publication policy remains eligible for public search.

Meilisearch and Typesense adapters accept injected SDK-compatible clients and index/collection names. They contain no endpoint, credential, network setup, deployment, or embedding code. They return the shared result shape. They are integration seams only; the pilot does not choose a vendor.

## Thai bake-off status

`tests/fixtures/queries.json` is the 20-case Library fixture (`libfile_bc1515119f988191b4e7188ec8240375`). `expected_topic` remains a human-readable label; article and section gold IDs remain unset. Seven cases have lexical regression assertions against the actual five-source corpus (Q01–Q06 and Q15). They check retrieval of the five matching articles, not relevance rank or full answer coverage. Q11–Q14 and Q19 assert zero results on the actual corpus. Other cases describe topics that may be answerable elsewhere on the site, but are not established by this limited pilot corpus.

The local baseline is a regression target, not a broad relevance-quality claim. Its Thai-English aliases are intentionally small and reviewable. The original 20-case fixture still has only topic labels and diagnostic output; several questions marked answerable in the larger site are not supported by these five pilot records. The actual-corpus regression verifies retrieval for Q01–Q06 and Q15 and zero results for Q11–Q14 and Q19. Returning zero for no-answer cases is necessary, but does not prove full index coverage.

### Held-out metadata judgments

`tests/fixtures/heldout-search.json` is a separate eight-case Thai and mixed-language set with explicit expected public article and section IDs for seven queries, plus one private-snippet request expected to return nothing. The expected titles/headings were judged from the normalized public catalog metadata. They are editorial candidate labels only: the source article bodies were not retrieved, so `body_support_verified` is false in every case and `answerable: true` means “a plausible metadata candidate exists,” not “the body is proven to answer the question.”

Running `npm run evaluate` reports hit counts for this set, not NDCG. Current result: expected article appears at rank 1 for 1/7 answerable queries and within top 5 for 6/7; expected section appears at rank 1 for 6/7 and within top 5 for 7/7. The one private-snippet request returns zero. Some queries still return broad result sets (for example H01 returns 20 records), so these counts measure retrieval of editorially labeled IDs, not precision or answer quality. No Recall@5/NDCG/P95 or vendor comparison is claimed.

The vendors' current official docs describe Thai tokenization/locale support and paths to hybrid search: [Meilisearch language support](https://www.meilisearch.com/docs/resources/help/language), [Meilisearch hybrid search](https://www.meilisearch.com/docs/capabilities/hybrid_search/overview), [Typesense locale support](https://typesense.org/docs/guide/locale.html), [Typesense search API](https://typesense.org/docs/30.2/api/search.html), and [Typesense hybrid-search example](https://typesense.org/docs/guide/reference-implementations/hn-comments-semantic-hybrid-search.html). These pages establish capability only. Engine choice requires reviewed source/section gold, representative Thai judgments, resource and latency measurements, and cost review. This pilot runs no paid embeddings or LLM evaluation.

## Remaining acceptance limits

- The browser test uses an injected three-topic synthetic path to verify order, path query behavior, and titled previous/next links. The real pilot path currently contains only one topic, so it has no adjacent real pilot topic yet.
- Progress is device-only and explicitly opt-in. It distinguishes last viewed section from completion, migrates old `sectionId` records, marks changed revisions, and reset clears consent and progress. There is no cross-device sync.
- URL state now includes `topic`, `section`, `path`, query, filters, and sort; the browser test exercises Back/Forward restoration. Search text replacement uses the current history entry, while route and filter changes create navigable entries.
- Reordering a section preserves its ID when article, heading level, and heading text are unchanged. A renamed heading still needs editorial reassociation of its saved section ID before regeneration; automatic continuity across a rename is not implemented.
- The supplied snapshot has zero verified WordPress anchors and zero article source hashes. The reader uses its own stable section IDs and does not invent canonical fragments.
- Full source article bodies and media are not included. A versioned structured-content contract, offline importer and safe renderer are ready; unsupported interactive blocks become static fallback notes. See [reader-content-blocker.md](reader-content-blocker.md).

## Reproduce

From the runnable package root with Node.js 18 or newer:

```powershell
npm run lint
npm test
npm run evaluate
```

The evaluator uses `offline/pilot-catalog-full.json` in the source worktree when available, or the public-only `data/pilot-catalog.json` in a runnable package. It prints top-five diagnostics for the original set and explicit hit counts for the held-out metadata judgments. It does not calculate NDCG or infer body-level answerability.

## Manual acceptance checklist

- Search can open a topic, article, or section by its stable ID/deep link.
- Browser Back and Forward restore the prior reader route, search and filter state; repeated topic navigation and mobile/desktop routes are covered.
- On mobile, the TOC collapses and opens with keyboard-accessible controls; desktop subject TOC and in-page headings remain usable.
- Reading progress stays device-only, is written only after explicit consent, distinguishes last viewed from completed, reflects revision changes as updated-since-read, and reset clears progress and consent.
- Source text is treated as untrusted: scripts/event handlers are not executed and unsafe markup is rendered as text or sanitized.
- Stable section IDs survive reordering; absent or missing anchors fall back to the canonical article URL with a clear explanation.
- Empty searches, unsupported/no-answer queries, and filters with no matching records produce a clear empty state.
- Only published public sources and their attached sections are discoverable.

The automated tests exercise catalog and content schemas, safe structured import/rendering, search adapters and corpus regressions, plus Edge browser flows for path navigation, URL/history restoration, mobile keyboard TOC, device-only progress/completion/reset/revision state, safe text, missing anchors, no-results, and the loopback server's data exposure boundary. Vendor relevance quality remains unmeasured. The search hit metrics above remain metadata-only judgments, not body-level support assessments.
