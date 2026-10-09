# HYBRID MIND — SEO-01.A Indexing / Sitemap Root-Cause Diagnostics

**Date:** 2026-10-10, Asia/Bangkok  
**Production:** https://hybridmind.online · WordPress.com Atomic Site ID `257844857`  
**Owner instruction:** “ทำเลย” after SEO-01 Audit. This round is **read-only troubleshooting and preparing an actionable recovery probe**, NOT a request to make the site indexable or submit URLs to Google.  
**Rule:** UNKNOWN ≠ PASS.

## Result / release classification

**SEO-01.A investigation complete to the limit of connected site tools. P0 root-cause remains unresolved because WordPress.com site-level status and on-site WordPress REST disagree. No production settings or published content changed.**

### Authoritative observations (read only)

| Source | Value seen | Evidence interpretation |
|---|---|---|
| WordPress.com `settings.get` for site 257844857 | `privacy.blog_public = 0` | Site service says index discouragement configured |
| WordPress.com `manage-site.status` | `launch_status=launched`, `visibility=discourage_search` | Site visible to readers; WordPress.com visibility discourages search indexing |
| WordPress.com Jetpack Activity Log, **2026-10-09 20:40:43 ICT** | `blog_public` changed `0 → 1` | Recorded during public launch |
| WordPress.com Jetpack Activity Log, **2026-10-09 20:42:02 ICT** | `blog_public` changed `1 → 0` | Later setting rollback; most recent `blog_public` event in inspected setting activity |
| Authenticated WordPress core REST `GET /wp/v2/settings` | **`blog_public = 1`** | On-site API disagrees with site service, repeated twice with separate cache-busting query values |
| WordPress core REST `url`, `title` | `https://hybridmind.online`, `HYBRID MIND` | This is the same apparent site, not an intentionally different WordPress installation |
| Jetpack REST `GET /jetpack/v4/settings` | `sitemaps=true`, `seo-tools=true` | Module configured on, **not proof XML files are served** |
| Anonymous public Homepage HTML | `<meta name="robots" content="max-image-preview:large">` | No HTML `noindex` meta observed |
| Anonymous `/robots.txt` | `Disallow: /wp-admin/`; declares Sitemap paths | Does not ban all public article crawling at robots.txt rule level |
| Connected rendered-HTML viewer `/sitemap.xml` | WordPress **“ไม่พบหน้า”** HTML, not XML | Sitemap retrieval **FAIL in this viewer** |
| Viewer `/news-sitemap.xml`, `/wp-sitemap.xml`, `/sitemap_index.xml` | Same not-found HTML | Other candidate routes don't supply XML via this connection either |
| Google PageSpeed Insights / Lighthouse via WPVibe, Homepage mobile SEO | **100/100**, no SEO category issues flagged | Shallow Lighthouse result only; **does not prove Google indexing, sitemap health or real crawler permission** |
| Jetpack Backup status | Active; last known successful **2026-10-08 18:15:15**; restore preflight null | Whole-site fresh-backup and restore readiness **UNKNOWN**, not a recovery gate PASS |

**Interpretation:** Two *different* evidence clusters align internally:
- WordPress.com Site Status / Activity Log / Site Settings say discouragement is enabled (`0`).
- WordPress on-site core REST says `1`; the HTML robots meta is also consistent with a publicly indexable runtime. WordPress core normally adds `noindex` when its effective `blog_public` option is 0 (see the official `wp_robots_noindex()` source below).

This is **evidence of a synchronization/caching/option-propagation discrepancy as a plausible hypothesis**, **NOT a proven diagnosis**. WordPress filters, caches and the different platform service APIs could affect what the two connections report. Do not force the option to either value merely to make APIs agree.

**Sitemap-specific interpretation:** WordPress.com says XML Sitemaps are automatically exposed when the site is public and *Discourage search engines* is not enabled. The current WordPress.com `discourage_search` status makes suppressed sitemap routing a **plausible explanation** for the missing XML even though Jetpack's sitemap setting is true. This is **not confirmed until the effective setting and actual HTTP status/headers are checked**.

## Limits / blocked direct verification

- Direct container `curl -I` requests to `https://hybridmind.online` failed with `curl: (6) Could not resolve host` in this execution environment. The separate web page reader also could not open the domain directly. **This is a limitation of these diagnostic environments; the site's anonymous WordPress-connected rendered-HTML reader still retrieved live site HTML. It is NOT a claim that the site is offline.**
- The connected HTML reader returns HTML DOM/source, **not** raw HTTP status, redirects, Content-Type or `X-Robots-Tag`. Therefore an actual `200`/ `404` header diagnosis for the Sitemap and main content URLs remains **UNKNOWN**, not inferred from the “ไม่พบหน้า” page title alone.
- The optional WPVibe server plugin is **not installed** (`wpvibe_connect_plugin=false`). A read-only attempt `run_wp_cli("option get blog_public")` failed with a 404 plugin route. No PHP/DB query, theme edit, WP setting write or plugin installation was attempted; do not retry plugin-only tools until it is installed and explicitly approved.
- No confirmed connected Google Search Console property / URL Inspection output was available. **Ranking, real Googlebot HTTP behavior, indexing/citation appearance and `X-Robots-Tag` remain UNKNOWN**.

## Reproducible read-only probe prepared

[PowerShell probe for Windows/VPS — public headers & sitemap XML](../../scripts/seo/inspect-public-headers.ps1)

On a Windows VPS with working DNS/HTTPS, from the cloned repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\seo\inspect-public-headers.ps1
```

This **only** issues anonymous HTTP GET requests and returns JSON rows with requested/final URL, HTTP status, Content-Type, `X-Robots-Tag`, HTML meta robots, and XML Sitemap detection for Home, Posts #55/#52/#31, `robots.txt`, `sitemap.xml`, `news-sitemap.xml`, `wp-sitemap.xml`. No external execution occurred during this audit. Running the script will require the user's machine or a separate permitted network-capable runner.

Use Google Search Console's URL Inspection for Googlebot's *actual* indexed/crawled view; independent browser headers cannot prove search indexing.

## Root-cause hypotheses / experiments in recommended order

1. **P0 — Confirm owner intent and Settings → Reading**: Is public-for-readers-but-discouraged intentional, or should the site now be openly eligible for Google/Bing/ChatGPT Search discovery? WordPress.com dashboard setting must be inspected manually/through a connected browser to reconcile the reported site-level `blog_public=0`.
2. **P0 — Independent HTTP verification**: Run the read-only networked probe for actual response codes, header `X-Robots-Tag`, redirections and XML content type with cache-busting plus a normal browser User-Agent. A Googlebot/OAI-SearchBot response could additionally be compared from appropriate crawler diagnostics, but spoofing a user agent does not establish real crawler identity or WAF acceptance.
3. **P0 — Confirm effective stored option**: Site-level WP.com Activity proves latest recorded `1→0`; WordPress REST `blog_public=1` persists. An authorized WP-admin Settings view or read-only WP-CLI option get on the **same Atomic installation** would clarify the underlying WordPress option versus WordPress.com service state. The current connected tools cannot run WP-CLI because the optional plugin is absent.
4. **P0 — Restore XML Sitemap**: Only after indexability policy is owner-approved and source signals align, inspect Jetpack → Traffic / Sitemap UI, check `/sitemap.xml` directly as actual XML with `200`, validate it includes intended Published Pages/Posts and no Draft #57 or #67–#70, then submit via Google Search Console if desired. `news-sitemap.xml` may legitimately be empty or transient because it is restricted to recent eligible news; it is not the primary site sitemap.
5. **P1 — Measurement & aftercare**: Search Console URL Inspection for Home, #55/#52/#31, Search Console Page Indexing and Sitemap reports, check OpenAI OAI-SearchBot crawl access at hosting/WAF level, and repeat metadata/OG/AEO after indexable release.

## Controlled future change, NOT EXECUTED

**If the owner explicitly authorizes normal public Search Indexing**, the next agent may prepare a *single* carefully bounded setting change to disable “Discourage search engines” for this existing launched website — only after verifying the actual current WordPress setting and the mismatch source, recording raw before values and backup/rollback path, and ensuring the site is otherwise ready for public discovery. After changing, check both site APIs, actual response headers and `/sitemap.xml`. **If data sources still disagree, stop; do not repeatedly toggle or use blind write retries.** Never create replacement sitemap files that fight Jetpack routing.

No publishing of #57, #67–#70, no Typhoon activation, no ad campaign, and no edits to published post bodies in SEO-01.A.

## Public documentation

- WordPress.com Site Visibility: https://wordpress.com/support/privacy-settings/make-your-website-public/
- WordPress.com Sitemaps (last reviewed Oct 5, 2026): https://wordpress.com/support/sitemaps/
- WordPress.com sitemap privacy troubleshooting: https://wordpress.com/blog/2025/04/08/wordpress-sitemap/
- WordPress Core `wp_robots_noindex` checks `get_option('blog_public')`: https://developer.wordpress.org/reference/functions/wp_robots_noindex/
- Google `noindex` meta + `X-Robots-Tag`: https://developers.google.com/search/docs/crawling-indexing/block-indexing

## Release gate

| Gate | Result |
| --- | --- |
| WordPress.com last visibility option/activity | **PASS observation**: changed back to 0 and reports discourage_search |
| On-site WP REST settings | **PASS observation**: still 1, conflicts with above |
| Actual effective indexing state | **CONFLICT / UNKNOWN — P0 HOLD** |
| Jetpack sitemap setting | **PASS observation** enabled |
| Sitemaps visible as XML using current reader | **FAIL — P0** |
| Actual sitemap HTTP codes / X-Robots-Tag | **UNKNOWN — requires direct networked probe** |
| Lighthouse mobile SEO basic category | **PASS 100/100 (shallow only)** |
| Google Search Console URL Inspection | **UNKNOWN — not connected** |
| Production write safety | **PASS: 0 WordPress writes** |

**Verdict: SEO-01.A DIAGNOSTIC PASS; INDEXING/SITEMAP REMEDIATION ON HOLD pending factual reconciliation and explicit owner authorization. UNKNOWN ≠ PASS.**
