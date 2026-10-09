# Hybrid Mind — Project Control V0.1

**As of:** 2026-10-09 (Asia/Bangkok)  
**Project:** Hybrid Mind · Modern AI Lifestyle Media / Shopee Affiliate

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
