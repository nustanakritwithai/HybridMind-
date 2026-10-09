# HYBRID MIND — L3-A Structural QA + L3-B/C Static Preflight

**Audit date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online / WordPress.com Atomic / Site ID `257844857`  
**Mode:** READ ONLY — no WordPress content or site-setting changes  
**Release:** PRE-LAUNCH / HOLD. **UNKNOWN != PASS.**

## Scope and strict evidence levels

1. **WordPress configuration / raw Gutenberg / rendered REST HTML:** proves CMS data, rendering output and block/asset structure, **not browser behavior**.
2. **Anonymous site HTML inspection:** inspected the actual visitor-facing response through the connected WPVibe page HTML reader. It contains `<body class="wpcom-coming-soon-body">` and the Thai Coming Soon message; no editorial DOM is served to that anonymous request. The same held for anonymous `/?p=57&preview=true` request. This **PASSes Coming Soon restriction**, not post visual QA.
3. **Authenticated browser + screenshots at 320/375/390/768/1280 CSS px:** **not performed / UNKNOWN**. Connected read abilities do not supply an authenticated interactive browser with viewport control and touch/click actions. Do not claim mobile, click or screenshot PASS.
4. Tool-side web URL fetches may be limited; inaccessible web crawls are **not evidence of broken links**.

## L3-A: Homepage and site structure

| Test | Evidence | Classification |
| --- | --- | --- |
| Page assigned as static homepage | Reading settings: `show_on_front=page`, `page_on_front=16` | PASS |
| Page #16 source | Published, modified `2026-10-09T08:49:54`, raw 14,007 chars, FNV-1a/32 `cfe4c20f` | PASS |
| Homepage Query Loop | Gutenberg `postType=post`, `perPage=6`, filters categories `[26694707,26694708,26694709,26694710]` | PASS |
| Rendered homepage latest-post cards | WordPress REST `pages.get(context=view)`: exactly 3 cards, ordered **#55 AI ERA**, **#52 AI Game**, **#31 GS20** | PASS **server-rendered HTML only** |
| Starter post | Hello World #3 absent from server-rendered cards; prior CMS readback #3 `trash` | PASS |
| Homepage local anchors | Rendered HTML has `hm-explore` and `hm-smart-picks`; no duplicate ID or unresolved tested local `href="#..."` target | PASS source |
| Header | Published `assembler//header` calls `wp:navigation ref=4` | PASS |
| Navigation #4 | Published, 4 links: Home, AI News, Future Lifestyle, Smart Buying; Smart Buying points to `#hm-smart-picks` | PASS structure |
| Footer | Published `assembler//footer`; links AI News, Explained, Future Lifestyle, Smart Buying anchor and About page | PASS structure |
| About link | Page #1 Published with brand content | PASS structural |
| AI News link destination | `ai-news` category ID 26694707 exists but has 0 Published posts while prominently linked in homepage/nav/footer | **FAIL editorial usefulness / HOLD B3** |
| Site icon/logo | Settings `site_icon=0`, `site_logo=0`; typographic site branding remains | P1 launch issue, not a new fault |
| Public visibility | `manage-site.status`: `coming_soon / unlaunched`; external anonymous HTML body is `wpcom-coming-soon-body` | PASS prelaunch gate |
| Draft #57 anonymous preview | `/?p=57&preview=true` anonymously serves Coming Soon HTML with no draft page body | PASS for inspected anonymous path only |
| Anonymous article display | Coming Soon applies; visitors cannot see editorial pages yet | EXPECTED; not a visual QA FAIL |

**Important nuance:** Returned `pages.get(context=view)` includes all three article cards despite anonymous visitors receiving Coming Soon. These represent **CMS server-rendered fragment output**, not a user-visible screenshot.

## L3-B: Responsive source and image preflight

| Item | Evidence | Classification |
| --- | --- | --- |
| Responsive CSS exists | WordPress Global Styles ID 2 includes `@media (max-width: 781px)`, `680px`, `380px`; individual Visual lesson iframe code has responsive media rules | PASS for CSS presence only |
| #52 full infographic intention | Global Styles includes `R2-IMG-52` scoped CSS for `body.single-post.postid-52` to disable crop using auto aspect/height and `object-fit:contain` | PASS CSS presence, browser crop UNKNOWN |
| #57 cover styling intention | Global Styles includes `R2-POST57-COVER-ONLY` scoped rule for Draft #57 full cover and title-panel removal | PASS CSS presence, browser crop UNKNOWN |
| Media #26 GS20 cover | PNG 1254×1254, informative AI-generated disclaimer in alt text | PASS CMS metadata |
| Media #51 Game infographic | JPEG 1536×1280, Thai alt text | PASS CMS metadata |
| Media #63 AiPASS cover | PNG 1672×941, AI-generated disclaimer in alt text | PASS CMS metadata |
| Media #58/59/60 editorial photos | All 3 JPEG WordPress assets present; dimensions 6000×4000, 3907×5860, 5472×3648; all have alt text | PASS CMS metadata |
| Homepage card images | Homepage query template uses 16:9 thumbnail crops; actual #52 and #31 image HTML has `object-fit:cover` in **homepage card context**. Risk of thumbnail cropping differs from single-post scoped infographic fix | Potential visual risk; not confirmed defect |
| #55 card thumbnail | #55 `featured_media=0`; rendered homepage #55 post card lacks featured image, while #52/#31 cards have one | **Known content/design inconsistency**; decide separately whether to add an illustration |
| Widths 320/375/390/768/1280 | No authenticated viewport screenshots or pixel-level overflow measurements | **UNKNOWN** |
| Real image loading / CSP / mobile legibility | Not witnessed by mobile browser | **UNKNOWN** |

## L3-C: Interactive source inspection

### #55 AI ERA 2026 (Published)

- Post ID 55; modified `2026-10-09T17:47:46`; source 50,842 chars.
- REST rendered post HTML contains the `hm-a2a-lesson-host` and the iframe `hm-a2a-lesson-iframe`, including `srcdoc`.
- Extracted inner document has **34 IDs, 0 duplicate IDs**, 8 local anchor hrefs with **0 unresolved**, **27 literal `getElementById()` targets all present**; source includes switching functions, copy fallback, 3-question quiz, ResizeObserver and parent postMessage height/scroll bridge.
- JS source *presence* **PASS**. Actual click handlers/quiz/clipboard/iframe scroll under Chrome/Android **UNKNOWN**.

### #57 TH-AI Passport 2.0 (DRAFT)

- Post ID 57; status `draft`, modified `2026-10-09T18:31:53`; 62,202 raw chars, featured media #63.
- REST rendered post HTML retains `hm-aipass-article-host`, `hm-visual-aipass-frame` and `srcdoc`.
- Extracted inner document has **37 IDs, 0 duplicate IDs**, 9 local anchor hrefs with **0 unresolved**, three editorial `img` tags **all with alt attributes**.
- Static source includes switcher, `recalc()`, video preset `counts.video=10`, reset handler, eligibility check, 3-question quiz, ResizeObserver and parent message bridge.
- Activity rate `video=100` and preset video count 10 imply **1000** in code; arithmetic expectation, **not observed output**. Mixed preset 5 videos + 5 short clips + 4 docs + 2 articles + 1 prequiz + 1 midquiz is 1010 points by stored rates; normal progress caps at 100%.
- Sandboxed iframe meta CSP limits remote connectivity (`connect-src 'none'`) and image origins to WordPress/Jetpack media; static presence only. Actual Android browser operation **UNKNOWN**.
- Corrected text about original >=5 million **people** vs 500,000 reported Enterprise seats remains in Draft; browser color/appearance UNKNOWN.

## Additional observation for L4 (not a security finding yet)

The anonymous WordPress Coming Soon response includes the **Typhoon Chat client script/config** in HTML footer. It does **not prove** a guest can actually make a chat request, spend tokens or bypass controls. Guest endpoint/rate-limits/cost/privacy require separate L4 authorized testing. Do not interpret public WordPress nonce markup as a secret leak by itself.

## Remaining actionable work

1. Acquire an authenticated interactive browser view (WordPress owner signed-in session without sharing credentials/tokens here), keeping Coming Soon on. Follow existing `L3_INTERACTIVE_RESPONSIVE_TEST_MATRIX_2026-10-09.md` for five viewport sizes.
2. Capture screenshots for Home #16, GS20 #31, AI Game #52, AI ERA #55 and Draft #57, plus actual click/quiz/calculator checks and keyboard/mobile scrolling. Verify homepage 16:9 card crops do not hide #52 diagram text.
3. Decide how to handle **empty AI News** links (B3) and **#55 missing thumbnail**, with separately scoped authorization before changes.
4. When defects are confirmed with browser evidence, propose narrowly scoped L3-D fixes; take fresh backups/revisions and avoid full-post CSS rewrites.
5. Keep #57 Draft, site Coming Soon, Typhoon full-public guest safety HOLD. No public launch without explicit separate owner approval.

## Final decisions

- **L3-A configuration / server-rendered structure:** PASS except pre-existing AI News empty editorial blocker.
- **L3-B responsive / images:** Static CSS & media metadata PASS; physical viewport/image QA **UNKNOWN**.
- **L3-C interactive:** Static source target integrity PASS; actual interactions **UNKNOWN**.
- **L3 overall Release Gate:** **HOLD / NOT YET PASS**.
- **Production mutations performed this round:** NONE.
