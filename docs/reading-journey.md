# Reading journey continuation — 2026-10-26

Base: deployed PR #4, `74be8d1113a9ab42ca13e5d57dea4678cb57e22e`.

## Observed gaps and bounded changes

The previous reader already had a topic sidebar, mobile TOC, keyword filters, section links, named article neighbours, explicit learning-path ordering and device-only opt-in completion. This release keeps those features and the six reviewed interactive roots.

- The textbook root now opens a book overview. `?view=book` also links to it explicitly. The nine existing proposed topics distinguish full articles available in this snapshot from empty outlines. Counts refer to the same five verified public articles; cross-listing does not create more source content.
- Topic/type/level/language filters can browse without a keyword. Results state the displayed and total count and offer additional pages. The query and filters remain in the URL and browser history.
- Article search results, outline starts and named previous/next links use `?topic=<stable ID>&article=<stable article ID>`. They land at the article title and introduction, including articles with no heading. Existing section routes still work. Missing article IDs explain the fallback.
- Completion is also available at the end of the topic after opt-in. Updating it replaces only the completion controls, preserving the current scroll position and mounted labs. Navigation remains available without consent. The final panel returns to the book overview and preserves any explicitly chosen learning path.

The real pilot path currently contains one topic. Its end is labelled honestly; no unapproved next topic or new editorial sequence is invented. Multi-topic ordering remains tested with synthetic paths in the existing reader suite.

## Reproduce

Use Node.js 24 and installed Edge/Chrome (`HM_EDGE_PATH` if necessary):

```sh
npm run lint
npm test
npm run evaluate
npm run build:pages
npm run test:pages
```

`tests/reading-journey-browser.test.mjs` adds real browser book/filter/article/history/completion coverage at 1440×1000 and 390×844. The existing reader and all-control interactive suites remain required. CI repeats all browser suites with `/HybridMind-` as the URL prefix. Screenshots and browser evidence are under `artifacts/reading-journey/` (live runs use `artifacts/live-reading-journey/`).

For live acceptance, set `HM_LIVE_URL` to the verified textbook URL and `HM_EXPECTED_RELEASE_SHA` to the deployed merge commit before running the journey and interactive browser suites. The live journey runner requires the exact release manifest SHA. Also compare every runtime hash and the preserved homepage bytes using the release verification procedure in `pages-deployment.md`.

## Limits and next decisions

This is the same five-article REST capture, not a bulk import or a new source revision. Editorial taxonomy/sequence approval and selection of additional public articles remain separate decisions. Keyword search remains local; no semantic-search claim, vendor selection or new service is added. The labs remain the reviewed educational simulations documented in `interactive-runtime.md`.

No WordPress content/settings, Affiliate work, RAMAGAN, ECC, credentials, permissions or original root homepage are changed. Rollback is a reviewed revert to the preceding PR #4 release; no shared-history reset or WordPress change is necessary.
