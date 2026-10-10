# HYBRID MIND — AI Newsroom R1 / Read-only Production Baseline + Dry Run

Date: 2026-10-10 Asia/Bangkok. Production remains unchanged. Rule: **UNKNOWN ≠ PASS**.

## Checkpoint and branch

- Main checkpoint before work: `c12eeaa569ec42f1903b82c62644625272e2e3af`.
- New feature branch: `feat/newsroom-dryrun-v01-20261010`.
- No open PR was found at start. Checked main again after commit: same SHA. All code under new namespaced paths; no existing renderer/theme/CSS changes.
- Read `docs/PROJECT_CONTROL.md`, latest handoff `docs/HANDOFF_2026-10-09.md` and actual site data. Older README's Coming Soon status conflicts with current public Production and is **not** authoritative.

## Production read-only evidence matrix

| Check | Result | Evidence, limitation, smallest next action |
| --- | --- | --- |
| CMS/homepage | PASS | WordPress.com Atomic Assembler; `page_on_front=16`; Page #16 Published; `blog_public=1`; no writes |
| Post #55 presence | PASS | Published ID #55; public DOM contains `hm-a2a-lesson-iframe`, `hm-aeo-native` styling and scope; featured media #105 |
| Post #107 presence | PASS | Published ID #107, updated 2026-10-10 20:35:35; public DOM includes `.hm-content-experience` visual layout |
| Home V3 auto latest article | **FAIL** | Public homepage complete body (about 71KB) lacks article #107 and #115 links while both posts Published; older #55/#52 links remain; static cards have no Query Loop. Change only card-list subcomponent to dynamic Published posts AFTER separate approval |
| XML Sitemap content | **FAIL** | `/sitemap.xml` and `/wp-sitemap.xml` retrieved via public page reader return WordPress HTML/not-found, not XML sitemap. Don't treat 404-looking HTML as success |
| Raw Sitemap HTTP status / Content-Type | **UNKNOWN** | Page reader does not expose the raw upstream response status/header. Run read-only `curl -i` or existing `scripts/seo/inspect-public-headers.ps1` from network-enabled host; validate XML parse before Jetpack or Search Console action |
| Canonical | PASS | Public `<head>` on Home/#55/#107 contains self-canonical URLs |
| OG | Mixed | Home and #55 use true 1200×630 OG images (#104/#105) PASS; #107 uses `https://s0.wp.com/i/blank.jpg` 200×200 and has empty `og:image:alt`: social image quality FAIL |
| Structured Data | PASS for syntax presence | Home one parseable Organization + WebSite graph; #55 and #107 each Person + Article + BreadcrumbList. Independent rich-result testing UNKNOWN; do not inject duplicate Schema |
| Protected unpublished | PASS | Posts #57 Draft; Pages #67, #68, #69, #70 Draft. #121 also appeared as Draft during audit: concurrent editorial work was occurring. None modified |
| Typhoon guest chat | PASS inactive | `Hybrid Mind — Typhoon Chat` plugin inactive (v0.2.2); Newsroom does not import or activate it |
| Affiliate slots | PASS unchanged | Existing V3 reservations were not edited or activated |
| Lab QA Home mobile | PASS with issues | Lighthouse SEO 100, Accessibility 95, Best Practices 100; contrast, accessible-name/label mismatch. Lab emulation only |
| Lab QA Home desktop | PASS with issues | Lighthouse SEO 100, Accessibility 95, Best Practices 100; contrast/name issues. Lab emulation only |
| Lab QA #107 mobile | FAIL accessibility items | Lighthouse Accessibility 93; color contrast, unnamed links, label mismatch. SEO 100, Best Practices 100 |
| Lab QA #55 mobile | FAIL accessibility items | Lighthouse Accessibility 95; unnamed links. Best Practices 96 (console errors), SEO 100 |
| Real Samsung/Android visual and interactions | **UNKNOWN** | No actual device screenshots or taps tested in this run. Desktop/mobile emulation is not physical Android QA |
| Crawler indexing/Search Console | UNKNOWN | `blog_public=1` permits crawl eligibility; not proof of indexing or XML Sitemap health |

All findings are read-only. No production remediation in this branch. Link evidence: WordPress post/page IDs, public URLs, Lighthouse audit output, and the versioned Project Control prior state. Live read-only checks can become stale; rerun before any Production change.

## Reused production assets versus new modules

| Reuse, do not overwrite | New additive code |
| --- | --- |
| WordPress.com Atomic (not a new CMS), Assembler, Homepage V3 #16, Single V3.3, existing interactive lessons, affiliate reservations off, guest Typhoon off | `tools/newsroom/pipeline.py` (offline orchestration + SQLite job ledger), `tools/newsroom/collector.py` (RSS/Atom bytes parser), `contracts/newsroom-{evidence,sources}-v1.schema.json`, `config/newsroom-*`, sample fixture, tests |
| `contracts/visual-article-v1.schema.json` existing Draft contract | Validates existing schema with **real** Python `jsonschema` Draft202012Validator/FormatChecker, then extra news-only editorial gates |
| `tools/visual_article/render_gutenberg.mjs`, current Gutenberg native module markup, existing CSS | Calls renderer as subprocess and prepends fixed script-free `<details>` visual lesson and appends real clickable source links. No model-authored JavaScript |

## Pipeline / data contracts

```text
[Source Registry — network disabled, 6 candidate inputs]
           | (offline parse RSS/Atom sample)
           v
[News Queue: source_published_at / event_at? / fetched_at,
 canonical_url, content_hash, event_key]
           |
           +-- duplicate URL/hash -> DUPLICATE
           +-- same event key -> DUPLICATE across sources
           +-- correction / missing/old/future source date -> NEEDS_REVIEW (HOLD)
           v
[Evidence Packet: source_id, source_url, claim_id,
 evidence_text, primary-statement vs independently verified]
           | mandatory JSON Schema + editorial gates
           v
[Existing Visual Manifest -> existing Gutenberg Renderer]
           | fixed reusable accessible HTML details & source list
           v
[Durable SQLite ledger, worker lock, daily caps]
           |
           v
[MOCK WordPress Draft writer — ONLY sqlite mock_wp]
           | timeout-after-commit -> reconcile before retry
           v
[QA receipt — Production WP post id = null]
```

`event_at` may be **null** when event occurrence date is unknown. Only original article **date**, not fabricated midnight time, is stored as `YYYY-MM-DD`. Fetched time uses real offset. Source edits trigger NEEDS_REVIEW; no stale news promoted as new. `event_key` is a curated event-level identifier and does not automatically solve all paraphrased-duplicate cases: fuzzy same-event detection is an unproven future integration. Contradictory claims/risk flags must HOLD.

### Durable job identifiers and retry behavior

SQLite WAL tables: `news`, `jobs`, `mock_wp`, `daily_budget`. Unique `item_id`, `job_id`, `article_id`, canonical URL, and mock post ID. Worker locking uses transaction + lease and bounded attempts (max 3). A simulated timeout **after** insertion reconciles `mock_wp` by job ID instead of inserting again. Identical rerun does not insert a second mock post. SQLite persistence works on one durable shared volume; NOT certified for distributed hosts or interrupted real HTTP writes. Future real writer must lookup WordPress by durable metadata before retry, and must enforce Contributor/draft-only capabilities; there is NO real WordPress adapter in this branch.

Budget settings `config/newsroom-budget.v1.json`: 10 eligible sample news/day; **0 model calls, 0 tokens and US$0 paid API cost**. `daily_budget` enforced transactionally. Stop switch: create `config/newsroom-stop` on the runner to abort new work. This is a file-based kill switch, **not yet a clickable admin button**. No log prints secrets; no credentials required.

### Source Registry — six candidates, all disabled

OpenAI News RSS, Google DeepMind RSS, Google Research RSS, NVIDIA Technical Blog Atom, Microsoft Research RSS, Google Research public dated archive. XML/feed URLs produced RSS/XML Content-Type responses through a public reader, but their whole XML bodies were **not parsed** by the reader and current runner cannot fetch them. Thus `probe=*MIME_SEEN_BODY_UNVERIFIED` and `enabled=false`. The dated Google Research archive body was read and date listings verified. Before activation, perform rate-limit/robots/terms/HTTP/XML checks per source, do not republish full articles or images, and obtain owner approval for actual API/network collection.

## One-story evidence sample (mock, not published)

Official source: https://research.google/blog/open-and-emergent-problems-in-agentic-privacy-and-security-a-contextual-angle/

- Original source publication **2026-10-05**, not presented as new Oct 10. Event/workshop occurred earlier; exact event day not assumed.
- Story: *Google Research เสนอแนวทางความปลอดภัยของ AI Agent ที่ยึดบริบทเป็นหลัก*.
- Source is a Google Research post, not independent validation of a deployed security product.
- Evidence Packet has 3 sourced claims, 1 official source. Human reviewed as primary-statement; `vendor-claim` statuses, never `verified` simply because Google said so.
- Manifest has 6 bounded Gutenberg modules (summary/process/narratives/checklist), 3 no-script `<details>` interactive questions, and a visible source link.
- `gates`: research PASS, fact_check PASS for source-attribution, `visual_qa` UNKNOWN, editorial PENDING. This does not authorize publication.
- Mock output if validated/rendered locally: `visual-article.gutenberg.html`, `evidence.json`, `visual-article.json`, `qa-report.json`; actual WordPress Draft ID remains null until separately approved.

## How to test after checking out the branch

```bash
python -m pip install -r requirements-newsroom.txt
python -m unittest discover -s tests -v
node --test tools/visual_article/test_renderer.mjs
python -m tools.newsroom.pipeline demo --out .local/newsroom --db .local/newsroom-jobs.sqlite3 --now '2026-10-10T20:40:00+07:00' --mock-timeout
python -m tools.newsroom.pipeline demo --out .local/newsroom --db .local/newsroom-jobs.sqlite3 --now '2026-10-10T20:40:00+07:00'
```

Run tests on the **full Git checkout**, which provides existing `contracts/visual-article-v1.schema.json` and `tools/visual_article/render_gutenberg.mjs`. The standalone delta zip contains only *new* files, not old assets. Do not copy the `.local/` ledger into Git; logs, drafts and jobs stay private. Idempotency proof is same database across first and second invocation; assert `SELECT COUNT(*) FROM mock_wp` remains 1. No production HTTP calls are attempted.

Tests executed while authoring (standalone new-file workspace): 13 unit tests, 12 PASS, 1 SKIPPED because the pre-existing renderer schema is only on the original repo; full-repo renderer/schema integration still UNKNOWN until run on checkout. Mock timeout, process restart, worker lock, retry bound, duplicates, budget, escape and fail-closed editorial logic tests PASS. The existing Gutenberg renderer pure function was additionally executed in an isolated JS runtime with a restricted URL shim: 44 Gutenberg blocks, 3 script-free <details> controls, 1 clickable source link and no <script>. The Node CLI integration and full schema-based runtime test remain UNKNOWN. A real rendered WordPress readback was not performed in this round. Do not promote local fixture HTML to verified live visual QA.

## 30 Draft human-review pilot plan — NOT STARTED

| Scenario | Number | Gate to check |
| --- | ---: | --- |
| Ordinary sourced current news | 5 | all critical claims have cited excerpts |
| Same URL or same event across feeds | 5 | zero duplicate Drafts |
| Old news discovered today | 4 | HOLD, not fresh news |
| Corrected source article | 4 | NEEDS_REVIEW, preserve original receipt |
| Source date missing | 3 | HOLD, no fabricated date |
| Conflicting or sensitive claims | 3 | HOLD, human decision |
| Feed/API failure | 3 | bounded retries, missing-work report |
| WP write timeout after commit | 3 | readback/reconcile rather than duplicate |
| **Total** | **30** | human review is mandatory |

Measure editorial minutes per draft, accepted ratio, amount of human correction, source traceability, real per-story token/currency cost and skipped jobs. All 30 pass does not approve Auto Publish. Before using any real service, owner should approve **in one gate**: six source list + accepted terms, model (Typhoon backend separate from guest chat), rate/call/token budget, secure credentials location (not ChatGPT), WordPress least-privilege role and explicit test-draft-only scope. No provider fallback or spend silently.

## Production repair suggestions — require future owner approvals

1. Homepage newest stories: surgically replace ONLY static story-card feed area with a WordPress `core/query`/Query Loop of Published posts; match V3 classes and preserve inactive affiliate slots, hero, header/footer. Protect draft statuses, regression compare old HTML snapshots, verify desktop/real phone afterward.
2. Sitemap P0: network-enabled real GET captures status, `Content-Type`, body and XML parse + sitemap links. Diagnose endpoint mapping/Jetpack/indexability. **No blind setting toggle**. Check Google Search Console separately.
3. Post #107 OG `blank.jpg` -> separately review/select a legitimate 1200×630 editorial image and explicit license. Do not silently fill media.
4. Fix narrowly confirmed accessibility issues with scoped contrast/accessible label changes and confirm browser keyboard/touch QA before release; do not redesign interactive lessons.

## Rollback

- Production was untouched, therefore **no WordPress rollback** necessary for this R1.
- Revert/delete feature branch or revert its additive commits (keep main original; never delete source content).
- Local dry run stop: place `config/newsroom-stop`; terminate runner; remove only `.local/newsroom*` and dry-run output directory if needed. Do not delete another runner's SQLite file without checking ownership.
- If later authorized to change home V3: capture exact Gutenberg page #16 pre-change snapshot + block hash first; update single Query Loop block; for rollback restore only changed block using conditional hash match. Do not full-rewrite page or disturb affiliate reservations.
- If later authorized real WP Draft: only Trash **new, verified, test-owned** WP IDs after explicit confirmation. Never delete #57 or #67–#70.

## Remaining HOLD/UNKNOWN

1. Full existing Gutenberg renderer integration/schema check and real Desktop/Mobile screenshot of mock output.
2. Real feed body fetch + network terms/rate limitations for all six candidates.
3. Unattended collector, semantic multi-source duplicate detection, reliable corrections/late event-date semantics.
4. Real WordPress least-privilege draft-only writer and idempotency after timeout.
5. Typhoon backend API approval, approved quotas and safe secret store; no credentials in repository/chat.
6. Human visible stop button (only file kill switch now); missed job alert/report UI.
7. Physical Android QA, HTTPS response status/Content-Type for Sitemap.

R1 release gate: **BRANCH PROTOTYPE / LOCAL UNIT TESTS PARTIAL PASS / PRODUCTION QA PARTIAL FAIL / REAL WORDPRESS DRAFT WRITER HOLD / AUTO PUBLISH DENIED**.