# Hybrid Mind — Project Control V0.1

**As of:** 2026-10-09 (Asia/Bangkok)  
**Project:** Hybrid Mind · Modern AI Lifestyle Media / Shopee Affiliate










## V3.3 Article Reading Template — PRODUCTION LIVE (2026-10-09)

- Owner requested “ทำเลย” after V3 Homepage deployment, authorizing V3.3 article reading implementation. **Assembler Single Post Template `assembler//single` is now a Published custom override** (14,295-char exact candidate, WordPress independent readback PASS). Theme activation unchanged.
- **Scope:** enhanced only the common article template, leaving Post bodies/Featured Media, Page #16 V3, global-style settings, navigation, Draft #57, and Typhoon disabled state unchanged. The original 3,479-character theme template is backed up at [Pre-V3.3 Single Template](backups/WORDPRESS_SINGLE_TEMPLATE_PRE_V33_2026-10-09.html); candidate at [V3.3 Single Template](design/HYBRID_MIND_V33_SINGLE_TEMPLATE_CANDIDATE_2026-10-09.html).
- **V3.3 features:** true H1 `core/post-title`, cream/white V3 magazine reading shell on regular #31/#52, featured images display natural aspect via scoped CSS `object-fit:contain!important`, accessible auto-generated table of contents and scrolling reading progress. #55 and Draft #57 immersive iframe layouts are excluded from regular paper-card CSS.
- **QA:** local Chromium fixture at 320/375/390/768/1280/1440 CSS px PASS (no overflow/JS errors, TOC open/close, H1, progress 100). WordPress public-page reader confirms #31 auto TOC 8 links, #52 7 links, all matching targets; #55 still retains original interactive iframe; Homepage V3 remains intact. **Actual real production Android screenshots, click/touch/visual crop/iframe interaction UNKNOWN.**
- Staging test template `assembler//hm-v33-qa-staging` was unassigned, had exact Gutenberg/script readback, then removed; template deletion returned Trash/no matching active template.
- **Rollback:** since `assembler//single` has `has_theme_file=true`, deleting its custom override restores original Assembler theme Single Post template (or update original content from exact GitHub backup) with fresh owner approval and readbacks.
- Current website `launched / discourage_search`, published post IDs #55/#52/#31; Draft #57 unchanged; Typhoon v0.2.2 inactive; WordPress Global Styles unchanged (7,682 chars). SEO Privacy, AI News empty, guest-chat, full-site backup/restore and real-browser QA remain HOLD/UNKNOWN.
- [V3.3 Production Release / QA / Rollback](releases/HYBRID_MIND_V33_ARTICLE_READING_PRODUCTION_DEPLOY_2026-10-09.md). **UNKNOWN ≠ PASS.**

## V3 Homepage — PRODUCTION LIVE (2026-10-09 22:08 ICT)

- **Owner authorized deploying the latest UI V3 to the live WordPress site** (“เอาเวอร์ชั่นล่าสุดขึ้นเว็บจริงก่อนดีกว่า”). Target `https://hybridmind.online/`, WordPress Atomic Site ID `257844857`, static Homepage **Page #16**. **V3 is now LIVE** (Published modified `2026-10-09T22:08:28`).
- **Exact rollback artifact**: [full pre-V3 Page #16 Gutenberg source](backups/WORDPRESS_PAGE_16_PRE_V3_2026-10-09.html), 14,159 chars / original modified `2026-10-09T20:39:52`. [V3 WordPress-ready core/html candidate](design/HYBRID_MIND_V3_WORDPRESS_HOME_CANDIDATE_2026-10-09.html), 54,342 chars. GitHub readbacks matched both content versions exactly.
- **Safe deployment:** staged candidate as WordPress **Draft Page #79** and read back byte-identical source/rendered CSS+JS (remains Draft/noindex). Updated only existing **Published Page #16 content.raw** with V3. Did **not** change theme Assembler, global styles, Navigation #4, Header/Footer template sources, published post bodies, Typhoon plugin status, DNS or site visibility.
- **Production PASS (source/HTTP):** WordPress raw Page #16 readback exactly equals candidate; real anonymous Homepage HTML shows V3 Hero, nav, Reading Room, Visual Lab, V3 footer, CSS and script byte-identical to candidate. Three article cards IDs **#55/#52/#31** are Published; no #57 Draft card. One H1; zero duplicate HTML IDs; 17 anchor links have valid targets.
- **Local Browser wrapper QA PASS only:** isolated WP shell under Chromium at 320/375/390/768/1280/1440 CSS px has no horizontal overflow or JS errors; filters/search, mobile menu and Hero/Lab switches work. **Actual Production device screenshots/computed CSS/real clicks remain UNKNOWN** until a live browser test.
- **Current operational posture:** site `launched / discourage_search` (`blog_public=0`); Typhoon Chat **inactive** (content-only); #57 Draft. Original WP Header/Footer remain stored for article pages and are hidden by CSS **only on Page #16**.
- **Outstanding:** L3 real-world viewport QA, SEO/robots mismatch, L1 public Privacy/Contact/Affiliate trust pages, L4 guest chat security, newest Jetpack Backup/restore UNKNOWN. V3 manual WordPress public GET updates only 3 known cards; fully dynamic article discovery is a later enhancement.
- [Full V3 deploy report / rollback / QA](releases/HYBRID_MIND_V3_UI_PRODUCTION_DEPLOY_2026-10-09.md). **UNKNOWN ≠ PASS**.

## L6 — CONTENT-ONLY SOFT PUBLIC LAUNCH LIVE (2026-10-09)

- **Owner explicitly directed to get the site online now** (“ตอนนี้เอาแค่ให้มันออนไลน์ก่อน”), without publishing Draft #57 or completing unapproved advanced features. **WordPress `manage-site.launch` SUCCESS**, `launch_status=launched`; actual anonymous homepage HTML no longer Coming Soon. Website **LIVE**.
- **Content-only protection:** Hybrid Mind — Typhoon Chat plugin **v0.2.2 temporarily INACTIVE** with WordPress GET verification; no paid chat POST. Changed only Homepage #16 Hero top-level group via optimistic-lock `page-sections.replace` to remove the bot shortcode and change four intro strings to editorial/“chat under review” copy. Backed up original exact block [here](wordpress/L6_SOFT_LAUNCH_HERO_CONTENT_ONLY_PRECHANGE_2026-10-09.md); post-readback verified 17 other blocks unchanged, `modified=2026-10-09T20:39:52`.
- **SEO caveat:** `launch` unexpectedly set `blog_public=1`; immediately returned it to `0` with WordPress `settings.update`. Now `visibility=discourage_search`, `launch_status=launched`, and publicly viewable. **External HTML still showed meta robots `max-image-preview:large`, not `noindex`**, so effective crawler blocking **UNKNOWN**, not SEO PASS. Do not promise complete Google exclusion.
- **Public verification:** anonymous Homepage shows article cards `#55/#52/#31` and no Typhoon JS; anonymous `?p=57` displays a not-found title, #57 remains Draft. No Contact/Privacy/Policy Drafts published.
- **FULL release readiness gates NOT closed:** AI News empty but linked, actual mobile Browser QA L3 UNKNOWN, Contact/Privacy L1 HOLD, Typhoon Guest L4 HOLD (disabled), fresh backup/SEO/monitoring L5 HOLD. This is an owner-directed **soft launch with known exceptions**, not full SEO or guest-AI GO.
- [Complete content-only soft launch changes, verification and rollback](releases/L6_CONTENT_ONLY_SOFT_LAUNCH_2026-10-09.md). **UNKNOWN != PASS**.

## L3-C Isolated Runtime Units & L4 Typhoon READ ONLY — 2026-10-09

- **L3-C isolated mock-DOM tests PASS:** extracted current WordPress iframe scripts (Post #55 Published / Post #57 Draft), invoked quiz event callbacks for both; correct/wrong/finish/restart cycles produced expected 2/3, reset state. #57 calculator functions `recalc/setCount` produced 0 initial, 10 videos=1,000, Reset=0, mixed preset=1,010, progress capped 100%, count clamped 0..99. These are **isolated JavaScript unit tests, NOT authenticated browser/Android QA**.
- [Detailed reproducible isolated-function observations](releases/L3_C_ISOLATED_INTERACTION_UNIT_QA_2026-10-09.md). **L3 Browser Gate remains UNKNOWN/HOLD** for CSS/layout/cropping/iframe/clipboard and 320/375/390/768/1280 width screenshots.
- **L4 read-only Typhoon preflight:** WordPress confirms Hybrid Mind — Typhoon Chat v0.2.2 Active, `POST /hybridmind/v1/chat`, GET knowledge endpoints. Knowledge-status: `published_wordpress_only`, published posts=3/pages=2, `reads_drafts=false`, `external_live_web_search=false`. **Configuration PASS; actual guest authorization, rate limits, cost cap, token use, draft extraction resistance, error recovery and retention UNKNOWN.**
- Privacy Page #68 remains Draft and still needs contact, prompt retention/provider/log and cookie/PDPA decisions. WPVibe plugin-backed file-source read unavailable, core REST and WPcom reads worked. No chat POST and no paid AI test performed; presence of Typhoon JS in anonymous Coming Soon response is **review item, not proof of vulnerability**.
- [L4 safety/cost preflight report](releases/L4_TYPHOON_GUEST_READ_ONLY_PREFLIGHT_2026-10-09.md). **No WordPress Production changes. #57 remains Draft, Coming Soon unchanged; public launch NO GO. UNKNOWN != PASS.**

## L3-C Interactive Script Parsing & Data Tests — 2026-10-09 (READ ONLY)

- Fetched fresh WordPress #55 (`publish`, modified `2026-10-09T17:47:46`) and #57 (`draft`, modified `2026-10-09T18:31:53`). Extracted `iframe srcdoc` documents and tested the 3 embedded JavaScript blocks for syntax validity; **all 3 parsed PASS**.
- Parsed the 3-question quizzes as JavaScript data: #55 correct indexes `[1,0,2]`, #57 `[1,0,1]`, all within valid option ranges. #57 scoring source yields 10 standard videos × 100 = **1,000**; Mixed preset = **1,010**; reset code zeros all counters. **STATIC assertions PASS, runtime UNKNOWN**.
- Authenticated browser/device click, viewport, screenshots and iframe scroll cannot be verified via present WordPress connectors; anonymous site and preview requests show Coming Soon as intended. **Do not mark L3 PASS, publish #57 or alter visibility to get around the gate.**
- [L3-C source/data evidence](releases/L3_C_INTERACTIVE_SOURCE_VERIFICATION_2026-10-09.md). **Next requires authenticated-browser testing (e.g. Work Cloud Browser with owner-login) at 320/375/390/768/1280 CSS px. NO GO for Public Launch. UNKNOWN != PASS.**

## L3-A Structural / L3-B-C Static QA — READ ONLY (2026-10-09)

- **WordPress site still `coming_soon / unlaunched`.** Anonymous `hybridmind.online` and anonymous Draft #57 Preview returned WordPress Coming Soon HTML (`wpcom-coming-soon-body`), as intended. This blocks public DOM/click QA without a signed-in browser, not a site failure.
- **L3-A CMS & rendered HTML PASS:** Static homepage Page #16, Query Loop filters include Explained `26694708`; WordPress server-rendered homepage output contains cards `#55, #52, #31` in order and no Hello World #3. Header uses Navigation #4, Footer About link exists, local homepage anchor targets valid. **AI News Published=0** despite Homepage/Nav/Footer links: editorial FAIL/HOLD (B3).
- **L3-B source-only PASS / physical viewport UNKNOWN:** Global Styles contains scoped post #52 full-infographic crop fix and Draft #57 cover-only CSS; media #26/#51/#63/#58-60 exist with alt texts. Homepage cards use 16:9 crop, and #55 has no Featured Image; review visually before changes. No verified 320/375/390/768/1280 screenshots.
- **L3-C static PASS / runtime UNKNOWN:** `#55` iframe source 34 unique IDs / 8 anchors / 27 DOM references with no unresolved targets; `#57` iframe source 37 unique IDs / 9 anchors / 3 alt-tagged photos; switching, quiz and calculator code present. Buttons, scroll, keyboard, image loads not actually tested under authenticated browser.
- **No Production changes**. [L3-A/B/C audit evidence](releases/L3_ABC_STRUCTURAL_AND_STATIC_QA_2026-10-09.md) · [Existing L3 browser QA checklist](releases/L3_INTERACTIVE_RESPONSIVE_TEST_MATRIX_2026-10-09.md). L3 release HOLD; next obtain signed-in WordPress preview/browser viewport evidence without changing site visibility. **UNKNOWN != PASS.**

## L2-C Fix Round 1 — Scoped WordPress edits (2026-10-09)

- **Owner authorized** L2-C Round 1 only: correct #57 Thai AiPASS figure's unit, add official docs to #52, research vendor source for #31, prepare interaction QA #55. No publication or Public Launch approval.
- **Post #57 DRAFT exact narrow repair PASS:** changed five textual phrases in existing `core/html` block to distinguish AiPASS original target **at least 5 million Thai people** from reported **500,000 Gemini Enterprise seats**. Modified `2026-10-09T18:31:53`; exact expected full body readback matched, unchanged reference/disclaimer paragraph blocks and Featured Image #63 preserved.
- **Post #52 PUBLISHED references PASS:** inserted **one Gutenberg paragraph** at index 69 with six official links (Godot Scenes/Physics; Unreal Lumen/Nanite/Licensing; Blender Python API) plus personal-experience qualifier. Modified `2026-10-09T18:33:16`; all **70 previous Gutenberg blocks** retained identical block hashes; Featured Image #51 unchanged.
- **Post #31 vendor traceability still UNKNOWN / citation gap:** exact original GS20 seller/variant at 602 THB not recovered from WordPress article, available indexed repo search or generic Shopee discovery. No product link substituted and no post change made.
- **Post #55 runtime QA PENDING / UNKNOWN:** interactive QA checklist prepared; no change to article. #55 remains Published in Explained, modified `2026-10-09T17:47:46`.
- **After-readback site PASS:** `coming_soon / unlaunched`; #57 Draft; #3 Trash; #16 homepage unchanged; AI News empty archive B3 HOLD. Existing Jetpack backup active but full restore rehearsal/current same-day backup UNKNOWN. **Public Launch NO GO.**
- [Full execution evidence](releases/L2_C_EDITORIAL_FIX_ROUND1_EXECUTION_2026-10-09.md) · [L3 Browser/Interactive QA matrix](releases/L3_INTERACTIVE_RESPONSIVE_TEST_MATRIX_2026-10-09.md). Next: authenticated device QA and exact #31 seller evidence. **UNKNOWN != PASS.**

## L2-C Editorial Verification — READ-ONLY AUDIT (2026-10-09)

- Audited live WordPress Post #31, #52, #55 and Draft #57 against official references, media metadata, embedded HTML/JS source and prior photography provenance report; **no Production content or site setting was modified**.
- **#31 GS20: HOLD** — clear AI-image/vendor-data disclaimers PASS; original vendor product listing and variant for 602 THB missing (editorial provenance FAIL), browser imagery UNKNOWN.
- **#52 AI game development: HOLD** — Godot/Unreal/Blender descriptions broadly match technical documentation; article has 0 external source links, add official docs after approval, featured image display UNKNOWN.
- **#55 AI ERA: HOLD for L3** — A2A/MCP/Computer Use sources open and distinction consistent; embedded script/control/quiz structure present, runtime/mobile UNKNOWN.
- **#57 AiPASS 2.0: HOLD / DRAFT** — news of 500,000 Gemini Enterprise seats, 1,000 points, up to 10 months corroborated by 2026-10-09 reports; important editorial FAIL: official AiPASS says target is 5 million *people*, while article calls it 5 million *registration rights* in callout/stat/quiz. Correct wording throughout only upon scoped owner approval. Edition, available quotas, actual browser behavior UNKNOWN. Featured AI cover and three Pexels photographs traceable to saved media evidence; never publish without individual authorization.
- [Full fact-check, official sources, static interactive inventory and proposed narrow correction batches](releases/L2_C_EDITORIAL_VERIFICATION_AUDIT_2026-10-09.md). Next: approve individual precision/source updates and run L3 authenticated browser/device QA. **UNKNOWN != PASS. Public Launch NO GO.**

## L2-B Editorial Cleanup — execution, 2026-10-09 (B1/B2 COMPLETE)

- Explicit owner approval received. WordPress Post #3 moved from Published to recoverable Trash at `2026-10-09T17:47:08`; body unchanged (165 chars). Post #55 category replaced from `[1]` Uncategorized to `[26694708]` Explained at `2026-10-09T17:47:46`; body unchanged (50,842 chars), title/URL/slug/publish date unchanged.
- Independent WordPress readback PASS: Published IDs `[55,52,31]`; Explained Published = 3; Uncategorized Published = 0. Homepage #16 raw body and Query Loop unchanged; #55 is now eligible in the feed. Live authenticated browser render remains UNKNOWN.
- AI News Published = 0 and Navigation/Footer still point to the category: B3 HOLD. #57 remains Draft, site remains Coming Soon/unlaunched. No Public Launch authorization.
- Jetpack Backup is active, last successful backup `2026-10-08T18:15:15`, restore preflight UNKNOWN. B1 and B2 are individually reversible; no current full-site restore test was performed.
- [Complete L2-B execution evidence and verification](releases/L2_B_EDITORIAL_CLEANUP_EXECUTION_2026-10-09.md). Next: L2-C content/source/visual review; Public Launch NO GO. **UNKNOWN != PASS.**

## L1 Trust Pages & Footer — 2026-10-09 (PRE-LAUNCH)

- Owner said `ทำเลย` to begin Public Launch **L1 — Trust Pages**. **No Public Launch** or draft article publication authorized.
- **Published About #1 fixed**: old 415-character default WordPress sample paragraph replaced with 4,803-character original HYBRID MIND brand intro, Visual Interactive editorial pillars, source transparency and links to real published posts #52/#55. Readback PASS. Backup: [L1 About original](wordpress/L1_ABOUT_PRECHANGE_BACKUP_2026-10-09.md).
- **Created four standalone WordPress Draft pages** with matching theme blocks, editorial owner-review notes and no invented public contacts: **Contact #67**, **Privacy Policy #68**, **Editorial Policy #69**, **Affiliate Disclosure #70**. WordPress independent edit/view readback PASS, each Draft, comments closed; **not published**.
- **Footer updated** after exact original backup (2,655 chars → 2,843 chars) with **only one link to the corrected Published About page**. Existing four topic links and footer text preserved; no links to unpublished policy Drafts. Readback PASS. Backup: [L1 Footer previous](wordpress/L1_FOOTER_ABOUT_LINK_PRECHANGE_2026-10-09.md).
- **L1 PARTIAL / HOLD:** owner has not supplied authorized Facebook Page URL or public email; user-facing Privacy #68 still requires review of actual Typhoon provider prompt/retention, WordPress/Jetpack/Akismet cookies and data controller contact; policy publication/Footer links require separate editorial authorization. Actual signed-in browser QA still UNKNOWN.
- **Site status independent readback:** `coming_soon / unlaunched`; no posts were published or removed; Header/AI-chat/plugin/SEO settings unchanged.
- [L1 Implementation QA and next gates](releases/L1_TRUST_PAGES_IMPLEMENTATION_2026-10-09.md). Highest rule **UNKNOWN ≠ PASS**.

## Public Launch Readiness V1.0 — PRE-LAUNCH HOLD (2026-10-09)

- **Owner requested planning only.** New [Public Launch Readiness V1.0](releases/HYBRID_MIND_PUBLIC_LAUNCH_READINESS_V1_2026-10-09.md) created. **No WordPress public launch or post publication action performed.**
- Live CMS/Jetpack snapshot: Site `coming_soon / unlaunched`, homepage #16 Published, Assembler, Typhoon Chat v0.2.2 active, `blog_public=0`. AI News category 0 Published; TH-AI Passport Visual Post #57 remains Draft with Featured Image #63. Published #31, #52, #55 plus placeholder `Hello World!` #3.
- **Launch blockers [FAIL]:** Published About #1 still default WordPress sample text; no Contact/Privacy/Editorial Policy/Affiliate Disclosure pages; footer lacks corresponding links; `Hello World!` is publicly publish-status; AI News archive empty despite primary navigation.
- **Unknown/hold:** authenticated responsive matrix on #16/#52/#55/#57; public guest Typhoon safety/privacy/cost, real calculator/quiz interaction, precise source/review of #57 before any publish; backup restore test.
- **Partial technical positives:** Jetpack Backup active, last success Oct 8 18:15; Jetpack Scan latest Oct 8 shows no threats, Jetpack Account Protection on. **Monitor disabled** and `site_icon=0`, `site_logo=0`; comments default open with moderation settings to decide.
- Sequence: L1 trust pages → L2 clean editorial content → L3 browser/mobile Visual QA → L4 guest AI safety or tested content-only fallback → L5 current backup, recovery, SEO and monitoring → L6 owner explicit go/no-go and public cutover. **Recommend no new Visualize Engine features during release preparation.**
- **Owner decision required:** desired public contact channel, whether visitors may use Typhoon on Day 1, whether Draft #57 should publish after content/visual checks, and explicit separate approval before turning off Coming Soon. **UNKNOWN ≠ PASS.**

## Post #57 Cover-Only landing (owner option 2, 2026-10-09)

- Owner chose **Option 2**: on AiPASS 2.0 Visual Draft #57, remove visible white WordPress title panel/gaps and show **full-width original-cover image immediately after Hybrid Mind header**, before the dark interactive lesson. Preserve post title metadata/accessible H1, full image ratio and other posts.
- Inspected Assembler shared `single` template; confirmed initial Spacer + Post Title + forced 4:3 Featured Image are source of white title area/cropping. **Did not modify shared template.**
- Backed up Global Styles ID 2 at **5,496 characters**, [Backup](wordpress/POST57_LANDING_FULL_BLEED_PRECHANGE_CSS_2026-10-09.md). A concurrent change added **`R2-POST57-COVER-ONLY`** CSS before our planned write. Our optimistic guard **stopped without writing**, avoiding duplicate/conflicting CSS.
- **Independent readback PASS:** WordPress CSS **7,682 characters**, preserves the original 5,496-character prefix, with 2,186-character Post #57-only addendum: hide Spacer, visually hide title H1, stretch cover to 100vw, preserve natural image ratio, remove gap before `post-content`, darken white surrounding area.
- Post #57 remains **Draft** with Featured Media #63; interactive code and Pexels photos unchanged; site still **Coming Soon / Unlaunched**. The public unauthenticated fetch receives Coming Soon splash, so **authenticated post-fix Mobile Visual QA UNKNOWN** and Release Gate HOLD.
- [Detailed Cover-Only QA Report](wordpress/POST57_LANDING_FULL_BLEED_COVER_QA_2026-10-09.md). UNKNOWN ≠ PASS.

## AiPASS 2.0 — Cover-only hero replacing white title area (2026-10-09)

- Owner screenshot of Draft Post #57 displayed a large white WordPress title/space around the AI-generated cover. Owner explicitly authorized changing the **white top section to only the cover image**, no visible page title.
- Read Assembler `assembler//single` template to confirm the initial spacer, 800px constrained title/featured-image group and `4/3` featured-image ratio. Reused current Media #63 (**1672×941**; words in image kept).
- Backed up **all previous Global Styles ID 2 custom CSS (5,496 characters)**: [Cover-only prechange backup](wordpress/POST57_COVER_ONLY_PRECHANGE_CSS_2026-10-09.md). Confirmed exact match to live CSS before write.
- Appended **2,186-character scoped CSS patch** `R2-POST57-COVER-ONLY` targeting `body.single-post.postid-57`: hide title **visually** while keeping semantic DOM, remove top spacer and white gutters, widen cover to viewport, show original aspect with `object-fit:contain`, dark navy background to meet embedded interactive page without a white band. No shared theme changes.
- **WordPress independent CSS readback PASS**: CSS now 7,682 chars with exact original prefix. Post #57 remains **Draft**, `featured_media=63`, original post body **62,069 chars**, calculator/quiz/photos/sources preserved. Coming Soon remains `coming_soon/unlaunched`. Header and original article code were not edited.
- **Actual visual result still UNKNOWN** until a signed-in Android screenshot shows the full-width cover/no title/no white panel; the external fetch sees Coming Soon instead of Draft. **R1.2-D visual gate HOLD.**
- [Scoped layout fix and QA report](wordpress/TH_AI_PASSPORT_2_COVER_ONLY_LAYOUT_QA_2026-10-09.md). UNKNOWN ≠ PASS.

## TH-AI Passport 2.0 — Featured Cover uploaded (2026-10-09)

- User requested the newly generated **TH-AI Passport 2.0** cover be uploaded to the existing article. WordPress Media **#63** successfully uploaded: `hybridmind-th-ai-passport-2-cover.png` (**1672×941 PNG**, AI-generated). Media caption/Alt identifies it as editorial AI-generated imagery, NOT a real government press event.
- WordPress Post **#57** updated **Featured Image → Media #63**; independent `posts.get(edit)` readback confirms `status=draft`, `featured_media=63`, `modified=2026-10-09T14:43:11`, content unchanged (62,069 chars), calculator/quiz/source and previous 3 stock photos retained.
- Assembler shared single template still enforces **4:3**. To preserve text on the wide 16:9 cover, backed up Global Styles ID 2 CSS (4,888 chars) and appended a **608-character only-post-57 CSS rule group**, making featured image natural aspect, `object-fit:contain`, max-width 100%. WordPress readback confirms 5,496 chars, with original CSS exactly preserved.
- **Coming Soon remains `coming_soon/unlaunched`**. Post #57 remains Draft. Real authenticated mobile cover appearance is **UNKNOWN** until screenshot; responsive Release Gate is HOLD.
- [Featured Cover QA and backup evidence](wordpress/TH_AI_PASSPORT_2_FEATURED_COVER_QA_2026-10-09.md). UNKNOWN ≠ PASS.

## TH-AI Passport 2.0 — Chromatic typography update (2026-10-09)

- Owner requested more colorful typography on **TH-AI Passport 2.0 Visual Interactive** WordPress **Draft #57**; no public publishing authorized.
- Applied **9 heading-focused inline color spans** and a **1,118-character iframe-scoped CSS text-color patch** using sky-blue, mint, lavender, gold. Accents cover key headlines, metric values, timeline, learning stages, quiz and source labels; original source text remains identical.
- **Prewrite reversible diff PASS**: exact reversal of 9 header spans and appended CSS reproduces prior decoded HTML. Embedded JS, existing 3 Pexels photos, links and CSP untouched. Revision #61 is the WordPress prechange backup.
- WordPress `post-sections.replace` only modified **Post #57 `core/html` section index 0**; independent readback confirms **Draft**, revision #62, modified `2026-10-09T14:33:06`, media/quiz/calculator intact, two source/disclaimer blocks retain prior hashes. Site stays `coming_soon / unlaunched`.
- **Real authenticated mobile Visual QA still UNKNOWN**: WordPress block/source readback does not demonstrate all responsive/computed colors or real calculator and quiz interaction. No Release Gate bypass.
- [Chromatic Typography QA & Rollback](wordpress/TH_AI_PASSPORT_2_COLOR_TYPOGRAPHY_QA_2026-10-09.md). UNKNOWN ≠ PASS.

## TH-AI Passport 2.0 — Real photography added to Draft #57 (2026-10-09)

- Owner requested **real photographic work** inside the existing TH-AI Passport 2.0 interactive WordPress Draft #57 (not publication).
- Chose **three licensed Pexels photographs** instead of AI-generated imitation press-conference images; all source photos credited and labeled as contextual illustrations, not real AiPASS event/participants. Source/license details in [Photography QA](wordpress/TH_AI_PASSPORT_2_REAL_PHOTOGRAPHY_QA_2026-10-09.md).
- Uploaded WordPress Media **#58** (Bangkok professional with laptop), **#59** (office teamwork), **#60** (adult learning). Used WordPress-resized images in: Hero, AiPASS 1.0 vs 2.0 discussion, and AI skills-development section.
- WordPress `post-sections.replace` changed **only Post #57 index 0 `core/html`** with optimistic-lock tokens; two trailing Gutenberg paragraphs retained exact block hashes. Inside its `iframe srcdoc` changed visual nodes and only the `img-src` CSP directive to WordPress/Jetpack allowlist; no interaction script changes.
- **Independent readback PASS**: Post #57 `Draft`, modified `2026-10-09T13:55:00`, 3 `<img>` tags, alt/credit, calculator and quiz markup, source links intact; new Revision #61 exists. Coming Soon `coming_soon/unlaunched` unchanged; no other articles/templates/visibility changed.
- **Browser visual and real interactions still UNKNOWN**: need user-signed-in preview/mobile screenshots to verify image loading, positioning, quiz and calculator. UNKNOWN ≠ PASS. **Do not publish or launch yet.**

## AiPASS 2.0 — Visual Interactive Draft #57 checkpoint (2026-10-09)

- **News Visual Interactive built** for `TH-AI Passport 2.0 — จาก AI Chatbot สู่ AI Agent` using the approved approach: GPT builds complete isolated HTML/CSS/JS, WordPress stores a Draft. **This is NOT a deployed A2A Visualize Engine or Widget-level Typhoon worker.**
- WordPress **Post #57 DRAFT**, slug `th-ai-passport-2-gemini-enterprise-visual-guide`, preview [login required](https://hybridmind.online/?p=57&preview=true). Categories AI News + Explained.
- Interactions: 1.0-vs-2.0 toggle, original-program vs press-conference metrics, timeline, seven-activity 1,000-point calculator, four-item eligibility self-check, 3-question quiz and source cards.
- **News fact split (sources reviewed Oct 9):** TH-AI Passport official `aipass.go.th` confirms **5 million original-program registration target** and learning points; [Bangkokbiznews Oct 9 press report](https://www.bangkokbiznews.com/tech/ai/1255683) gives **500k Gemini Enterprise rights, 1,000-point threshold, Oct 9–Nov 2 applications, Nov 9 activation, up to ten months**. Edition, actual quota remaining and individual eligibility NOT confirmed. Metrics reported from press: **1.57m registered, 745k active, 17.3m prompts**.
- **Readback PASS:** WordPress `posts.get(edit/view)` returns full **55,892-char** Custom HTML block with `iframe srcdoc`, script controller, sources, calculator and quiz. Local source/static checks PASS (JS syntax, CSS parse, anchor uniqueness, no app network code); **Chromium visual runtime testing blocked by environment administrator**, therefore signed-in mobile/desktop responsive/interactions **UNKNOWN**, not PASS.
- No edits to Published Post #55 (AI ERA), Post #52 (game lessons), theme or homepage. **Coming Soon / unlaunched preserved.**
- **Release Gate:** Await actual signed-in Android preview and QA on real inputs; do not publish Post #57 without explicit separate owner approval; Published and Public Launch HOLD.
- [Full QA and next steps](wordpress/TH_AI_PASSPORT_2_VISUAL_DRAFT_QA_2026-10-09.md). UNKNOWN ≠ PASS.

## HYBRID MIND VISUALIZE ENGINE — strict Widget Worker boundary (owner clarification)

- **Highest design constraint:** the Website Agent/Typhoon does **not** have independently verified planning or autonomous error-prevention criteria. **Do NOT delegate planning, risk assessment, editorial decisions or scope expansion to it**.
- **1 REQUEST = 1 WIDGET.** Main ChatGPT Agent owns storyline, sources, component selection, instruction, positioning and review. Typhoon only generates **one** bounded declarative WidgetCandidate for the specifically requested ID and slot, or returns an error. No unsolicited second box.
- **Security authority is outside the model:** deterministic Backend validates request and result, immutable ID + Draft slot, schema, permissions, versions, size limits, external action denial and isolation. Trusted renderer owns event/state handlers. Typhoon does not self-validate or self-approve.
- Failure or missing input must return an error, not invent instructions. **No autonomous Website Worker actions, model-authored live JS, changes to other Widgets, publication or transactions.**
- This **Widget-Level Visualize Engine V0.1** is distinct from the earlier whole-article visual-first A2A Draft prototype (#54) and from the published iframe-based lesson Post #55. Neither is evidence that Widget Request API, Validator/Renderer or Sandbox exists.
- [Updated Widget-Level Architecture and strict boundary](visualize-engine/V0.1_ARCHITECTURE_LIMITS_PLAN_2026-10-09.md); [source-grounded Widget Inventory](visualize-engine/V0.1_WIDGET_INVENTORY_2026-10-09.md).
- **Gate:** Architecture clarification recorded; backend enforcement and negative tests NOT IMPLEMENTED. WordPress Production remains unchanged. UNKNOWN ≠ PASS.

## VISUAL-FIRST A2A PUBLISHING — Prototype checkpoint (2026-10-09)

- Strategic product direction: **Every Hybrid Mind article is a visual-first knowledge experience generated through A2A agent roles**, not manually decorated Gutenberg prose. Gutenberg is the storage/rendering output, not the user's editing workflow.
- Registered a **Visual Article Manifest contract**: [A2A Architecture](architecture/VISUAL_FIRST_A2A_PUBLISHING_V0.1.md), [JSON Schema](../contracts/visual-article-v1.schema.json), [deterministic renderer](../tools/visual_article/render_gutenberg.mjs), [responsive CSS kit](../tools/visual_article/visual-article.css), [smoke tests](../tools/visual_article/test_renderer.mjs), and [sample manifest](../examples/ai-game-tools.visual-article.json).
- Created independent **WordPress Draft #54** (`visual-pilot-ai-game-tools`) using owner-authored article #52 as a read-only source. Server readback **PASS** for 15 visual/narrative modules, owner image Media #51, and all original 63 paragraphs. Original published Post #52 remains unchanged.
- **Important:** Reusable JavaScript renderer/CI unit tests were committed but not executed on a Node runner in this turn; future execution/CI gate is UNKNOWN. WordPress Draft was generated via the corresponding typed-manifest-to-Gutenberg mapping in this session.
- WordPress remains `coming_soon / unlaunched` with Assembler; no sitewide Visual Article stylesheet has been deployed, no unpublished article was published, no existing public page overwritten.
- **A2A unattended automation NOT DEPLOYED:** no A2A protocol endpoint, queue, trigger schedule, secret-backed WP Draft-publisher or publish role configured. Next is validate preview and runtime, implement least-privileged **Draft-only** publisher, then agree cadence and enable after owner review.
- Visual-First QA status: CMS Draft save/readback PASS; authenticated mobile/desktop visual preview UNKNOWN; editorial and Public Launch HOLD. UNKNOWN ≠ PASS.
- [Implementation Handoff / WP Draft #54](architecture/VISUAL_ARTICLE_A2A_IMPLEMENTATION_STATUS_2026-10-09.md).

## R1.2-D mobile long-answer fix / v0.2.2 pending — 2026-10-09

- User Android screenshot shows **nested scroll problem**: long Typhoon answers confined to 44vh feed while parent page also scrolls; JavaScript still calls feed.scrollTop and refocuses textarea after reply.
- Live WordPress Global Styles ID 2 scoped `.hm-ai-hero` CSS adjusted at <=781px to `height:auto !important; max-height:none !important; overflow:visible !important` with initial `min-height:clamp(128px,22dvh,220px)`. Original 3,820-character CSS backed up; final 4,246-character CSS read back; only new 426-character scoped rule appended.
- **Typhoon Chat v0.2.2 candidate ZIP BUILT**: mobile avoids inner-scroll / input refocus, scrolls outer document to beginning of AI answer, shortens footer note to `คำตอบอาจผิดพลาดได้`. Candidate ZIP SHA256 `6e3346241dc70e1c429217109ae00a8e8f1d6d7e59f792505dfa51ad8870cb47`. Local PHP/JS/mocks and Chromium component-only 320/375/390/768/1280 tests PASS.
- **PRODUCTION PLUGIN REMAINS v0.2.1 at last check.** Existing API key/model/site options not changed. To complete UX fix the owner must upload v0.2.2 ZIP with WordPress **Replace current with uploaded**; do not delete v0.2.1 first.
- Browser/screenshots after CSS and v0.2.2 installation **UNKNOWN**; **R1.2-D = PARTIAL / HOLD**. Keep Coming Soon / unlaunched and public guest gate unchanged.
- Evidence: [R1.2-D Mobile Long Reply / Single Scroll Report](wordpress/R1_2_D_MOBILE_LONG_REPLY_SINGLE_SCROLL_2026-10-09.md) and [CSS Prechange Backup](wordpress/R1_2_E_CHAT_SINGLE_SCROLL_CSS_BACKUP_2026-10-09.md).

## Post #52 featured infographic crop fix — 2026-10-09 (LATEST)

- The owner shared an actual Android screenshot of the post #52 AI game-development infographic with its top banner text cropped.
- Root cause identified at **source-template level**: Assembler `assembler//single` forces the shared featured image block's aspect ratio to **4/3**, while image #51 is **1536×1280 (6:5)**.
- With owner authorization, backed up exact WordPress Global Styles ID 2 custom CSS (4,246 characters) in [Prechange Backup](wordpress/POST52_FEATURED_IMAGE_PRECHANGE_2026-10-09.md); reread and verified the backup matches before writing.
- Appended **post-specific** `body.single-post.postid-52 figure.wp-block-post-featured-image` and `img` CSS to restore `aspect-ratio:auto`, `object-fit:contain`, `height:auto`, `max-width:100%`. No other posts, theme templates or post content altered.
- **Readback PASS:** Global CSS 4,888 characters; original 4,246 bytes preserved as exact prefix and only 642-character focused patch appended. Public HTML `<head>` includes CSS, although unauthenticated page body remains Coming Soon.
- Post #52 remains Published with featured image #51; post #31 GS20 unchanged; Assembler still active; Coming Soon `coming_soon/unlaunched` unchanged.
- **Visual after screenshot: UNKNOWN.** Must collect signed-in new Android screenshot showing complete infographic title and bottom, or inspect authenticated computed aspect ratio before closing repair. Do not call R1.2-D finished based on CSS readback alone.
- [Repair and QA Evidence](wordpress/POST52_FEATURED_IMAGE_QA_2026-10-09.md). UNKNOWN ≠ PASS.

## Editorial publication — AI Game Development Tools (2026-10-09 LATEST)

- Owner supplied an original long-form Thai essay and infographic on using the right AI development tools for games (plain code, Godot, Unreal Engine, Blender); approved direct addition to Hybrid Mind.
- **WordPress Post #52 PUBLISHED**: [บทเรียนจากการสร้างเกมด้วย AI: AI เก่งแค่ไหน ก็ต้องใช้เครื่องมือให้ถูกงาน](https://hybridmind.online/2026/10/09/ai-game-development-right-tools-godot-unreal-blender/).
- Assigned the existing **Explained** category (`26694708`). Text preserved with 6 numbered H2 sections plus conclusion (7 H2 in total), 63 paragraphs, source hashtags retained, and no affiliate links added.
- **Featured Image #51** uploaded from owner's infographic, using the correct JPEG MIME despite the incoming attachment's `.png` filename. WordPress image ID and URL: `51`, `https://hybridmind.online/wp-content/uploads/2026/10/hybridmind-ai-game-development-tools-lessons.jpg`. Set descriptive Thai alt text. Single-post Assembler template displays featured media; image not duplicated inside the article body.
- Post creation and independent readback **PASS**: Published, title/sections/conclusion preserved, image 51 attached, server-side rendered content present. Homepage #16 query now includes the article.
- **Typhoon Chat v0.2.2 ACTIVE** verified after user's plugin update. Admin-only Website Knowledge Preview for related Godot/AI game development queries returns published Post #52 as a source. A real end-to-end bot answer to these prompts remains UNKNOWN until independently observed. Search sometimes also returns GS20 as a less-relevant source; relevance improvements remain backlog.
- **Coming Soon remains enabled**; WordPress Published does not imply the page is available to logged-out visitors. No Public Launch or theme changes.

## R1.2-E long-answer scrolling / Typhoon v0.2.2 candidate (2026-10-09 LATEST)

- Owner reports that long Typhoon answers are clipped inside a separately scrollable chat feed. Previous request: shorten the disclaimer to `คำตอบอาจผิดพลาดได้` and make the initial mobile chat fit naturally.
- An existing CSS read from WordPress Global Styles ID 2 contained a **concurrent `R1.2-E-01` mobile fix** (`max-height:none!important; overflow:visible!important`; most recent breakpoint 781px). Original 3,820-character CSS was snapshotted BEFORE the concurrent change. **This agent ABORTED its live CSS write on mismatch and did not overwrite the new change.** CSS on site most recently 4,246 characters; signed-in mobile visual retest UNKNOWN.
- Built `hybridmind-typhoon-chat-v0.2.2.zip` as an **optional manual plugin update** that permanently makes the message feed auto-height with one normal page scrollbar at all sizes, avoids autofocus jumps after long answers on mobile, uses a compact first-visit feed and sets the visible note to exactly `คำตอบอาจผิดพลาดได้`.
- v0.2.2 **LOCAL QA PASS** (PHP, JS, WordPress/knowledge mocks, Chromium fixture at 320/375/390/768/1280 CSS px, ZIP integrity). SHA256: `f8b49165f00bd0257e3d5b768ea069cab17874fd8f3a0e36d753c1c811f90c8d`.
- Latest WordPress plugin check still reports **v0.2.1 ACTIVE**, so **V0.2.2 PRODUCTION INSTALL and END-TO-END VISUAL QA UNKNOWN**. Keep existing API key and site settings, do not delete plugin before replacement.
- **Privacy release gate:** single-line note is not a substitute for a clear website Privacy Policy disclosing transmission to Typhoon. Public Launch/guest chat remain HOLD and `coming_soon/unlaunched` must stay unchanged.
- Evidence and upgrade guide: [Typhoon v0.2.2 Long Answer UX](wordpress/TYPHOON_V0_2_2_LONG_ANSWER_UX_2026-10-09.md) and [R1.2-E CSS prechange backup](wordpress/R1_2_D_03_CHAT_SCROLL_PRECHANGE_2026-10-09.md). UNKNOWN ≠ PASS.

## R1.2-D-01 CSS fix applied — 2026-10-09 (LATEST)

- **Explicit owner approval** received to fix exactly two AI Hero typography declarations with `!important`: submit button 16px; chat note 13px. No theme or plugin code changes.
- **Original Global Styles ID 2** CSS was 3,798 characters, saved exactly to [Prechange Backup](wordpress/R1_2_D_01_CSS_PRECHANGE_BACKUP_2026-10-09.md) before write; verified against WordPress before saving.
- Targeted `global-styles.update` succeeded. **Independent readback PASS**: WordPress CSS 3,820 characters, changes reversible to identical original by undoing exactly two declarations; updated CSS is present in the public HTML `<head>`.
- Page #16 still Published with 18 Gutenberg sections, Typhoon shortcode present, Assembler unchanged, Coming Soon `coming_soon / unlaunched` unchanged.
- **R1.2-D-01 fixed at code/config level; actual computed CSS and viewport appearance UNKNOWN**, because external browser gets Coming Soon and no signed-in five-width screenshot test is available. **R1.2-D remains PARTIAL / HOLD**; do not advance Release Gate.
- Evidence: [R1.2-D Responsive/Visual QA — latest fix](wordpress/R1_2_D_RESPONSIVE_VISUAL_QA_2026-10-09.md). Historical “fix not applied” lines in older sections remain background, superseded by this checkpoint.

## R1.2-D QA checkpoint — 2026-10-09

- **R1.2-D = PARTIAL / HOLD**, not release-ready. Actual Android screenshots show chat works and text/bubbles/button fit the sampled viewport, but no verified five-width signed-in viewport/keyboard/menu/footer matrix yet.
- Live WordPress.com readback: page #16 Published (modified `2026-10-09T08:49:54`), 18 Gutenberg sections, Typhoon shortcode active, four categories and GS20 rendered, Global Styles ID 2 responsive CSS 3,798 characters. Theme Assembler unchanged. Site remains `coming_soon` / `unlaunched`.
- **Lighthouse caveat:** Mobile PageSpeed returned 91 Performance / 95 Accessibility / 100 Best Practices / 66 SEO, but public URL served the **WordPress.com Coming Soon splash**, not the authenticated homepage. Its missing `main` landmark finding applies to splash; Assembler page template has a `<main>`. Scores MUST NOT be cited as homepage layout QA.
- **Code-level R1.2-D-01 FAIL:** Shipped Typhoon v0.2.1 CSS has `font-size:14px!important` for Send and `12px!important` for note, overriding the site's intended 16px/13px scoped non-important rules. Isolated Chromium component fixture reproduced this at 320/375/390/768/1280; production computed styles remain UNKNOWN. Correction proposed but **NOT APPLIED** in QA-only round (requires owner approval for site-wide Global Styles write).
- Structural accessibility markup review PASSED for 1× H1 with H2/H3 subsections, textarea label/ID, alt on GS20 article card, valid internal #hm-explore anchor, registered navigation links. Full browser/screen-reader QA UNKNOWN.
- Four category URLs exist; `ai-news` archive currently has zero articles (editorial content gate, not a URL failure).
- **R1.2-D evidence:** [Responsive and Visual QA Report](wordpress/R1_2_D_RESPONSIVE_VISUAL_QA_2026-10-09.md). The screenshots remain in the ChatGPT conversation, not public GitHub.
- **Next:** Explicit approval for minimal scoped CSS fix, then authenticated screenshots and interaction results at 320/375/390/768/1280 CSS px, keyboard/menu/footer and primary CTA tests. Do not open Public Launch or claim R1.2 PASS until gates close.

## Latest V0.2.1 production verification — 2026-10-09

- **Typhoon Chat v0.2.1 ACTIVE in WordPress production** (verified independently from WordPress.com and WPVibe; supersedes historical V0.1/V0.2 checkpoints below).
- Android screenshots at ~09:54 show `หาแว่น` now receives a Thai answer and displays **home + GS20 source links**; safe headings/bold/bullets render. Tap-through of links not yet tested.
- WordPress Knowledge API **12/12 tests PASS**: `แว่น`, `หาแว่น`, `ช่วยหาแว่น`, `แว่นฟังเพลง`, `อยากได้แว่นราคาถูก`, `Gs20`, `GS20` all return GS20; `G20`, two external breaking-news phrasings, draft-only `HUAWEI Eyewear 2`, and `Hello World!` yield no false content.
- **Known follow-up:** for broad `หาแว่น`, generic homepage ranks above specialist GS20 article. Improve retrieval score ordering later. Do not mark live-news search as available.
- **Gate:** Installation / basic Thai retrieval / one mobile answering screenshot PASS. Public guest abuse and rate/cost QA, clickable source click-through, product claim verification and full responsive/browser matrix UNKNOWN/HOLD.
- Site remains **Coming Soon/unlaunched**; separate Public Launch authorization still required.
- Evidence: [Typhoon v0.2.1 report (latest production section)](wordpress/TYPHOON_V0_2_1_THAI_SEARCH_PATCH_2026-10-09.md).

## Latest execution checkpoint — 2026-10-09 (R1.2)

- WordPress site 257844857 / https://hybridmind.online remains **Coming Soon / unlaunched**; Assembler theme still active.
- Homepage #16 is Published and now embeds **Hybrid Mind — Typhoon Chat v0.1.0** through `[hybridmind_typhoon_chat]`. The previous AI Engine chatbot shortcode was removed from the homepage; AI Engine plugin remains installed.
- Owner-provided Android screenshot before R1.2 showed a successful Thai prompt-and-response on the homepage (a one-message smoke-test PASS, not full system QA).
- R1.2 mobile layout work: removed the extra white Gutenberg chat wrapper and redundant caution; adjusted concise copy; applied carefully scoped custom CSS through WordPress Global Styles ID 2 to improve mobile typography, chat input/button sizing and one-column visual topic cards.
- **R1.2 = PARTIAL / HOLD**: after the first responsive update, the owner's Android screenshot at ~08:55 confirms the redundant wrapper disappeared and the input/send UI is legible, but exposes excessive blank chat-feed height. A further mobile-scoped CSS adjustment (Global Styles ID 2, now 3,798 characters) was saved and reread; **visual retest of that adjustment, sending a message after the change, other viewport sizes, and public/guest QA remain UNKNOWN**.
- Published GS20 article #31 remains accessible to signed-in site owners; original Smart Glasses Hub #17 and explainer post #18 remain Draft. No affiliate product links were added.
- Evidence: [R1.2 Mobile Visual QA](wordpress/R1_2_MOBILE_VISUAL_QA_2026-10-09.md) and [Hero Prechange Snapshot](wordpress/R1_2_HERO_PRECHANGE_2026-10-09.md).
- Do not proceed to public launch or claim R1.2 PASS without actual postchange browser screenshots and interaction checks.

## Latest plugin build — Typhoon Website Knowledge v0.2.0 (2026-10-09)

- A new **installable ZIP** for Hybrid Mind — Typhoon Chat **v0.2.0** was built in the project conversation. It is **NOT INSTALLED ON WORDPRESS YET**; the site still reported **v0.1.0 active** at the last connector read.
- V0.2 includes read-only published WordPress site-content retrieval at question time, explicit Hybrid Mind brand identity, verified same-site source links under AI answers, and safe DOM-only Markdown formatting.
- PHP lint, JS syntax check, WordPress retrieval mocks, Typhoon HTTP mocks, DOM rendering mocks and ZIP integrity: **PASS locally**. Live provider behavior: **UNKNOWN** until ZIP replacement and authenticated smoke testing.
- SHA256 ZIP: `04ec7a50374d64c545cbdbefb5520a75ee0c13f116c1ad2bd37a949cd0915c5a`; retain the existing slug `hybridmind-typhoon-chat` and site settings option. No API credentials are in the package.
- [V0.2 implementation and installation gate](wordpress/TYPHOON_WEBSITE_KNOWLEDGE_V0.2_2026-10-09.md). User must upgrade via WordPress Plugin Upload → **Replace current with uploaded**; do not delete v0.1 first. Preserve Typhoon API Key and leave public chat disabled while testing.
- This feature reads the **site's already published content**, **not** external live news/internet sources, drafts or private pages. External search is a separate future milestone.
- Do not mark v0.2 production PASS or open Coming Soon until live tests and the separate release approval.

## Production verification — Typhoon v0.2.0 (2026-10-09)

- WordPress.com and WPVibe independently verified **Hybrid Mind — Typhoon Chat v0.2.0 ACTIVE**.
- Admin-only Website Knowledge endpoint: enabled, published WordPress posts/pages only, 3 sources max, configured; **no external live-news search**.
- Published GS20 post #31 and homepage #16 returned as real sources. Draft #17 and #18 excluded in tested cases, default Hello World excluded in tested case.
- Owner's Android screenshot at ~09:23 shows GS20 search QA result. Actual v0.2 Typhoon response with clickable references and safe Markdown **still UNKNOWN**.
- Negative relevance: 'ข่าว AI ล่าสุดวันนี้' returns broader website content (GS20 and homepage) rather than verified real-time news. Must not claim external search.
- **Gate:** v0.2 install/search PASS; model-response-grounding, Markdown UI, mobile UX and guest/security QA HOLD/UNKNOWN. Site stays Coming Soon.
- Evidence: [Typhoon V0.2 Production QA](wordpress/TYPHOON_V0_2_PRODUCTION_QA_2026-10-09.md).

## Typhoon Chat v0.2.1 Thai retrieval patch — 2026-10-09

- Owner screenshot QA 09:29–09:31: `Hybrid Mind คืออะไร` correctly recognizes brand, `Gs20` finds evidence and uses [1], `G20` does not incorrectly match, but **`หาแว่น` failed** and `แว่น` lacked grounded results.
- Live v0.2 WordPress knowledge-preview reproduced `แว่น` / `หาแว่น` = zero results, while `แว่นตา` and `GS20` matched. `ข่าว AI ล่าสุดวันนี้` incorrectly returned GS20/homepage instead of dated news.
- Root cause VERIFIED in plugin code: old tokenizer `/[^\\p{L}\\p{N}]+/u` drops Unicode category **Mark (M)** and splits Thai tone-marked words incorrectly.
- Built **v0.2.1 plugin ZIP** with corrected Thai Unicode tokenization, natural-language request prefixes, news category/freshness filter, safe on-site Markdown hyperlinks and stricter seller-claim instructions. SHA256: `a96f195e6a447217f7b159d9f56844da2b15cfed31ea2014c7450ee6cfdf1505`.
- **Local PHP, mock Typhoon, JS, ZIP integrity tests PASS.** WordPress still reported **v0.2.0 ACTIVE** at last check: **V0.2.1 NOT DEPLOYED; production QA UNKNOWN**.
- Upgrade by plugin ZIP **Replace current with uploaded**, preserving `hybridmind_typhoon_settings` (contains API key). Never delete plugin first or share API Key. Then run search/admin and real-chat tests before PASS.
- Evidence: [Typhoon v0.2.1 bugfix / test report](wordpress/TYPHOON_V0_2_1_THAI_SEARCH_PATCH_2026-10-09.md).
- No theme or site launch change. External live-web search remains unimplemented; Coming Soon remains HOLD.

## Assets and roles

| Surface | Verified link | Role | State |
|---|---|---|---|
| WordPress | https://hybridmind.online | Production content and CMS | Coming Soon / unlaunched |
| GitHub | https://github.com/nustanakritwithai/HybridMind- | Specs, versioned frontend previews, non-secret code | Initialized |
| Google Drive | https://drive.google.com/drive/folders/1r4Lqzr3KXhqLQvGjzMys0y-jtn0gTFXr | Project asset workspace | Folder and Project Control Google Doc created |

**Do not treat GitHub Pages preview as WordPress production.**

## WordPress connector-confirmed baseline

- Site blog ID: `257844857`; theme: Assembler; timezone: Asia/Bangkok.
- Existing Hello World post (#3) and default About page (#1) left unchanged.
- Initial draft pages (#6, #8, #10, #12, #14) left unchanged.
- Categories:
  - News: `ai-news` ID 26694707
  - Explained: `explained` ID 26694708
  - Future Lifestyle: `future-lifestyle` ID 26694709
  - Smart Buying: `smart-buying` ID 26694710
- **Published static homepage:** WordPress page **#16**; front-page reading setting points to ID 16.
- New Smart Glasses Hub: draft page **#17**, slug `smart-glasses`.
- New explainer draft: post **#18**, slug `audio-glasses-vs-ai-glasses`.
- WordPress site title = **HYBRID MIND**, tagline = **Live Smarter. Live Future. — เข้าใจ AI และใช้ชีวิตให้ทันอนาคต**.
- Navigation post **#4** and Assembler `header` / `footer` parts updated and read back; original markup preserved in `docs/wordpress/ASSEMBLER_PRECHANGE_2026-10-09.md`.
- Theme Assembler unchanged; **Coming Soon remains enabled**; public launch still blocked pending owner approval.
- Existing plugins include AI Engine, Uncanny Automator, Gutenberg, Jetpack, Akismet, WordPress Agent and Page Optimize. Connector did not verify their internal automation settings.
- Latest backup at read time: 2026-10-08 18:15:15; backup succeeded, restore not tested.

## Release priorities

**P0 — Editorial foundation**
- [x] Confirm WordPress credentials via connected WordPress.com tools.
- [x] Create four core editorial categories.
- [x] Created homepage #16, Smart Glasses #17 and explainer #18. GS20 article #31 was separately published with owner approval; #17 and #18 remain Draft.
- [ ] Review actual Gutenberg rendering in authenticated preview.
- [ ] Create original brand imagery and site logo with rights cleared.
- [ ] Create editorial policy, About, Contact, Privacy and Affiliate Disclosure.
- [x] Configure static homepage, navigation and brand header/footer after explicit approval.
- [ ] Enable public launch only after approval and QA.

**P1 — Content readiness**
- [ ] Verify official sources/specs for recommended smart glasses.
- [ ] Confirm Shopee Affiliate approved channel, links, prices, returns and commissions.
- [ ] Prepare verified buying-guide launch article and images.
- [ ] Configure analytics and outbound-click measurement.

**P2 — AI newsroom**
- [ ] Review AI Engine & Uncanny Automator settings in a safe environment.
- [ ] Introduce article-state pipeline: DISCOVERED → VERIFIED → DRAFTED → REVIEWED → APPROVED → PUBLISHED.
- [ ] Test drafting workflow with restricted WordPress role.
- [ ] Apply source evidence and no duplicate-content rules.

## Gate: UNKNOWN ≠ PASS

- A completed draft is not an approved story.
- A model-generated product image is not a true product photograph.
- Shopee product-listing presence is not live stock or affiliate program approval.
- No passwords, API keys, account tokens, customer data or unpublished personal contact details in this public repository.
- Don't publish a WordPress page or alter site-wide templates/settings without direct instruction.
- Link to a GitHub Pages preview only after confirming it is actually accessible.

## Next step

Perform post-R1.2 signed-in Android and desktop viewport QA (chat readability, keyboard, submit/scroll, cards and footer); collect screenshots and fix observable issues. Do not mark R1.2 PASS until real-device checks pass. Smart Glasses Hub #17 and explainer #18 remain drafts. Public launch is a separate deliberate owner approval.
