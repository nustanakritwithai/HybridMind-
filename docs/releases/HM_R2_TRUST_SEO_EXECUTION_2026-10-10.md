# HYBRID MIND — R2 Trust, Editorial & SEO Execution

**Date:** 2026-10-10 (Asia/Bangkok)
**Site:** https://hybridmind.online · WordPress.com Atomic Site ID `257844857`
**Owner directive:** “ทำต่อเลย” after R1 Affiliate Ad Slot reservation deployment and the proposed next phase “R2 — Trust & SEO”.
**Mode:** controlled drafts + minimal homepage SEO metadata update. Do **not** publish Trust Pages or toggle Search Indexing without separate explicit authorization.
**Highest rule:** UNKNOWN != PASS.

## 1. Preflight snapshot

- Site status `launched / discourage_search`, WordPress site `blog_public=0`.
- Published posts exactly `#55` AI ERA Visual Interactive, `#52` AI game tooling, `#31` GS20; no active affiliate links.
- Homepage **Page #16** is Published V3 plus dormant/hidden Affiliate Ad Slots. Single Post Template is V3.3, previously verified.
- Typhoon Chat plugin **v0.2.2 inactive** (readback before draft edits).
- Draft trust pages: **Contact #67**, **Privacy #68**, **Editorial #69**, **Affiliate #70**; all unapproved for publication. No authorized public contact method or verified controller contact supplied.
- Jetpack Backup system active; last successful *known* backup still **2026-10-08 18:15:15**; Restore Preflight `null`. A full-site recovery test remains **UNKNOWN**.

## 2. Draft content corrections — 8 guarded Gutenberg section replacements

Each WordPress write used the `page-sections.replace` API with optimistic concurrency (`expected_modified`, `expected_content_hash`, `expected_block_hash`, `expected_block_type`) against freshly read `pages.get(context=edit)` / `page-sections.list`. Independent post-write `pages.get` verified the expected section changed, all unrelated Gutenberg top-level blocks were preserved, and status remained `draft`. WordPress revisions provide version-history rollback; none of these pages was published.

| Page | Scope | Latest modified | Outcome |
| --- | --- | --- | --- |
| **#70 Affiliate Disclosure** | 2 blocks: identify HYBRID MIND as a media publisher with **no products/inventory or merchant checkout**; ad-only outbound affiliate links, destinations owned by external sellers; dormant ad slots currently contain **no active campaigns**; on activation show nearby Affiliate labeling | `2026-10-10T00:35:22` | PASS, Draft |
| **#68 Privacy Policy** | 3 blocks: update draft review date to Oct 10, acknowledge **Typhoon Chat is inactive** and not sending public guest prompts, disclose that hidden affiliate slot reservations currently carry no active click-tracking links, retain explicit host/Jetpack/Akismet retention and legal review UNKNOWN | `2026-10-10T00:37:10` | PASS, Draft |
| **#69 Editorial Policy** | 2 blocks: distinguish product editorials from affiliate advertising and clarify HYBRID MIND sells no inventory, plus note Typhoon disabled pending privacy/cost review | `2026-10-10T00:38:36` | PASS, Draft |
| **#67 Contact** | 1 block: change collaboration topic to **media partnerships and affiliate advertising space**, not products for sale | `2026-10-10T00:40:44` | PASS, Draft |

**Critical hard gate:** Contact #67 still lacks owner-authorized public Facebook Page URL / business email. Privacy #68 still lacks verified data controller contact details, data-processing legal bases, factual retention periods, hosting/provider processing facts and review of cookies/transfers. PDPA Privacy Notice readiness remains **HOLD**. Never invent public contact details or assert legal compliance from a partial draft. Thai PDPA Section 23 expects, among other details, controller/contact information and relevant collection/retention/rights information; see https://www.mdes.go.th/law/detail/6046-แนวทางการดำเนินการในการแจ้งวัตถุประสงค์-และรายละเอียดในการเก็บรวบรวมข้อมูลส่วนบุคคลจากเจ้าของข้อมูลส่วนบุคคล-ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล-พ-ศ--๒๕๖๒ and https://pdpa.dmh.go.th/news/files/pdpa.pdf.

**Trust Publication Gate:** **NO PUBLICATION EXECUTED** for #67/#68/#69/#70. The editor-note and final owner/legal approval requirement remains intact.

## 3. Homepage SEO metadata: fixed live stale prototype description

WordPress Page #16 Published before this operation: `modified=2026-10-10T00:17:24`; 57,708 chars raw Gutenberg V3+hidden Affiliate placements; excerpt `หน้าหลักต้นแบบ Hybrid Mind — AI News, Explained, Future Lifestyle และ Smart Buying Guides`; Jetpack custom SEO description empty; `jetpack_seo_noindex=false`.

**Controlled `pages.update` only of `excerpt.raw` and `meta.advanced_seo_description`**, both set to:

> HYBRID MIND สื่อ AI และเทคโนโลยีภาษาไทย อ่านข่าว บทวิเคราะห์ และบทเรียน Visual Interactive เข้าใจเทคโนโลยีใหม่และนำไปใช้ในชีวิตจริง

After independent WordPress readback: `publish`, `modified=2026-10-10T00:39:58`; **exact raw Gutenberg body unchanged** (57,708 chars), excerpt and SEO description exact new copy, noindex flag unchanged. Actual anonymous Homepage HTML with cache-busting URL showed the new meta description and `og:description` (old “ต้นแบบ” no longer appears in the meta description). **PASS**.

## 4. Current technical SEO inventory (READ ONLY)

Inspected connected site-rendered anonymous HTML on Homepage and all three Published posts:

| SEO item | Evidence | Outcome |
| --- | --- | --- |
| Public homepage HTTPS and canonical | `https://hybridmind.online/`; canonical present | PASS |
| Canonical on #31/#52/#55 | All match corresponding Published permalink | PASS |
| Homepage meta description | Corrected on Oct 10, rendered and `og:description` updated | PASS |
| Post title and descriptions | #31/#52/#55 present, descriptive | PASS baseline |
| Article H1 | #31/#52 each one; #55 outer template title + **separate iframe document** includes own H1; separate browsing contexts, not an automatic duplicate same-document fault | PASS structural |
| Homepage + #55 Open Graph image | Both use WordPress placeholder `https://s0.wp.com/i/blank.jpg`, 200×200; no actual branded media asset selected for OG | **FAIL quality / HOLD** |
| #31/#52 OG images | WordPress Featured Images #26/#51 supplied and associated | PASS metadata |
| Brand icon/site logo | WP settings `site_icon=0`, `site_logo=0` | TODO |
| AI News category in old nav/footer | Category has zero Published posts but nav links exist; owner editorial decision still required | FAIL content/navigation relevance |
| WordPress search configuration | `launched / discourage_search`, `blog_public=0` | PASS configured; not proof of crawler behavior |
| Public robots meta | `<meta name="robots" content="max-image-preview:large">` without `noindex` | **UNKNOWN actual anti-indexing** |
| Anonymous `/robots.txt` | Lists `/sitemap.xml`, `/news-sitemap.xml`; `Disallow: /wp-admin/` only, not a blanket crawl prohibition | PASS route reachable / index-prevention claims UNKNOWN |
| Anonymous sitemap URLs | `/sitemap.xml`, `/news-sitemap.xml`, `/wp-sitemap.xml`, `/sitemap_index.xml` returned **WordPress “ไม่พบหน้า” not-found HTML** in connected page reader instead of XML. Raw HTTP status was not provided by the reader | **HOLD / investigate** |
| Search Console and ranking | No verified connected Search Console property or indexing evidence | UNKNOWN |
| Real production Mobile Core Web Vitals/Lighthouse | Not measured | UNKNOWN |

Do not activate `blog_public=1` or submit sitemap to Google without owner approval. WordPress.com documentation notes that indexable public visibility is required to expose the sitemap normally and advises unchecking “Discourage search engines”. The current absence of sitemap may therefore be a consequence of deliberate `discourage_search` configuration; **do not present this as a confirmed plugin defect**. https://wordpress.com/support/sitemaps/ ; https://wordpress.com/support/privacy-settings/make-your-website-public/

Google's rule `noindex` normally needs an actual robots meta directive or `X-Robots-Tag` header that a crawler can see, and `robots.txt` alone does not support the noindex directive. External response headers have not been audited, so actual Google indexing/prevention state **UNKNOWN**, not definitively safe or unsafe. https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=th

## 5. Affiliate advertising disclosure and no-commerce contract

- HYBRID MIND is **not an online store**. It has no products, stock, checkout, cart, fulfillment or order service.
- Dormant Ad Slot placeholders on Homepage V3 and standard Articles V3.3 remain **disabled/hidden**. No affiliate destinations or click tracking activated in this round.
- When an approved Affiliate link is eventually activated, disclose commercial nature in proximity, validate external HTTPS destination and apply `rel="sponsored"`, plus `noopener noreferrer` for new tabs. This follows https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=th
- Do not assume platform approval, commissions, seller relationships or prices from editorial product mentions.

## 6. Release classification and specific next actions

| Gate | Status |
| --- | --- |
| #67/#68/#69/#70 editorial draft accuracy | PASS in corrected blocks; PUBLISH HOLD |
| Homepage metadata prototype wording removed | PASS live |
| Trust / Privacy actual public contact | BLOCKED (owner-approved channel required) |
| Verified data retention, privacy processing, cookie audit | UNKNOWN |
| Affiliate advertising transparency framework | PASS at draft/architecture level; no active campaign |
| Canonical/title/description basic technical SEO | PARTIAL PASS |
| Homepage & #55 branded OG images | FAIL quality / needs assets |
| Sitemap / indexing / WordPress Privacy configuration | HOLD for owner search visibility decision |
| Site Full Backup/Restore test | UNKNOWN |
| Public Launch status | Website remains LIVE content-only; no changes to launch state |

**No Trust draft published. No Typhoon activation. No Affiliate campaign activated. No WordPress Theme/Header/Footer/Navigation/Post bodies changed. No Search Indexing toggle.**

**Next:** obtain one owner-approved public business contact channel, verify factual privacy/retention facts and launch a controlled Content Trust Page publication with owner approval; then choose whether to move from `discourage_search` to full public indexing, resolve sitemap and OG images, and do a genuine browser/Lighthouse check. **UNKNOWN ≠ PASS**.
