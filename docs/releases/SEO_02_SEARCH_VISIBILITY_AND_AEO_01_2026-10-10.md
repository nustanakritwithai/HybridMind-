# HYBRID MIND — SEO-02 Search Visibility + AEO-01 #55 Native Answers

**Date:** 2026-10-10, Asia/Bangkok  
**Production:** https://hybridmind.online · WordPress.com Atomic Site ID `257844857`  
**Owner approval context:** Assistant specifically asked whether owner wanted to let Google/Bing index HYBRID MIND to build organic traffic. Owner immediately replied **“ทำต่อเลย”** (“Proceed”), after prior SEO roadmap. Implemented single scoped Search Visibility release plus approved next AEO content fix.  
**Rule:** UNKNOWN ≠ PASS. No assertion of Google/Bing index coverage or LLM citation without Search Console data.

## Summary / verified production result

**Search visibility: PUBLIC / enabled for discovery.**  
**Google/Bing indexed: UNKNOWN — not equivalent to enabling site visibility.**  
**Sitemap: HOLD — linked `/sitemap.xml` still produced not-found HTML via connected public-page reader.**  
**AEO-01 Published Post #55 native answer content: PASS, with original immersive iframe preserved.**

## P0 indexability setting correction — explicit scoped release

Before:
- WordPress.com service `manage-site.status` was `launched / discourage_search`.
- WordPress.com `settings.get.privacy.blog_public=0`.
- On-site WordPress REST API `GET /wp/v2/settings` returned `blog_public=1` — a real observed conflict, previously documented in SEO-01.A.
- Jetpack Backup active, previous attempt not failed, last successful backup **2026-10-08 18:15:15**. **No recent successful full backup confirmed**, and full restore preflight still `null`/UNKNOWN.
- Draft Post #57 remains Draft.

Performed exactly one live visibility change:
- WordPress.com `manage-site.set-visibility` with `visibility="public"` and owner confirmation from latest turn. Result `success=true`, `previous_state="discourage_search"`, `new_state="public"`.
- Subsequent WordPress.com `manage-site.status` returns `launched / public`.
- Subsequent WordPress.com `settings.get.privacy.blog_public=1` **and** on-site WordPress REST `GET /wp/v2/settings` also returns `blog_public=1` — **service/runtime conflict resolved at read-back level**.
- No other site-wide setting or visibility field changed.
- **Rollback if separately requested/required:** WordPress.com `settings.update(blog_public=0)` returns the site to public but discouraging Search Engine indexing; verify against `manage-site.status`, WP.com settings, on-site REST, robots and sitemap; do not toggle back and forth blindly. Full content and trust page statuses are unaffected by this setting.

Post-release publicly rendered content:
- Homepage still serves V3 Hero, 3 Published story links, hidden Affiliate Ad Slots, no Typhoon Chat UI.
- AI ERA #55 still serves published article and Visual iframe.
- Anonymous homepage / #55 HTML `<meta name="robots" content="max-image-preview:large">`; no `noindex` in the inspected HTML. Raw `X-Robots-Tag` HTTP headers and actual Googlebot response status are still UNKNOWN with available tools.
- `/robots.txt` still advertises `/sitemap.xml` and `/news-sitemap.xml`, allows generic crawling except `/wp-admin/`.
- **Immediately after Public change**, the connected WordPress HTML reader still returned *WordPress not-found HTML*, not XML, for `/sitemap.xml`, `/news-sitemap.xml` and `/wp-sitemap.xml` with a cache-busting query. This reader does not supply raw HTTP status or Content-Type; report a failure to obtain sitemap XML, **not confirmed transport 404**. Recheck later without query parameters and with genuine HTTP headers before any attempt to toggle Jetpack; Jetpack REST previously said `sitemaps=true`.
- A Lighthouse SEO basic mobile audit on the homepage previously returned 100/100; that is **not** proof of successful crawling or indexing.

## AEO-01 editorial content: Post #55 AI ERA — Agent / MCP / A2A

Before:
- Post #55 Published, modified `2026-10-09T17:47:46`, Featured Media `0`, raw Gutenberg 50,842 chars, **one existing `core/html` iframe**. Original iframe top-level block SHA-1 `35fffee971d301017a4ad5d8b3d6a8e96c33854d`.
- WordPress native parent text outside iframe was only ~81 chars before modification. This is a concern for independent native HTML Answer Engine visibility, not proof iframe content could not be indexed.

Backups and staging:
- [Exact raw pre-change post #55 backup](../backups/AEO_01_POST_55_PRE_NATIVE_SUMMARY_2026-10-10.html), 50,842 chars, blob SHA `bfbd1607c64036d80b85f4a747bd6964a1a8586e` — independently verified.
- [New one-block Gutenberg native summary](../design/AEO_01_POST_55_NATIVE_SUMMARY_BLOCK_2026-10-10.html), 4,432 chars, blob SHA `4e7a7f6c83bbbc23b2f507e4bd17a08840fda330`. Contains one `core/group`, 6 semantic headings (1 H2, 5 H3), 10 paragraphs, grounded answer content and outgoing primary docs links.
- Official source pages verified before write:
  - https://modelcontextprotocol.io/introduction
  - https://a2a-protocol.org/latest/topics/what-is-a2a/
  - https://developers.openai.com/api/docs/guides/function-calling
- Created temporary WordPress Draft QA Page #101 with same 4,432 char group. Exact edit read-back; rendered WordPress content retained 6 headings and three primary links. Subsequently moved Draft QA #101 to **recoverable Trash**; never published.

Production write:
- Used `post-sections.insert(id=55,index=0,expected_block_type="core/group")` with fresh `expected_modified` and `expected_content_hash`.
- WordPress returned modified **`2026-10-10T02:07:48`**.
- Independent readback: `status=publish`, two top-level blocks, total 55,274 chars, **new native group before original iframe**, original iframe block hash `35fffee971d301017a4ad5d8b3d6a8e96c33854d` **unchanged**, Featured Media 0 unchanged.
- Connected anonymous rendered HTML for #55 contains `hm-aeo-native`, H2 question summary and cited MCP/A2A/OpenAI links *before* `hm-a2a-lesson-iframe`; original immersive lesson remains present. V3.3 article template preserved.
- WordPress-connected PageSpeed Lighthouse mobile for #55 returned **SEO 100/100 + Accessibility 100/100**; scoped basic Lighthouse categories do **not** assess actual AI Search citations or Google indexing.

**AEO caveat:** This is an editorial HTML improvement making concepts directly available; AI Search systems choose sources independently and no ranking/citation gains are guaranteed.

## SEO-04 OG media blocker (no false completion claim)

Two 1200×630 JPEG branded Open Graph artwork candidates from the previous UI/SEO iteration are confirmed present in the current conversation container:

- `/mnt/data/hybrid_mind_og_home_v1.jpg`, 1200×630, 147,472 bytes.
- `/mnt/data/hybrid_mind_og_ai_era_2026_v1.jpg`, 1200×630, 218,734 bytes.

**Not uploaded/installed on WordPress yet**. The WordPress.com media upload grant requires a network-capable environment to issue an HTTPS multipart POST to `public-api.wordpress.com`. The current execution container cannot resolve that domain, and Core WordPress REST does not support raw local attachment paths. Do not fabricate a Media ID or mark OG PASS. As of this round, WordPress Homepage and #55 still use blank social share images.

Next step: owner uploads the two approved JPEGs into WordPress Media Library from their browser or an agent equipped with Cloud Browser/file upload. Once genuine WordPress media IDs exist, set Homepage branded OG image via appropriate WordPress/Jetpack SEO configuration and #55 featured media with a scoped template check to avoid adding a large redundant Featured Image above the existing iframe. Verify public `og:image`, Twitter Card, source URL and responsive article visual results.

## Unchanged invariants and HOLD gates

| Check | After |
| --- | --- |
| WordPress site launch | `launched` |
| WordPress Search Visibility | `public`, `blog_public=1` in WP.com + core REST |
| Published post IDs | #55, #52, #31 |
| Published #55 content | New native answer block, original iframe untouched |
| Draft #57 | still Draft |
| Trust Draft pages #67, #68, #69, #70 | still Draft |
| Typhoon Chat v0.2.2 | inactive |
| Affiliate Ad Slots | hidden / no campaigns |
| Site OG image & #55 Featured Media | still missing |
| Sitemap XML | **HOLD**: not found by current viewer |
| Raw HTTP status/headers and Search Console | **UNKNOWN** |
| Fresh whole-site backup / restore test | **UNKNOWN** |

## Next actions

1. Obtain direct HTTP status/headers on a network-enabled machine using [existing read-only PowerShell probe](../../scripts/seo/inspect-public-headers.ps1) or Google Search Console URL Inspection. Confirm `/sitemap.xml` root request, `Content-Type`, final URL, redirects, `X-Robots-Tag`, Search crawler behavior. Do not infer definitive HTTP 404 from a rendered not-found title alone.
2. Check Jetpack Traffic → Sitemaps in WordPress admin now that site is Public. Jetpack already said `sitemaps=true`; investigate routing/caching before manually toggling modules or writing XML files.
3. Connect Search Console property through a verified Google tool or previously suggested GSC Wizard; inspect Home + #55/#52/#31 and, **only once actual sitemap XML works**, submit the site map if authorized.
4. Upload prepared branded OG images, attach appropriate Media IDs; test how the #55 iframe page renders when a Featured Image is assigned, avoiding unwanted hero duplication.
5. Finish Trust Drafts only with owner-approved Contact/Privacy facts and separate publication approval.
6. Maintain Search Visibility public as owner-directed; any reversion needs a clear release decision and after-state proof.

**Verdict:** **SEO-02 PUBLIC VISIBILITY PASS**, **AEO-01 #55 NATIVE CONTENT PASS**, **SITEMAP XML HOLD**, **OG IMAGE INSTALLATION HOLD**, **SEARCH CONSOLE INDEXING UNKNOWN**. No guaranteed Google ranking. **UNKNOWN ≠ PASS**.
