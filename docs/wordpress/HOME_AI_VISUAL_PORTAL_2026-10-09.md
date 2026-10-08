# HYBRID MIND — Visual AI Portal Homepage Implementation / QA

Date: 2026-10-09 (Asia/Bangkok)  
Environment: WordPress.com Atomic, site ID `257844857`  
Production CMS: https://hybridmind.online/  
WordPress page: `16`, slug `hybrid-mind-home`, `status=publish`  
Theme: `Assembler` (`assembler`)  
Release rule: **UNKNOWN ≠ PASS**  
**Current decision: CMS IMPLEMENTATION PASS / LIVE CHAT FUNCTIONAL QA UNKNOWN / VISUAL MOBILE-DESKTOP QA UNKNOWN / PUBLIC LAUNCH HOLD**

## Requirement

Owner requested (1) chatbot AI in the topmost content zone of the homepage, replacing previous oversized text-only Hero; (2) a much more visual website, with an app-like, modern AI lifestyle presentation.

## Implementation

1. Existing plugin `AI Engine` version `3.8.4` was found **active**. No plugin installation or theme change.
2. Draft QA sandbox created as WordPress page `32`: `hm-ai-chat-qa-test`, **DRAFT**. Its `core/shortcode` block with `[mwai_chatbot id="default"]` was successfully rendered by the WordPress.com content read API into a `mwai-chatbot-container`. Tested plugin shortcode overrides for Thai greeting, Thai message input placeholder, Send/Clear labels, and Hybrid Mind AI name; the resulting `data-params` reflected those changes.
3. Built visual Hero with Gutenberg `core/group` and native blocks: dark blue gradient, cyan label, compact H1 “ถาม AI แล้วเข้าใจโลกใหม่”, real inline AI Engine chatbot rendered in a light panel, example-question text (NOT a fake button), a caution that AI responses can be wrong, and real links to `ai-news` and `#hm-explore`.
4. Replaced only Homepage page `16`, top-level section `0`, with QA-tested Hero via `page-sections.replace`, using optimistic-lock tokens to protect against concurrent edits. Production page modified at `2026-10-09T04:46:22`.
5. Replaced two existing `core/columns` sections at indices `4` and `5` to improve visual storytelling with four colorful, mobile-stacking topic cards (AI News, Explained, Future Lifestyle, Smart Buying). Links target the four existing WordPress categories. No new fake categories or fabricated statistics.
6. Preserved Header/Footer, Navigation #4, dynamic latest article query, Smart Buying feature area, editorial principles, other sections, theme and site visibility.
7. Post-edit readback modified timestamp `2026-10-09T04:47:50`, still 18 top-level sections. Frontend-rendered content returned a real AI Engine chatbot container, the Hero gradient, all four category destinations, `#hm-explore`, `#hm-smart-picks`, the GS20 recent article and its featured image.

## Verified by WordPress connector

| Check | Result |
| --- | --- |
| Theme `assembler` unchanged | PASS |
| Homepage #16 still published, canonical / | PASS |
| Hero contains registered Gutenberg `core/shortcode` with `mwai_chatbot` | PASS |
| Shortcode expands to `mwai-chatbot-container` on WordPress server render | PASS |
| Thai greeting and placeholder appear in plugin-rendered chatbot parameters | PASS |
| Hero dark gradient and chat panel present in rendered markup | PASS (markup, not screenshot) |
| Four colorful topic cards with genuine category URLs | PASS (markup) |
| Existing article query shows GS20 with an uploaded image | PASS (server render) |
| All 18 top-level homepage sections preserved | PASS |
| Smart Buying and Explore anchors preserved | PASS |
| Coming Soon and unlaunched state | PASS |
| Chat actually returns responses from the AI provider | **UNKNOWN** |
| AI Engine provider API credentials / chosen model / rate limits | **UNKNOWN** |
| Chat API security / cost controls / guest permissions / abuse resistance | **UNKNOWN** |
| Responsive behavior on Android and desktop browsers | **UNKNOWN** |
| Visual overflow, contrast, tappability, keyboard and screen-reader QA | **UNKNOWN** |
| Public launch | **HOLD**, no permission to change |

## Brand AI behavior before launch

Use the AI Engine dashboard to configure its chatbot instructions explicitly:
- Represent Hybrid Mind as a Thai-language modern AI lifestyle educational media brand; explain tech clearly.
- Put accurate knowledge before promotion; distinguish confirmed facts, manufacturer claims, and unknowns.
- Never invent current news, sources, model capabilities, device features, stock, prices, warranty, Shopee commissions, or claimed physical product tests.
- Do not claim to have live search unless the bot actually has a verified retrieval/search tool.
- Inform readers that generated responses can be wrong and may be processed by an external AI provider, with policies established before public access.
- Set explicit daily/guest usage and spending limits and test error behavior before public release.

Official plugin setup: https://meowapps.com/ai-engine/tutorial/

## R1 / R4 follow-up acceptance checklist

1. While logged into WordPress, open `https://hybridmind.online/` and capture after-change Android screenshots of header, Hero + chat, menu open, 4 topic cards, latest article, and footer.
2. Test widths 320, 375–390, 768 and 1280 CSS pixels. Check wrapping, no horizontal scrolling, typing field focus, inline chat height, keyboard overlap and send/clear actions.
3. Send 3 live chat prompts covering AI basics, current AI news (must say unknown unless source-backed), and GS20 translation claims (must note unverified) and document responses/errors.
4. Confirm provider key/model and costs inside AI Engine without disclosing secrets in GitHub or chat. Establish rate limiting for guests and a publication-ready privacy notice.
5. If any defect occurs, patch the minimum Gutenberg block and rerun screenshot/readback.
6. Do not change Coming Soon or mark the public launch gate passed based on rendered block data alone.

## Safety and rollback notes

- QA test page #32 intentionally remains **Draft**. It is a sandbox, not an approved page for public navigation.
- Pre-existing content, site settings, categories, and theme remain in place.
- Changes were made through targeted block replacements; no deletes, auto-publication of drafts, model credentials, theme or site visibility writes.
- Restore rehearsal is **UNKNOWN**. If a rollback is needed, inspect WordPress page revisions before restoring; do not assert a validated rollback exists.

This report distinguishes CMS-rendered widget existence from actual successful model completion and viewport QA.
