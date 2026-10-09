# HYBRID MIND — AiPASS 2.0 Featured Cover Upload and QA

**Date:** 2026-10-09 Asia/Bangkok
**Site:** https://hybridmind.online · WordPress.com Atomic site 257844857
**Target:** TH-AI Passport 2.0 Visual Interactive **Post #57**
**State:** Media upload PASS / Featured Image readback PASS / Scoped 16:9 image CSS readback PASS / Actual signed-in browser Visual QA UNKNOWN / PUBLICATION HOLD
**Rule:** UNKNOWN ≠ PASS.

## Owner action
The owner requested the AI-generated TH-AI Passport 2.0 cover to be placed onto the existing WordPress post. This was treated as authorization to **upload the cover and assign Featured Image** to Draft Post #57; it is NOT authorization to publish the article or disable Coming Soon.

## Asset & metadata
- **WordPress Media ID #63**, `image/png`, **1672 × 941** pixels
- URL: https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-th-ai-passport-2-cover.png
- Title: `HYBRID MIND — TH-AI Passport 2.0 (ภาพปกสร้างด้วย AI)`
- Descriptive Thai Alt Text includes that the artwork was **AI-generated**.
- Caption: `ภาพประกอบสร้างด้วย AI โดย Hybrid Mind ไม่ใช่ภาพกิจกรรมจริง ภาพถ่ายผู้เกี่ยวข้อง หรือสื่อประชาสัมพันธ์อย่างเป็นทางการของโครงการ TH-AI Passport`
- The graphic includes conceptual illustrations and reported news metrics; it is **not** a photograph of AiPASS or government officials.

## WordPress Featured Image update
- Original Post #57 state: `draft`, `featured_media=0`; title and article already existed.
- `posts.update` changed **only** `featured_media` to **63** (and WordPress modified timestamp).
- Independent readback: `id=57`, `status=draft`, `featured_media=63`, `modified=2026-10-09T14:43:11`; article content still **62,069 characters**, original Pexels photos and interactive calculator/quiz/source links still present.

## Preserve original 16:9 cover without cropping
The live Assembler `assembler//single` template defines the common featured-image block with a forced **4:3** aspect ratio, which may crop the new 1672×941 cover's edges if left unmodified.

A narrow **Post #57-only** CSS fix was applied after backing up exact existing Global Styles ID 2. It sets the `figure.wp-block-post-featured-image` and its `img` to natural aspect ratio, width <=100%, `height:auto`, and `object-fit:contain`. Rules target **`body.single-post.postid-57` only**. No shared template or other posts changed.

- Backup document: [Post 57 Cover CSS Prechange](POST57_COVER_CSS_PRECHANGE_2026-10-09.md)
- Backup commit: `773cabcf75b9bf116c134742c87fdbbadf4e2879`
- WordPress CSS ID 2 original: **4,888 chars**; new: **5,496 chars**.
- Independent readback: original CSS is preserved exactly as prefix, with one appended **608-character scoped rule group**, no CSS changes to Post #52 or Typhoon Chat.

## QA evidence

| Check | Status |
| --- | --- |
| AI-generated cover uploaded to Media Library | PASS |
| Image dimensions 1672×941 / image/png | PASS |
| Image #63 attached as Featured Image of Post #57 | PASS |
| Natural ratio rule scoped to Post #57 | PASS (source/readback) |
| Prior WordPress Global CSS preserved | PASS |
| Post #57 remains Draft | PASS |
| Original Interactive JS + 3 Pexels content photos remain | PASS (markup) |
| Calculator & Quiz behavior in actual browser | UNKNOWN (not rerun) |
| Hero image displays fully in logged-in Android/desktop browser | UNKNOWN |
| Coming Soon / unlaunched preserved | PASS |
| Public article published | NO / HOLD |

## Owner preview
- Signed-in preview: https://hybridmind.online/?p=57&preview=true
- WordPress editor: https://hybridmind.online/wp-admin/post.php?post=57&action=edit
- Ask for a new mobile screenshot showing the entire cover to confirm the aspect-ratio rule beats actual computed styles and no text is clipped.

The site is still Coming Soon. **Do not claim Visual QA PASS** based solely on WordPress CSS readback.
