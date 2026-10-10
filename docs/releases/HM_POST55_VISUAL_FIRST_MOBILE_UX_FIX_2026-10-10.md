# HYBRID MIND — AI ERA #55 Visual-First Mobile UX Fix

**Date:** 2026-10-10 (Asia/Bangkok)  
**Production URL:** https://hybridmind.online/2026/10/09/ai-era-2026-agent-tools-a2a/  
**User trigger:** Supplied 20:08 Android screen screenshot showing a huge dense black AEO information card covering almost the entire first screen, hiding the attractive Visual Interactive lesson below; commented “ข้างบนมันไม่สวยเลย” twice.  
**Design goal:** The Visual Interactive lesson must be the FIRST meaningful content. Keep important answer-ready Thai editorial text indexable but place it AFTER the lesson, styled for mobile readability rather than serving as a full-height black intro.  
**Policy:** UNKNOWN ≠ PASS. No new post publication, no inventory/shop features, no AI chat activation.

## What changed on the LIVE WordPress Post #55

1. **Saved full pre-change exact Gutenberg body:** [SEO Post55 pre Mobile Visual-first backup](../backups/AEO_01_POST55_PRE_MOBILE_VISUAL_FIRST_2026-10-10.html) — 55,462 bytes/chars, GitHub blob `dcdcf98854cc267bda67f0923a598415983598cb`. Before: Post Published, featured image Media #105, `modified=2026-10-10T02:48:37`; three top-level blocks:
   - index 0 `core/html`: `hm-seo04-social-only-image` (hides featured media hero only on #55), hash `bc12466f6909af110becbd9febb66874eda1914b`;
   - index 1 `core/group`: large black native AEO article, hash `651f5102f3a551174d9260fa9ccd4090f20ce0a1`;
   - index 2 `core/html`: original immersive Visual iframe `hm-a2a-lesson-iframe`, hash `35fffee971d301017a4ad5d8b3d6a8e96c33854d`.
2. **Moved AEO group to after the original iframe**, via one optimistic `post-sections.move(index=1,to_index=2)`. WordPress returned modified `2026-10-10T20:12:37`, status still Published, Media #105 unchanged. **All three original block hashes were preserved in the new order `[OG-only style, Visual iframe, AEO native group]`**. This alone removes the huge black text block from the first mobile screen without removing any AEO copy.
3. **Added a strictly scoped mobile-friendly reading style** via `post-sections.insert(index=1)` containing a new `core/html` style block `hm55-visual-first-reader-css` ([source](../design/HM_POST55_VISUAL_FIRST_MOBILE_READER_CSS_2026-10-10.html), 4,095 chars, blob `f96859e7bffd028cf24e16391291f90e4da2f480`). This targets ONLY `body.single-post.postid-55`:
   - Removes residual top blank whitespace from the hidden post-title wrapper while retaining semantic post H1 in DOM.
   - Preserves original immersive Visual iframe full-width rendering.
   - Converts the *AFTER-lesson* AEO native group from dark/compact to a soft white-to-mint paper card with structured H2/H3 typography, generous spacing, contrasting accessible link styles, and 16 px mobile paragraph text at line-height 1.9.
   - CSS includes `@media(max-width:600px)` guard, mobile narrower card/padding/fonts; **no global theme or other post CSS changed**.
   - After insertion `modified=2026-10-10T20:15:31`; all original three Gutenberg block hashes independently confirmed unchanged at indices 0, 2 and 3.
4. **Editorial wording improvement only within AEO group:** `post-sections.replace(index=3)` changed exactly two strings without changing the remaining serialized Gutenberg markup:
   - Kicker `HYBRID MIND · AI ERA 2026 · สรุปเนื้อหาสำหรับผู้อ่านและ Search Engine` → **`AI ERA 2026 · อ่านเพิ่มเติมหลังบทเรียน`** (avoids a developer-facing “Search Engine” phrase in reader-facing content).
   - Old link `เปิดบทเรียน Visual Interactive และแบบทดสอบด้านล่าง ↓` → **`กลับไปดูบทเรียน Visual Interactive และแบบทดสอบด้านบน ↑`** to match the new order.
   - Source snapshot: [reader-friendly AEO summary](../design/AEO_01_POST55_READER_FRIENDLY_SUMMARY_2026-10-10.html); native content, all headings and external primary-doc source links otherwise retained. Final WordPress modified **`2026-10-10T20:17:02`**.
   - Original immersive iframe block hash `35fffee971d301017a4ad5d8b3d6a8e96c33854d` and existing Media #105 **still untouched**.

## Independent public HTML QA after production writes

Queried connected public HTML reader with a cache-busting URL on #55, Home Page #16 and Article #52:

| Check | Outcome |
| --- | --- |
| #55 Visual iframe in public body BEFORE AEO group | **PASS**: iframe marker offset ~22,568, native group ~68,331 in rendered HTML |
| #55 scoped mobile style emitted | **PASS** `<style id="hm55-visual-first-reader-css">...` with white-to-mint background + mobile font rules |
| Native group still present and indexable as normal HTML | **PASS** |
| Updated bottom-reader kicker + “กลับไปดูบทเรียนด้านบน ↑” link | **PASS** |
| MCP / A2A official source links retained | **PASS** |
| Featured Media #105 and Open Graph #55 | **PASS** public `og:image` still maps to #105 |
| Old OG-only CSS hide featured-image hero | **PASS** still emitted |
| Homepage V3 and Home Media #104 isolated | **PASS**; new scoped CSS not present in Homepage |
| Game Article #52 OG media and body isolated | **PASS**; new scoped CSS not present in #52 |
| Browser screenshot / actual Samsung viewport visual computation | **UNKNOWN**: public DOM and style were verified, but direct real mobile screenshot after change not available yet |
| Google indexing / sitemap availability | **Not part of UX change**, status previously separate: Sitemap XML HOLD, Google Search Console UNKNOWN |

The thin **WordPress Admin toolbar** visible in the owner's screenshot is a logged-in editor overlay, not normally shown to anonymous readers. This round fixes the actual large native AEO information card that consumed the first screen, not the editor toolbar.

## Exact rollback

1. Prefer WordPress WordPress Revisions, or restore the entire pre-change serialized content from [backup](../backups/AEO_01_POST55_PRE_MOBILE_VISUAL_FIRST_2026-10-10.html) after full optimistic conflict check. A full rewrite should be a last resort as it may overwrite later editorial changes.
2. Safer **scoped reverse edits**, if there are no subsequent changes:
   - Remove the reader-only style block `hm55-visual-first-reader-css` via optimistic `post-sections.remove` with exact `core/html` hash.
   - Restore the original AEO group from [original source](../design/AEO_01_POST_55_NATIVE_SUMMARY_BLOCK_2026-10-10.html) via `post-sections.replace`.
   - Move original AEO group from after the Visual iframe back to index 1 via `post-sections.move` (only if user requests restoring the unattractive prior order). All original blocks remain present.
3. Verify Featured Media #105, Blog Post #55 Published and all other posts unaffected.

**Verdict:** VISUAL FIRST PAGE STRUCTURE **PASS**; MOBILE READABILITY CSS PRESENT **PASS DOM**; ACTUAL DEVICE APPEARANCE **NEEDS OWNER VIEW**; Visual iframe unchanged; no homepage/theme/global changes. **UNKNOWN ≠ PASS.**
