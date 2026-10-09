# HYBRID MIND — Typhoon AI homepage switchover / R1 QA evidence

**Date:** 2026-10-09 (Asia/Bangkok)  
**Target:** WordPress.com Atomic `257844857`, `https://hybridmind.online/`  
**Rule:** UNKNOWN ≠ PASS

## What was independently verified
- Owner provided an authenticated desktop browser screenshot of the **Typhoon AI** chat widget displaying a submitted Thai message (`ดีครับ`) and a Thai AI reply. This is evidence of at least one successful real-world round-trip on the tested page/browser. It does not prove unauthenticated visitors work, uptime, accuracy or limits.
- WordPress plugin inventory: **Hybrid Mind — Typhoon Chat 0.1.0** active; AI Engine 3.8.4 still active but no longer embedded in homepage hero.
- Before modification: Published homepage #16 contained exactly one AI Engine shortcode, `[mwai_chatbot ...]`, inside section 0 `core/group`; QA draft #32 contained `[hybridmind_typhoon_chat]`.
- Replaced **only** that specific old shortcode inside top-level Gutenberg section 0 of homepage #16 using `page-sections.replace` with optimistic locking (modified/content hash/block hash). No other Gutenberg Hero markup intentionally changed.
- WordPress mutation success: homepage modified `2026-10-09T08:31:05`; saved block content hash `61afdfd7e39377a4dde8dde31e2929fe07ca6561`. No content warnings reported.
- Independent readback of page #16 (both edit and rendered view):
  - `[hybridmind_typhoon_chat]` present and renders the Typhoon chat interface; `mwai_chatbot` absent from homepage;
  - published status; dynamic latest-posts query remains; all four category links retained;
  - same 18 top-level sections; `hm-explore` and `hm-smart-picks` anchors intact;
  - Assembler theme unchanged; WordPress site remains `coming_soon` / `unlaunched`.

## PASS / UNKNOWN / HOLD
| Item | Gate |
|---|---|
| Plugin installed and active | PASS |
| User screenshot of Thai question and answer on tested page | PASS (single authenticated test) |
| Homepage shortcode replacement and WordPress readback | PASS |
| Homepage native browser send / response after replacement | **UNKNOWN** (owner should refresh homepage and retest) |
| Unauthenticated guest ability, anti-abuse controls, sustained quota | **UNKNOWN / HOLD** |
| Production mobile and desktop visual QA after replacement | **UNKNOWN** |
| Site public launch | **HOLD**, no approval given; no visibility changes |

## Next test
1. While signed in, visit `https://hybridmind.online/`, force-refresh, and send a short Thai question to **the homepage** Typhoon widget.
2. Verify the response, mobile keyboard, button, scroll behavior, loading/error state, and privacy notice. Send new screenshot with observed result.
3. Keep public chat disabled during test until intentional gate: provider terms/data handling, guest abuse prevention and billing caps, privacy and rate-limit review.
4. Public site launch is independent; do not change Coming Soon without separate owner approval.

Prior records:
- [WordPress homepage design implementation](HOME_AI_VISUAL_PORTAL_2026-10-09.md)
- [Typhoon plugin implementation](TYPHOON_DIRECT_V0.1_2026-10-09.md)
