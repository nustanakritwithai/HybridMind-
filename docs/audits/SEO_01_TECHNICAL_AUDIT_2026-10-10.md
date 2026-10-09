# HYBRID MIND — SEO-01 Technical Crawl & Indexing Audit (READ ONLY)

**Date:** 2026-10-10 (Asia/Bangkok)  
**Site:** https://hybridmind.online (WordPress.com Atomic ID `257844857`)  
**Owner directive:** “ทำเลย” immediately following the approved scope of SEO-01: Technical Audit for Robots, Sitemap, Indexing, Canonical, Structured Data, Open Graph, crawler discoverability.  
**Mode:** READ ONLY Production; writing this GitHub audit and Project Control is allowed; **zero WordPress production writes or settings changes** in SEO-01.  
**Control:** **UNKNOWN ≠ PASS**.

[Machine-readable evidence matrix](SEO_01_TECHNICAL_MATRIX_2026-10-10.json)

## Executive determination

**Technical foundation: PARTIAL PASS. Search-indexing release gate: HOLD.**

Already present and verified from connected WordPress rendered HTML:

- Published homepage and posts are accessible to the authenticated site page reader as anonymous rendered HTML. Site platform reports `launch_status=launched`.
- The Homepage and **all 3 published posts** have a single self-referencing canonical and descriptive titles/meta descriptions.
- Existing **Jetpack/WordPress JSON-LD Schema** is parseable: Homepage `Organization` + `WebSite` (1 JSON-LD graph), and each published post has `Person` + `Article` + `BreadcrumbList` (1 graph per post). **Do not inject duplicate Organization/Article schema.**
- `robots.txt` does not directly block Googlebot or OAI-SearchBot on article URLs at the file-rule level.

The **P0 blockers** and contradicting evidence:

1. **Public-indexing setting conflict:** WordPress.com Site Management `settings.get.privacy.blog_public=0` and `manage-site.status.visibility=discourage_search`, **but** a separate authenticated WordPress core REST `GET /wp/v2/settings` returned `blog_public=1` from the same configured domain/site. The anonymous HTML head returned only `<meta name="robots" content="max-image-preview:large">`, not a `noindex` directive. The *effective* indexed/not-indexed control is **UNKNOWN**; no direct `X-Robots-Tag` HTTP response-header inspection was available. **DO NOT flip either option merely to align readings**; first reconcile sources and owner indexing intent.
2. **Sitemap conflict:** Jetpack REST `GET /jetpack/v4/settings` reports `"sitemaps": true` and `"seo-tools": true`, and `robots.txt` declares `/sitemap.xml` and `/news-sitemap.xml`. However the public HTML reader returned WordPress **“ไม่พบหน้า” (not found)** HTML rather than sitemap XML at `/sitemap.xml`, `/news-sitemap.xml`, `/wp-sitemap.xml`, and `/sitemap_index.xml`. Actual HTTP status codes were not returned by this reader. **XML availability FAIL in inspected outputs; underlying reason UNKNOWN.** WordPress.com documents that Sitemap discovery depends on public/discourage-search visibility, so the present intentionally discouraged status may explain some of this, but that is not proven.

The website being accessible to a human or a connected HTML reader is **not proof** Google, Bing or ChatGPT crawlers have successfully fetched it, accepted the indexability directives, or indexed any URLs.

## Scope: production published content

- **Homepage Page #16** — UI V3 live, hidden/inactive Affiliate Ad Slot reservations only; SEO description corrected in preceding R2 to remove “ต้นแบบ”.
- **Published #55:** AI ERA 2026 Visual Interactive Agent / MCP / A2A.
- **Published #52:** AI game development tools, Godot / Unreal / Blender.
- **Published #31:** GS20 smart glasses guide, with seller claim still requiring source verification before using it as an asserted product test.
- **Published About #1** and `/category/ai-news/` and `/category/explained/` for site navigation and crawl path.
- Trust Pages **#67 Contact / #68 Privacy / #69 Editorial / #70 Affiliate Disclosure** are **Draft**. **#57 TH-AI Passport** is also Draft. None was published.

## URL and metadata verification

| URL / page | Canonical | JSON-LD seen | H1 / accessible text | Open Graph |
|---|---|---|---|---|
| Homepage `/` | PASS → site root | Organization, WebSite | 1 H1 | **FAIL quality:** WordPress `blank.jpg`, 200×200 |
| #55 AI ERA | PASS → exact post permalink | Person, Article, BreadcrumbList | Main iframe contains its own H1; **outer Gutenberg post text outside iframe only ~81 characters** | **FAIL quality:** `blank.jpg`; Article image missing |
| #52 Game AI | PASS | Person, Article, BreadcrumbList | 1 HTML H1, 7 editorial H2 headings | PASS: Featured Media #51, real infographic |
| #31 GS20 | PASS | Person, Article, BreadcrumbList | 1 HTML H1, 9 editorial H2 headings | PASS: Featured Media #26, labelled AI illustration |
| Published About #1 | PASS | BreadcrumbList | **0 rendered H1** (editorial structure improvement) | WordPress placeholder `blank.jpg` |
| AI News archive | Not observed in rendered head | BreadcrumbList | 1 H1, **0 published posts** | Placeholder OG image |
| Explained archive | Not observed in rendered head | BreadcrumbList | 1 H1, **3 published posts** | Placeholder OG image |

The #55 raw WordPress post content is **one `core/html` block with an `iframe srcdoc`**; after excluding CSS, scripts and iframe content, the outer post body has only a short 81-character “interactive lesson, enable JavaScript” fallback. Google may process iframe documents in some situations, so this is **an AEO robustness/discoverability risk**, *not proof Google cannot index any inner text*. Next editorial task: add a short, useful, visible, normal HTML summary with real answers to key Agent / MCP / A2A questions and source links while preserving the interactive iframe without change.

**Schema details:** Each published post has a parseable Article object with `headline`, `datePublished`, `dateModified` and a graph-linked author Person; #31/#52 also have `image`. For #55 the Article has **no image property** (Featured Media ID 0). Rich Results Test/Schema Markup Validator live validation was **not run**; parseable JSON-LD alone does not mean that Google considers the markup eligible for all rich results.

## Robots, crawler controls and availability

The observed `https://hybridmind.online/robots.txt` response (wrapped by the page reader in an HTML `pre` element) had these underlying text rules:

```text
Sitemap: https://hybridmind.online/sitemap.xml
Sitemap: https://hybridmind.online/news-sitemap.xml
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
```

- No `Disallow: /`, `Disallow: /2026/`, `OAI-SearchBot`, `Googlebot` or `Bingbot` block appeared in this file. At **robots-rule level**, articles are allowed. OAI-SearchBot is the OpenAI crawler relevant to ChatGPT Search; it is independent of GPTBot for model training.
- **UNKNOWN:** IP/WAF/CDN challenges, status 200 versus redirected/error HTTP, `X-Robots-Tag`, Googlebot/OAI-SearchBot actual user-agent fetch, robots per redirect host, Search Console index coverage or Google's indexed page version.
- Direct external tools in this run could not open the domain or resolve its DNS from the container, and the WordPress page reader does not expose raw HTTP headers/status. This **tool limitation is not a claim that the public website is offline**.
- `<meta name="robots" content="max-image-preview:large">` was observed in the main pages and relevant archive heads, without `noindex`.
- The `/feed/` route had an RSS document rendered in a viewer `pre` wrapper. This is not an XML sitemap replacement.

**Official guidance:**
- [Google: Technical Search requirements](https://developers.google.com/search/docs/essentials/technical): Google needs crawler access, a successful HTTP response and indexable content; indexing is still not guaranteed.
- [Google: noindex meta or X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/block-indexing): robots.txt does not support `noindex` as a directive.
- [WordPress.com: XML sitemaps and public search settings](https://wordpress.com/support/sitemaps/): enable `Generate XML Sitemaps` and validate search visibility; a sitemap being present does not guarantee indexing.
- [OpenAI: crawler types](https://developers.openai.com/api/docs/bots): allow `OAI-SearchBot` for ChatGPT Search reachability; GPTBot controls are distinct.
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article): use existing correct Article markup, real authors and relevant image rather than duplicate schema scripts.
- [Google: AI features and website](https://developers.google.com/search/docs/appearance/ai-features): Google AI Overviews and AI Mode rely on regular Search eligibility, indexability and snippet visibility; there is no separate special AEO SEO tag.

## Internal links & architecture

- **P1 confirmed broken navigation anchor:** Shared WordPress Header/Footer contains the old `https://hybridmind.online/#hm-smart-picks` Smart Buying link (two instances seen in Homepage and article-page HTML). The new V3 homepage did **not** have an element with `id="hm-smart-picks"` among 57 inspected IDs. Clicking this is likely to land on the homepage without scrolling to a Smart Buying section; this is a broken fragment target, not a 404 HTTP link. Fix via small guarded change: add a stable ID to the appropriate V3 editorial section/card or update both nav/footer links to the actual V3 anchor; test on desktop/mobile afterward.
- **P1 empty category:** AI News `/category/ai-news/` has zero published posts, but it is linked twice on several relevant pages (header/footer). The real category route has a title/H1 but no article results. Decide whether to postpone that menu item, rename to a populated category, or start publishing legitimate news articles after editorial QA; do **not** invent or mass-publish content just to fill the archive.
- Explained `/category/explained/` contains all 3 published posts and renders links.
- About Page #1 renders without an HTML H1 (contains headings, site article content); improve semantic page-title hierarchy in a separate design/SEO patch if compatible with the theme.
- Observed archive pages lack `<link rel="canonical">` in their rendered heads; this is a **review item**, not automatically a Search Console indexing error. Confirm whether these archive URLs should be indexed before forcing archive canonical tags.
- No duplicate DOM IDs were observed on Homepage in this read-only inspection.

## Social branding and image discovery

- Homepage and #55 use `og:image=https://s0.wp.com/i/blank.jpg` with dimension **200×200**, poor for link sharing.
- #52 and #31 have representative OG images from their already published Featured Media IDs #51 and #26.
- WordPress Site Settings report `site_icon=0` and `site_logo=0`. The Twitter fallback image points to WordPress `webclip.png` instead of branded artwork.
- **Recommended next artifact:** properly designed and owner-approved 1200×630 Open Graph artwork for Home and AI ERA #55, square icon/logo, with truthful AI-generated-vs-real-media labeling. Do not silently set Featured Media #55 or replace production media before owner review.

## Next work: prioritized, with release criteria and rollback

### SEO-01.A — Resolve indexing & sitemap controls (P0, READ ONLY first)

1. Independently inspect the actual WordPress option from a trusted WP-Admin view or a controlled read-only WP-CLI operator, then reconcile `blog_public=0` (WordPress.com connector) with `blog_public=1` (WordPress REST).
2. Inspect raw HTTP status/response headers for Homepage, 3 Published article URLs, `robots.txt` and `sitemap.xml` using a capable direct HTTP checker, with and without crawler user-agent headers. Capture HTTP status, effective redirect chain, `X-Robots-Tag`, Content-Type, and Cache-Control.
3. Confirm owner's **intended** public indexing policy: currently the site is public for readers, while indexing is deliberately discouraged. Only if the owner authorizes normal Search visibility, prepare a guarded `blog_public`/SEO setting change with saved before/after and rollback.
4. Once aligned, verify Jetpack sitemap actual `application/xml` and URL list (include canonical Published Page #16 and Posts #55/#52/#31; never Draft #57 or trust drafts), then Search Console Sitemaps & URL Inspection. If it still fails, investigate Jetpack routing, not random manual XML injection.
5. Gate: **PASS only when each intended indexable URL has direct successful 200 response, no unintended noindex / robots block, working sitemap and Search Console URL Inspection evidence; otherwise HOLD**. Registration or appearing in the index is not guaranteed.

### SEO-01.B — Small internal-link patch (P1, only with scoped edit approval)

- Back up current Header Navigation #4, Footer template part and Page #16 V3.
- Fix `/#hm-smart-picks` missing target and remove or repoint empty AI News menu item after editorial decision. Preserve other menu items and template blocks with optimistic version checks; compare before/after and navigation impact.
- Do not perform such production writes during SEO-01 READ ONLY.

### SEO-02 / AEO-01 — Assets, trust & answer-ready content (P1)

- Replace blank OG assets on Homepage and #55; configure site icon/logo with user-approved artwork.
- For #55, add concise native HTML explanation outside the iframe, source-date context, 3–5 factual FAQs (visible to readers, not FAQ schema fabricated for rich-results promises), and ensure the existing lesson stays operational.
- Fix About H1 and verify archive canonical policy if needed.
- Finalize #67–#70 public contact/retention/disclosure details with owner sign-off before publishing. These are Draft and unlinked for now.
- Validate JSON-LD against Google's Rich Results Test after changes, not merely regex checks.

### SEO/AEO Measurement — Search Console and Bing Webmaster Tools

- Verify domain ownership, indexability, crawled canonical, discovered-not-indexed states, AI search bot accessibility and search query/citation metrics. No connected Search Console data was available in this audit. Do not claim any indexed keyword ranking.
- Ensure only the content publisher business model applies: **NO HYBRID MIND storefront, checkout, cart, owned product inventory or order flows.** All Affiliate Ad Slots remain inactive with no outgoing campaign links.

## Audited versus unaudited facts

**PASS** = observable structural evidence from two connected WordPress readers/settings and original Gutenberg.  
**FAIL** = demonstrated mismatch of a desired on-page condition (missing fragment target/OG artwork/sitemap XML).  
**CONFLICT / UNKNOWN** = independent controls disagree, or tools cannot inspect HTTP response/header/actual crawler behavior.  
**HOLD** = no authorization to change owner-controlled visibility or publish incomplete disclosures.

**Final verdict:** **SEO technical baseline partial PASS; Release Gate for Search Indexing and Sitemap HOLD (P0). No Production changes in this audit.**  
**Next safe execution:** SEO-01.A diagnostic reconciliation, then fix P1 internal-link problems and OG images in separately scoped, backed-up batches.

**UNKNOWN ≠ PASS.**
