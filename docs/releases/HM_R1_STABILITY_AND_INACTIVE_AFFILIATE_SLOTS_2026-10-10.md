# HYBRID MIND — R1 Stability QA + Inactive Affiliate Ad Slot Reservations

**Date:** 2026-10-10 (Asia/Bangkok)  
**Production:** https://hybridmind.online · WordPress.com Atomic site ID `257844857`  
**Owner instruction:** “เราไม่มีสินค้านะเราใช้ลิงก์ affiliate ตามจุดที่เป็นพื้นที่โฆษณา” followed by “ทำเลย” to proceed with R1 stability and prepare site-compatible advertising positions.  
**Operational model:** Editorial AI publisher, **no products of its own**, affiliate only within clearly marked advertising spaces. **UNKNOWN ≠ PASS.**

## Deliverables completed

### 1. R1 preflight and responsive local regression

- Live Production status initially `launched / discourage_search`.
- WordPress Homepage Page #16 was Published V3, modified `2026-10-09T22:08:28`, 54,342 raw chars and one core/html block. Shared Single Post Template `assembler//single` was V3.3 custom, 14,295 raw chars.
- Published posts exactly **#55, #52, #31**. Draft #57 remained Draft. Hybrid Mind Typhoon Chat v0.2.2 remained **inactive**.
- Ran **Chromium Playwright on two already existing local WordPress-like HTML fixtures** at CSS viewport widths 320, 375, 390, 768, 1280 and 1440: 12/12 basic cases PASS for no horizontal document overflow / no JS page errors.
- At 390px, Homepage fixture article filters exercised (selecting Buying showed 1 story); V3.3 article fixture generated 8 TOC anchors, opened TOC, Escape closed it and reading progress reached 100.
- **Limits:** These were *local fixtures*, not direct Chromium screenshot tests against the public Production domain. Container DNS cannot resolve `hybridmind.online`; the connected WordPress rendered-HTML reader has no selectable device viewport or full browser interactions. **Actual Production mobile pixel/computed-style QA = UNKNOWN**.
- Jetpack Backup reported active, **latest known successful full backup Oct 8 2026 18:15:15**, `restore_preflight_status=null`. **Fresh whole-site backup and restore rehearsal UNKNOWN**. Exact HTML-only logical rollback backups were created first.

### 2. Exact source backups before the production changes

- [Homepage Page #16 exact pre-ad-slot HTML](../backups/WORDPRESS_HOME_16_PRE_AFF_SLOTS_2026-10-10.html), 54,342 chars, GitHub blob SHA `9d295ca2da54d53d411a2e6f809b04b3ee559502`, verified against live CMS.
- [Single Post Template exact pre-ad-slot HTML](../backups/WORDPRESS_SINGLE_TEMPLATE_PRE_AFF_SLOTS_2026-10-10.html), 14,295 chars, GitHub blob SHA `eabe58a4f4f6e4c1b6b3d436b4b0fa4ae56ac811`, verified against live CMS.
- These enable **logical content/template rollback**, not a tested full WordPress DB/media/plugin disaster restore.

### 3. Inactive Ad Slot Reservation component, no campaigns or outbound links

Saved shared [one Gutenberg HTML block](../design/HM_AFFILIATE_RESERVATIONS_V1_GUTENBERG_BLOCK_2026-10-10.html), 3,366 chars (GitHub blob SHA `d67441f219592ace4aa833427552a8d834fab557`).

This component runs on Homepage and standard article pages, creates safe inert `<aside>` elements only for declared places, with `hidden=true`, `aria-hidden=true`, `data-hm-aff-enabled=false`, `data-hm-aff-state=reserved`. No `href`, merchants, products, tracking pixels, input collection, LLM API, `fetch`, `localStorage` or external scripts. Reserved placeholders carry labels for a **future** explicitly approved campaign but are not visible to visitors. CSS includes responsive single-column layout for eventually active creative, without creating duplicate mobile placements.

| Stable slot ID | Host | Position | Current state |
| --- | --- | --- | --- |
| `home_after_feature` | Homepage #16 | after V3 Hero | reserved / hidden |
| `home_in_feed` | Homepage #16 | after featured article group in Reading Room | reserved / hidden |
| `article_after_intro` | Standard article #31 / #52 | after up to third direct paragraph | reserved / hidden |
| `article_near_end` | Standard article #31 / #52 | end of article content | reserved / hidden |

`mobile_in_feed` uses the same `home_in_feed` responsive slot; no duplicate mobile ad request. **Post #55** is an immersive Visual Learning iframe, so the component **deliberately reserves zero slots** there; **Post #57** remains Draft and is excluded as well.

### 4. WordPress staging, installation and rollback

- Created temporary WordPress **Draft Page #84** with the exact ad block and `jetpack_seo_noindex=true`. Edit readback byte-exact and REST rendered HTML preserved CSS/JS. After verification, moved staging Page #84 into **recoverable Trash**. It was never published.
- **Homepage Page #16:** used `page-sections.insert` at index 1 (append after existing V3 `core/html`) with `expected_modified` and `expected_content_hash` tokens. Successful modified timestamp `2026-10-10T00:17:24`. Independent readback: 2 blocks; original V3 block SHA-1 `3f087997d00f792cf12b13fe4c082fe7140b6631` **unchanged**; new reserved slot block present verbatim; Published unchanged. New 57,708 raw chars.
- **Article template:** preserved every original 14,295-char V3.3 byte unchanged, inserting only an additional shared `core/html` block immediately after the existing `core/post-content` block. [Installed template candidate](../design/HM_SINGLE_TEMPLATE_WITH_INACTIVE_AD_SLOTS_2026-10-10.html), 17,663 chars, GitHub blob SHA `f0913a54e2e6fc0d123899d441b92c9e8a9586f5`. WordPress `templates.update(id=assembler//single)` write and independent readback both exact. Original V3.3 CSS/JS and comments structure preserved.
- Rollback: **Home** remove the new index-1 block by optimistic-guarded `page-sections.remove` or restore exact pre-change Page #16 HTML; **Single template** restore exact 14,295-char pre-change source or remove the ad block with a carefully reviewed template update. Verify before/after. Owner approval required for rollback unless an emergency recovery from failure.
- NO changes to post bodies, WP theme activation, Global Styles, site launch/visibility, Typhoon, Draft #57 or menu navigation.

### 5. Anonymous Production HTML post-install verification

The connected WordPress HTML viewer inspected the public URLs using cache-busting query strings after installation:

| Public page | Slot IDs actually found in DOM after JS | Hidden / disabled? | Original UI |
| --- | --- | --- | --- |
| Homepage Page #16 | `home_after_feature`, `home_in_feed` | both hidden, enabled false | V3 retained, one H1 |
| Published GS20 #31 | `article_after_intro`, `article_near_end` | both hidden, enabled false | V3.3 retained, one H1 |
| Published AI-game #52 | `article_after_intro`, `article_near_end` | both hidden, enabled false | V3.3 retained, one H1 |
| Published AI ERA #55 | **no slots** | N/A | Visual iframe present and unchanged |

- All four anonymous pages returned non-truncated live HTML with the ad reservation JS/CSS block present.
- No ad destination URL or enabled ad appears in this component.
- After final WordPress readback: Home #16 still Published, first V3 Gutenberg block unchanged; Single Template exact candidate; Published IDs #55/#52/#31; #57 Draft with media #63; Typhoon v0.2.2 inactive; Site `launched / discourage_search`.
- **SEO indexing ambiguity persists:** anonymous HTML returned `<meta name="robots" content="max-image-preview:large">`, despite WordPress `blog_public=0` and `discourage_search`. Therefore not certified as `noindex`.

## What is NOT launched or verified

- **No affiliate campaign activated** (0 active slots, 0 affiliate links, no tracking, no commission).
- There is no ad dashboard, network approval, campaign scheduler, creative uploader or click metrics yet. The JavaScript-only reservations are V1 placement scaffolding; central management is future R6.
- Public privacy/contact/editorial disclosures and SEO signoff remain open; **do not assume a third-party platform has approved monetization**.
- Before activating any slot, request an **actual approved affiliate URL**, merchant/campaign metadata, licensed creative and visible near-link disclosure. Validate HTTPS URL and use `rel="sponsored noopener noreferrer"` for any `target="_blank"` link. Never insert product listings, shopping cart, payment or order components.
- Real Android Production screenshots, viewport overflow measurements and manual click checks still **UNKNOWN**.
- Fresh full-site restore test and clear privacy/cookie treatment remain **UNKNOWN**.

## Release classification

**R1 local smoke PASS (12/12); Production DOM/ad reservation source PASS; actual Mobile Browser & Full Backup gate HOLD/UNKNOWN. Affiliate slots RESERVATIONS INSTALLED, all hidden and disabled.** Website remains live and Content-only.

**UNKNOWN ≠ PASS.**
