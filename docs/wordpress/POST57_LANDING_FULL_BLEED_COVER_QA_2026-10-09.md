# Hybrid Mind — Post #57 Full-Bleed Cover-Only Landing QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online · WordPress.com Atomic ID `257844857`  
**Article:** [TH-AI Passport 2.0 — Visual Interactive Draft #57](https://hybridmind.online/?p=57&preview=true)  
**Owner choice:** Layout option **2** — display only the entire wide cover immediately under the site header, without white title block / excess spacing.  
**Rule:** UNKNOWN ≠ PASS.

## Actual production/CMS state

- WordPress Post **#57 remains Draft**, Featured Image **#63**, title retained in post metadata, embedded visual article/controller and original 3 editorial photos unchanged.
- Assembler shared `assembler//single` template inspected read-only. It contains an initial `wp:spacer`, a constrained group with `wp:post-title` + `wp:post-featured-image` at 4:3, followed by `wp:post-content`.
- Global Styles ID `2` was **5,496 characters** before this task's backup. Snapshot: [Post57 Full-Bleed Prechange CSS Backup](POST57_LANDING_FULL_BLEED_PRECHANGE_CSS_2026-10-09.md), Git commit `716cbf0342459d3784ded0a5469859840f1d1763`.
- **Concurrency guard:** before this assistant could apply an additional patch, WordPress CSS changed independently to **7,682 characters** with the equivalent **`R2-POST57-COVER-ONLY`** rule set appended. This assistant's guarded WordPress CSS write was **ABORTED WITHOUT MODIFICATION** due to backup mismatch. We did **not** overwrite the concurrent work or append duplicate CSS.
- The independently added **2,186-character CSS append** preserves all previous 5,496 characters as an **exact prefix**, including old Post #52 and Post #57 cover aspect fixes.
- New CSS is scoped to `body.single-post.postid-57`. It removes the theme's first spacer, visually hides the WordPress post H1 **without dropping it from accessible/SEO markup**, makes the featured cover wrapper **100vw** with edge-to-edge margins, enforces original image ratio (`object-fit:contain` + `height:auto`), removes pre-content margin/padding, sets dark background instead of white, and adjusts source paragraph text colors for the dark area.
- The custom CSS with the **`R2-POST57-COVER-ONLY`** marker is also present in WordPress's unauthenticated public HTML `<head>`.

## CMS and static release checks

| Check | Status |
| --- | --- |
| Layout rule appended and stored by WordPress | **PASS — readback** |
| Rule applies to post #57 only | **PASS — source inspection** |
| Theme's initial spacer hidden | **PASS — source inspection** |
| Visible white title removed while semantic H1 preserved | **PASS — CSS/source inspection**, browser QA pending |
| Full-width cover wrapper and uncropped original image | **PASS — CSS/source inspection**, browser QA pending |
| Gap before iframe interactive content reduced / dark background | **PASS — CSS/source inspection**, browser QA pending |
| Previous CSS exact-prefix preserved | **PASS** |
| No duplicate/conflicting second patch made by this assistant | **PASS** |
| Post #57 Draft, media #63 and interactive controller intact | **PASS — WordPress readback** |
| Site Coming Soon / unlaunched | **PASS** |
| Actual logged-in mobile visual full-bleed and no white gap | **UNKNOWN** |
| Real touch/scroll/keyboard, 320/375/390/768/1280 layout matrix | **UNKNOWN** |
| Public Launch or published article | **HOLD** |

**External HTML limitation:** WPVibe's unauthenticated browser fetch of the preview still receives `<body class="wpcom-coming-soon-body">`, not the signed-in article. The stylesheet being present in its `<head>` does **not** prove the layout is visually correct for authenticated users.

## Next acceptance step

Open [Post #57 Preview](https://hybridmind.online/?p=57&preview=true) while authenticated on Android. Refresh. Capture (1) screenshot directly under Hybrid Mind site header showing full-width cover with no title or white background, and (2) transition from cover to dark Interactive lesson. If anything remains white/cropped or there is sideways overflow, inspect the actual browser/computed DOM, and make **only one targeted follow-up correction** after gathering proof. Do not change theme templates or other posts.

**Decision:** Requested Cover-Only implementation **present in Global Styles and verified at source level**; no second mutation by this session; **Visual QA still UNKNOWN**; Draft and Coming Soon remain unchanged.
