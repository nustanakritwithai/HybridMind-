# HYBRID MIND — V3.3 Article Reading Experience Production Deployment

**Checkpoint:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online, WordPress.com Atomic ID `257844857`  
**Approval / scope:** Owner responded “ทำเลย” to follow-on proposal: inspect live Android article UI and implement V3.3 article layout following the V3 homepage release. Implemented an **editorial single-post reading template** while retaining all published post content and the V3 homepage.

## Verdict

**PRODUCTION DEPLOYED — source & public-rendered HTML PASS.** Real Android/desktop computed layout and screenshot test against the public WordPress site **UNKNOWN**; do not conflate with the isolated Chromium fixture test. UNKNOWN != PASS.

## Preflight / rollback evidence

- Existing WordPress `assembler//single` was `status=publish`, `source=theme`, `has_theme_file=true`, raw 3,479 characters.
- Original template copied verbatim to [exact pre-V3.3 single template backup](../backups/WORDPRESS_SINGLE_TEMPLATE_PRE_V33_2026-10-09.html), verified against live source (GitHub blob SHA `d4c9c142604d064e490c0b114200e1617b19a0d4`).
- New [V3.3 single template candidate](../design/HYBRID_MIND_V33_SINGLE_TEMPLATE_CANDIDATE_2026-10-09.html) 14,295 characters (GitHub blob SHA `eabe58a4f4f6e4c1b6b3d436b4b0fa4ae56ac811`), verified on GitHub and WordPress test-template readbacks.
- Jetpack Backup latest known success Oct 8 18:15:15; no fresh whole-site restore rehearsal or automatic-current-snapshot claim. This operation has a **content/template rollback** via GitHub original and the Assembler theme default.
- Site `launched / discourage_search`; Draft #57 retained; Typhoon v0.2.2 inactive.

## Staging fidelity and cleanup

A separate unassigned custom template `assembler//hm-v33-qa-staging` was created solely to check Gutenberg and script preservation (the creation API returned Published even though Draft was requested; it was never assigned to a live page/post). WordPress `templates.get` readback matched the 14,295-byte candidate **exactly**, including CSS, JS and post-title H1 attribute. After production verification, the unassigned staging override was deleted (API responded `status=trash`, subsequent `templates.get` reported no matching ID). This staging template did **not** create a new public article or replace the active theme.

## Production changes — one active Single Post Template

Updated only `assembler//single` via WordPress Template Editor API; after independent readback: `id=assembler//single`, `status=publish`, `source=custom`, **14,295 chars exact match** with GitHub candidate.

Changes:
1. Made the template's existing `core/post-title` use `"level":1` and left alignment (previously default H2). This fixes single-post document headline semantics without editing titles.
2. Inserted one `core/html` block after the shared theme header and before the main content. This supplies Article Reading navigation/back-to-site, accessible Table of Contents toggle and progress bar, plus isolated CSS/JS. The old template's `core/post-featured-image`, `core/post-content`, comments and Footer template-part remain unchanged.
3. CSS scopes redesigned visual styling to `body.single-post:not(.postid-55):not(.postid-57)`. It uses cream background, white reading card, Midnight Navy header, Mint accents, readable Thai paragraph spacing, no sideways overflow, natural-ratio `object-fit:contain!important` for full featured images. The original inline featured image markup still says `aspect-ratio:4/3;object-fit:cover`; the newly injected CSS overrides that at browser computed-style level, **but actual device cropping screenshot is not confirmed**.
4. Standalone immersive iframe posts #55 and Draft #57 retain their original embedded experiences. The utility bar is hidden via targeted CSS for these two posts; #55's duplicate outer title is screen-reader-only. Visual behavior remains to be checked in a real browser.
5. TOC code reads existing post-content H2s, assigns collision-resistant IDs where absent, generates anchor links, toggles with an accessible button and Escape, and updates reading progress on scroll/resize. It does not call AI providers, download scripts or alter post content on the server.

No changes were made to global custom styles, theme activation, WordPress Page #16, other Page/Post bodies, shared Navigation, or Typhoon.

## Evidence / regression QA

| Check | Outcome |
|---|---|
| V3.3 CSS/JS candidate bracket counts and JS parsing | PASS |
| Isolated Chromium WordPress-like fixture at 320, 375, 390, 768, 1280, 1440 CSS px | PASS (no horizontal overflow or page errors) |
| Local fixture TOC open/close, eight generated links, H1, image objectFit computed `contain`, reading progress to 100 | PASS — fixture only |
| Production template readback exact candidate | PASS |
| Public WordPress #31 GS20 HTML | PASS: template CSS/JS present, H1, generated 8 TOC targets and 8 matching anchors |
| Public WordPress #52 AI game HTML | PASS: template CSS/JS present, H1, generated 7 TOC targets and 7 matching anchors |
| Public WordPress #55 AI ERA HTML | PASS structural: original `hm-a2a-lesson-iframe` retained, CSS/JS present, TOC empty (embedded interactive document has its own navigation) |
| Public WordPress Homepage | PASS: Page #16 remains V3; no V3.3 article utilities on homepage |
| Published posts | PASS: IDs #55/#52/#31 only; modified timestamps unchanged |
| Draft AiPASS #57 | PASS: remains Draft, Featured Media #63 unchanged |
| WordPress Global Styles | PASS: ID 2 still 7,682 original CSS chars; historic R2 cover rules preserved |
| Typhoon Chat status | PASS: inactive version 0.2.2 |
| Public launch/visibility | PASS: `launched / discourage_search`, blog_public remains 0 |
| Real production Android/desktop screenshot, computed CSS and manually clicking the TOC | **UNKNOWN — no direct public browser screenshot/control capability** |
| External Google SEO `noindex` behavior | **UNKNOWN**; separate L5 release hold |

Source of public HTML was WordPress connected page reader `get_page_html` with anonymous published-post URLs. Its output contains post template markup after client-side heading-ID/TOC enhancement. This confirms server/reader DOM output, **not** visual pixel accuracy at different device viewports.

## Rollback

The shared Assembler theme still ships `assembler//single` (`has_theme_file=true`). To revert fully: verify current WordPress Template ID/source first, then use `templates.delete(id="assembler//single", user_confirmed=true)` **only after owner approval**, which removes the V3.3 custom override and returns to original theme template. Alternatively `templates.update` with the exact 3,479-char GitHub backup restores original visual markup while retaining a custom override. After rollback independently inspect all three public article URLs, Page #16, plugin state and Draft #57.

## Next scoped work

- Capture actual production screenshots / computed CSS with a signed-in or regular Chrome/Android browser across 320/375/390/768/1280 widths, verify no first-load content shift, popup TOC and in-page scroll, featured images not cropped, and the iframe #55 scrolling behavior.
- Resolve any witnessed defects using one narrow template/CSS revision and repeat public readbacks.
- L1 Contact/Privacy/Affiliate pages, empty AI News, Typhoon Guest L4, Jetpack restore and L5 SEO remain outstanding.

**Final state: Website LIVE (content-only), Homepage V3 + Article Template V3.3 active. UNKNOWN != PASS.**
