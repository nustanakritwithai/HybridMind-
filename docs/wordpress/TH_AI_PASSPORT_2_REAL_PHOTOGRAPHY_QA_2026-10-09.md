# HYBRID MIND — TH-AI Passport 2.0 Real Photography Integration QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online · WordPress.com Atomic site ID `257844857`  
**Post:** `#57` — **DRAFT** / `th-ai-passport-2-gemini-enterprise-visual-guide`  
**Preview:** https://hybridmind.online/?p=57&preview=true  
**Edit:** https://hybridmind.online/wp-admin/post.php?post=57&action=edit  
**Rule:** UNKNOWN ≠ PASS  
**Result:** **MEDIA UPLOAD PASS / ONE-BLOCK WRITE + READBACK PASS / MOBILE VISUAL QA UNKNOWN / PUBLICATION HOLD**

## Request and editorial treatment

Owner requested **real photographic imagery inside the TH-AI Passport 2.0 Visual Interactive Draft**, instead of relying only on CSS illustrations.

Early AI image generation yielded tall webpage-like infographics with fabricated-looking press events and logos. **Those images were NOT inserted** because they might imply a real official event or specific participant affiliations. Instead, selected **existing real stock photographs with a documented free-use license** from Pexels. All placed image captions explicitly state that subjects are editorial illustrations of work/learning, **not** real AiPASS activity or participants.

License statement: https://www.pexels.com/license/ (attribution optional; no implied endorsements permitted).

## Uploaded media assets

| Visual position | WordPress media | Source page | Credit | Placement |
| --- | --- | --- | --- | --- |
| Professional at laptop in Bangkok | **58** | https://www.pexels.com/photo/young-asian-woman-working-in-modern-office-35754346/ | Sommart Sopon / Pexels | Hero / existing concept-art card |
| Team discussing work at laptop | **59** | https://www.pexels.com/photo/a-people-looking-the-laptop-together-8519081/ | Artem Podrez / Pexels | After AI Chatbot vs AI Agent comparison |
| Learning/studying with notebook | **60** | https://www.pexels.com/photo/positive-asian-woman-with-notebook-studying-in-classroom-6237992/ | Monstera Production / Pexels | After skills-development level cards |

WordPress media URLs:
- https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-aipass-photo-bangkok-professional.jpg
- https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-aipass-photo-ai-teamwork.jpg
- https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-aipass-photo-ai-learning.jpg

All three are real JPEG photos (not generated depictions of project events), media metadata includes Thai alt text and photographer credits; no photograph is labeled as an AiPASS participant or official press conference.

**Performance:** The actual embedded `srcdoc` references WordPress Jetpack-resized media URLs `i0.wp.com`, rather than loading full 6000px originals. Embedded dimensions are 1024×683 for Hero/learning and 768×1152 for portrait team photo. First Hero image is `loading=eager` and secondary images `loading=lazy`; all are `decoding=async`. Actual mobile network waterfall not tested.

## Exact edit scope and safety

The published theme template and article-wide CSS were NOT changed.

The WordPress post before edit:
- Post #57 `status=draft`, modified `2026-10-09T13:38:53`
- Top-level blocks: index 0 `core/html`, index 1 `core/paragraph` (source list), index 2 `core/paragraph` (editorial disclaimer).
- Block 0 SHA1 `5dcfe31c2c299e8f58304d9057bf66cf1c6bc944`; content hash `5e7ac5000ef682c79db48f3deb079d66dfb7c1b7`.
- Both trailing paragraph blocks recorded separately via SHA1.

Used **`post-sections.replace` only on index 0** with `expected_block_type=core/html`, `expected_modified`, `expected_content_hash` and `expected_block_hash` from a fresh read. No full-post rewrite.

Inside the isolated `iframe srcdoc`:
1. Replaced one CSS-only Hero globe label/orb node with a figure containing WordPress image 58.
2. Added editorial photo/story panels in existing `compare` and `levels` sections, referencing images 59 and 60.
3. Appended CSS **scoped within this existing iframe**. Images stay responsive, keep natural aspect ratios, and page/iframe height can expand with its existing resize controller. No new external JavaScript.
4. Changed only **`img-src 'none'`** in its CSP to **`img-src https://i0.wp.com https://hybridmind.online`**. All original `script-src`, `connect-src 'none'`, `frame-src 'none'`, `form-action 'none'` and sandbox restrictions remain.
5. Preserved the original interaction scripts byte-for-byte, including calculator, mode switcher, quiz and height/anchor bridge.
6. Caption/alt text provides provenance and not-a-real-event qualification. No invented media approvals.

Source-level **reversibility check PASS**: removing only the three image/content insertions and the new scoped CSS, then reverting the single CSP replacement, reconstructs the exact pre-change decoded iframe document.

## WordPress independent readback

| Check | Result |
| --- | --- |
| `posts.get(edit)` post 57 still Draft | PASS |
| New custom HTML `srcdoc` contains exactly 3 images | PASS |
| Hero, team, learning photography tags all exist | PASS |
| Only WP media / Jetpack resize image URLs used | PASS |
| Responsive photography CSS present | PASS |
| Approved `img-src` hosts limited to WP and WP media CDN | PASS |
| Calculator, 1.0/2.0 switcher, quiz and original sources still in markup | PASS **static** |
| Two other Gutenberg blocks unchanged | PASS (original SHA1s preserved) |
| Media #58–60 exist with JPEG MIME and Thai alt text | PASS |
| New WordPress revision exists | PASS — Revision **61**, `2026-10-09T13:55:00` |
| Coming Soon/unlaunched remains | PASS |
| Real signed-in mobile rendering at 320/375/390/768/1280 CSS px | **UNKNOWN** |
| Actual image loading over mobile network, tap/scroll/quiz runtime | **UNKNOWN** |

Post modification after write: `2026-10-09T13:55:00`. Post #57 remains `Draft` with `featured_media=0` to avoid duplicating or theme-cropping its embedded Hero photo. External visitors still see Coming Soon.

## Next QA

Owner opens the [Draft preview](https://hybridmind.online/?p=57&preview=true) while logged into WordPress.

1. Check **top Hero photo** is visible, full width within panel, no cropping, with the image caption.
2. Scroll to `AiPASS 1.0 → 2.0`, inspect team editorial image and original working switcher.
3. Scroll to `AI User → Developer`, inspect education photo.
4. Tap preset `วิดีโอ 10 เรื่อง` → total should become 1,000 (based on the program's 100-point/video rate). Reset → 0.
5. Complete and restart Quiz, verify iframe grows to content height without nested scroll.
6. Send one top and one lower screenshot; required viewport matrix remains HOLD until images and browser tests pass.
7. **Do NOT** change `Draft` to `Published` or turn off Coming Soon without owner approval.

**Decision: Photos integrated into WordPress Draft; no actual end-to-end visual PASS claimed.**
