# Hybrid Mind — Post #52 Featured Image Crop Fix / QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Project:** Hybrid Mind Modern AI Lifestyle  
**WordPress:** Site ID `257844857`, Assembler theme  
**Article:** [บทเรียนจากการสร้างเกมด้วย AI: AI เก่งแค่ไหน ก็ต้องใช้เครื่องมือให้ถูกงาน](https://hybridmind.online/2026/10/09/ai-game-development-right-tools-godot-unreal-blender/)  
**Post:** `#52`, Published; Featured Image `#51`, original **1536 × 1280** JPEG  
**Highest release rule:** UNKNOWN ≠ PASS

## Complaint and root cause

The owner supplied an Android screenshot showing that the infographic's top text appeared cropped within the featured-image frame. The Assembler theme's shared single-post Gutenberg template `assembler//single` contains:

```html
<!-- wp:post-featured-image {"aspectRatio":"4/3","align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|20"}}}} /-->
```

The uploaded image is 1536x1280 (6:5), **not** 4:3. A forced 4:3 image with cover cropping can cut off the top/bottom infographic content. This is a grounded source-level cause consistent with the screenshot. It is NOT a proof of all browser runtime dimensions, because Coming Soon prevents the unauthenticated fetch from showing the actual article.

## Owner approval, scope, safety

The owner explicitly requested the assistant fix this issue. The implementation **only adds CSS rules scoped to `body.single-post.postid-52`**. It does NOT change the theme's shared single template, edit/replace the original user image, modify the article text or attachments, install plugins, toggle visibility, or publish drafts.

### Prechange backup

Exact existing WordPress Global Styles `styles.css` (ID 2, **4,246 characters**) was captured in GitHub *before* the write:

[Post #52 Featured Image Prechange CSS Backup](POST52_FEATURED_IMAGE_PRECHANGE_2026-10-09.md)

Backup commit: `c66d9e50c963e16339c0eac3ecfb74f5ec36654a`. CSS was reread and matched the backup exactly before applying the change, guarding against concurrent edits.

### Exact CSS patch (appended, not overwritten)

```css
/* Hybrid Mind R2-IMG-52: show complete infographic on post #52 (no 4:3 cropping) */
body.single-post.postid-52 figure.wp-block-post-featured-image {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  aspect-ratio: auto !important;
  overflow: visible !important;
}
body.single-post.postid-52 figure.wp-block-post-featured-image img {
  display: block;
  box-sizing: border-box;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  aspect-ratio: auto !important;
  object-fit: contain !important;
  object-position: center center !important;
}
```

No other selectors are in this patch. Other posts (e.g. GS20 post #31) and the theme-wide template are intentionally not changed.

## Readback evidence (WordPress Connector)

| Check | Result | Evidence |
|---|---|---|
| Global Styles ID 2 accepted update | **PASS** | Save confirmed |
| Latest `styles.css` string length | **4,888 characters** | WordPress re-read |
| Original CSS byte-for-byte prefix preserved | **PASS** | Diff against GitHub 4,246-char backup; only appended 642 characters |
| Scoped Post #52 selectors present | **PASS** | WordPress Global Styles readback |
| `object-fit: contain !important`, `aspect-ratio: auto !important` present | **PASS** | WordPress Global Styles readback |
| Width 100%, max-width 100%, height auto present | **PASS** | WordPress Global Styles readback |
| Public-site HTML `<head>` contains updated CSS | **PASS** | WPVibe HTML fetch |
| Post #52 remains Published; featured_media 51 | **PASS** | WordPress posts.get, no change to post modified `2026-10-09T10:52:15` |
| GS20 Post #31 remains Published; featured_media 26 | **PASS** | WordPress posts.get |
| Assembler theme unchanged | **PASS** | WordPress Site Editor context |
| Coming Soon / unlaunched remains | **PASS** | WordPress site status |
| Actual logged-in mobile full-image appearance after CSS | **UNKNOWN** | Unauthenticated HTTP body is WordPress.com Coming Soon splash |
| Other desktop viewports / actual aspect ratio computed | **UNKNOWN** | Needs authenticated screenshot or browser check |

## Remaining R1.2 Visual Release Gate

1. Owner should open [the post](https://hybridmind.online/2026/10/09/ai-game-development-right-tools-godot-unreal-blender/) while logged in and refresh (hard refresh if necessary).
2. Confirm the **full top heading and bottom infographic** are visible without cropping or clipping; inspect landscape 1536×1280 image aspect, not a 4:3 cover thumbnail.
3. Send a new Android screenshot spanning the infographic top and bottom (or scroll between views).
4. If the image is still cropped, inspect actual DOM for figure/image styles, body class `postid-52`, block wrapper aspect, and image URL caching; make only one targeted correction after evidence.
5. Do not close whole R1.2-D as PASS or open Public Launch on CSS readback alone.

**Decision:** **CSS FIX SAVED / SERVER READBACK PASS / ACTUAL POST-FIX MOBILE VISUAL UNKNOWN / PUBLIC LAUNCH HOLD**.
