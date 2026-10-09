# HYBRID MIND — Post #57 Cover-Only Layout / White-Panel Removal QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online — WordPress.com Atomic ID 257844857  
**Article:** WordPress post #57, `TH-AI Passport 2.0 — จาก AI Chatbot สู่ AI Agent | Visual Interactive`  
**Permalink:** https://hybridmind.online/?p=57&preview=true (owner login required)  
**Gate:** UNKNOWN ≠ PASS.

## User request

Android screenshot showed a large **white WordPress title area**, significant top and bottom whitespace, and a centered cover before the dark Visual Interactive content. User asked for the **white section to show only the cover image with no extra title text**.

## Diagnosis — grounded in template

Theme `assembler//single` uses:

- a `<main class="wp-block-group">` containing a top `wp-block-spacer`;
- a constrained 800px group with `core/post-title` and `core/post-featured-image` (theme block attribute `aspectRatio=4/3`, `align=wide`);
- `core/post-content` with its own top padding.

WordPress Post #57's cover is Media **#63**, AI-generated PNG **1672 × 941** with text inside the image. Post body includes the complete dark iframe and interactive calculator/quiz. Original source Post #55 and other posts must not be changed.

## Safe change

**Only WordPress Global Styles custom CSS was changed, scoped to `body.single-post.postid-57`.** No theme template changes, no WordPress title change, no post content replacement, no new plugin or media, and no status change.

Prior Global Styles ID 2 **5,496-character** CSS was saved BEFORE write in:

[Exact Prechange CSS Backup](POST57_COVER_ONLY_PRECHANGE_CSS_2026-10-09.md), commit `46fe94670e6ff305d7ba10653fe5c6be3e90a762`.

Backup was re-read and matched the live WordPress CSS exactly before mutation. Appended **2,186** characters in one new section:

`/* Hybrid Mind R2-POST57-COVER-ONLY */`

Scoped changes:

1. Remove the main template's first spacer, eliminate top padding/margins of the cover section.
2. Make the title **visually hidden** using an accessible 1px clipped element; the semantic post title remains in the DOM, supporting screen readers and SEO without consuming visual space.
3. Override the cover container's constrained width with viewport-width centered positioning and no gutters.
4. Preserve the **full cover without cropping** using `aspect-ratio:auto`, `object-fit:contain`, `width:100%`, `height:auto`.
5. Set only Post #57 main background to the existing Visual Interactive navy `#071121`, removing the white gap between the featured image and embedded article. Preserve the block's internal visual appearance and maintain readable source-paragraph/link colors.
6. Use `overflow-x:clip` on this post to prevent full-bleed layout from adding sideways page scroll.

**Existing CSS for Post #52, Typhoon chat, homepage, theme, and plugin code remains untouched.**

## Independent post-write readback

| Test | Status | Evidence |
| --- | --- | --- |
| New CSS stored in WordPress Global Styles ID 2 | PASS | Independent WordPress `global-styles.get` |
| CSS grew from 5,496 to 7,682 chars | PASS | WordPress readback |
| Exact backup CSS remains prefix, with 2,186 new chars appended | PASS | Readback compared to backup |
| Rule is scoped to Post #57, no other Post #52 selectors in patch | PASS | Source code comparison |
| WordPress post #57 still Draft, same content (62,069 chars) | PASS | `posts.get` independent read |
| Media #63 still Featured Image | PASS | `featured_media=63` |
| Three Pexels images and Interactive calculator/Quiz remain | PASS — source-level | Post readback |
| Assembler shared template still original, header/footer unchanged | PASS — template read |
| CSS appears in HTML returned to public visitors | PASS | WPVibe HTML head |
| Coming Soon / unlaunched preserved | PASS | WordPress site status |
| Title hidden and cover actually touches header on owner's phone | **UNKNOWN** | Actual authenticated viewport CSS not captured |
| No horizontal overflow at 320/375/390/768/1280px | **UNKNOWN** | Owner/browser screenshot pending |
| Interactive still works after CSS change | **UNKNOWN** | Real browser tap tests pending |

**Important access limitation:** unauthenticated HTML fetch of `/?p=57&preview=true` returns WordPress.com **Coming Soon** splash, not the owner-authenticated Draft DOM. The returned head contains the new CSS, but that alone cannot establish computed page layout. No misleading Visual QA PASS claimed.

## Acceptance on owner's Android

1. Open the [logged-in Draft preview](https://hybridmind.online/?p=57&preview=true) and reload.
2. The black Hybrid Mind header stays. Immediately after it, the wide TH-AI Passport 2.0 cover fills the screen width, with **no white title/box** and no clipped words in the cover.
3. Scroll once down into the dark Interactive lesson. There should be **no white band** between the cover and its dark content, no horizontal page scroll, and source text should stay legible.
4. Try the existing `วิดีโอ 10 เรื่อง` points preset, then reset. 1,000→0 expected.
5. Take one screenshot of the top of the article. If excess spacing remains, adjust only Post #57, preserving theme and content.

## Current decision

**CSS FIX APPLIED & STORED / INTERNAL READBACK PASS / SIGNED-IN VISUAL QA UNKNOWN / POST #57 STILL DRAFT / PUBLIC LAUNCH HOLD.**
