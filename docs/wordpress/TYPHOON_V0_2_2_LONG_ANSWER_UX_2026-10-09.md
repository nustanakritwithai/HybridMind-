# HYBRID MIND — Typhoon Chat v0.2.2 Long Answer UX / Mobile QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Project:** https://hybridmind.online / WordPress.com Atomic site ID `257844857`  
**Rule:** UNKNOWN ≠ PASS  
**Live WordPress plugin at last check:** **Typhoon Chat v0.2.1 ACTIVE**, site remains `coming_soon/unlaunched`.  
**New candidate ZIP:** `hybridmind-typhoon-chat-v0.2.2.zip` in ChatGPT conversation artifact (NOT yet installed).  
**SHA256:** `f8b49165f00bd0257e3d5b768ea069cab17874fd8f3a0e36d753c1c811f90c8d`.

## User request & observed symptom
User-provided mobile screenshots show Thai long-form replies cut inside a fixed-height embedded chat message feed, forcing **two independent scrolling areas** (inside reply + full document). They also requested a short one-line note (“คำตอบอาจผิดพลาดได้”) and a compact first-visit chat that fits a mobile viewport.

## Concurrent live CSS edit — preserved, not overwritten
Before any live CSS write, Global Styles ID 2 was backed up in [R1_2_D_03_CHAT_SCROLL_PRECHANGE_2026-10-09.md](R1_2_D_03_CHAT_SCROLL_PRECHANGE_2026-10-09.md) (exact 3,820-character CSS; Git commit `59177ccdf75d6d410ae89b381faab8169f66ec22`).

When a guarded write was about to run, WordPress CSS no longer matched that backup: the live CSS had grown to 4,246 characters with a newly appended **R1.2-E-01** rule to make the mobile feed `height:auto!important;max-height:none!important;overflow:visible!important`, with a minimum height `clamp(128px,22dvh,220px)`. The viewport breakpoint was later read as `max-width:781px` (earlier read reported 680px), indicating concurrent changes outside this agent's call. **Our attempted CSS update was aborted BEFORE write.** No overwriting, no rollback. The latest live CSS must be reread before any future changes; do not assume a particular actor applied it.

**Current live CSS configuration-level outcome:** a mobile auto-height/no-nested-scroll rule is present in WordPress and should supersede the old cap. **Postchange visual and behavioral QA on signed-in mobile remains UNKNOWN.** WordPress Coming Soon blocks unauthenticated public browser screenshot/inspection.

## V0.2.2 candidate plugin changes (local package)

The new ZIP retains the **same plugin directory** `hybridmind-typhoon-chat` and saved settings option `hybridmind_typhoon_settings`; it does NOT include or rotate Typhoon API keys.

1. **Plugin CSS:** `.hm-typhoon-chat__feed` has `height:auto!important`, `max-height:none!important`, `overflow:visible!important` rather than fixed 160–300px/42vh/36vh heights. This allows long conversations to expand in normal document flow at all widths, not only a mobile scoped override.
2. **Initial mobile presentation:** feed min height `155px` (fallback) and `clamp(155px,22svh,210px)`; initial chatbot is sized for a small display, but naturally expands for longer answers.
3. **JS reading position:** remove `feed.scrollTop=feed.scrollHeight`; after successful AI response on narrow screens, call `scrollIntoView({block:'start'})` on the new AI message. Do not re-focus textarea on narrow screens; desktop retains focus with `preventScroll:true`.
4. **One-line visible note:** replace plugin PHP text with exact `คำตอบอาจผิดพลาดได้`, rendered as a normal DOM paragraph (not a CSS pseudo-element).
5. **Typography:** submit 16px and note 13px in plugin CSS.
6. **All previous read-only WordPress Knowledge Retrieval, source links, safe Markdown, Origin/nonce and best-effort quotas preserved in code.** Guest/public access remains as previously configured; not automatically enabled.

**Privacy caveat:** The shortened note omits text about third-party processing. Before public launch, a separate clear Privacy Policy must disclose that submitted messages are transmitted to Typhoon AI for processing and address relevant retention/recipient information. Do not treat the single line as a sufficient privacy notice.

## LOCAL QA — PASS, not production

- `php -l` for both PHP files; `node --check` JS.
- Existing **PHP Knowledge** suite passed: brand & GS20 queries, Thai words, excludes draft/private/password content, no false breaking news, proper citation provenance.
- Existing **mock Typhoon/chat** suite passed: API key retained in saved options, never returned in client responses, model/source context preserved, plugin reports 0.2.2.
- JS desktop and mobile tests passed (mobile checks no forced focus and reading scrolls to answer start; safe Markdown/same-origin links preserved).
- **Chromium component-only responsive tests**, first visit and deliberately long reply: **PASS for 320, 375, 390, 768, 1280px**. For each, long answers expanded the feed to document height, with no nested `scrollHeight > clientHeight` feed and no horizontal overflow. All first-visit component cards fit within simulated viewport height.
- ZIP integrity `unzip -t` passed and directory structure matches the existing plugin; SHA256 above.

These tests are **not** an authenticated actual production WordPress screenshot after installing v0.2.2.

## Upgrade & release gate

1. Back up WordPress and retain `v0.2.1` ZIP for rollback.
2. On WordPress Plugins → Add New → Upload Plugin, select `hybridmind-typhoon-chat-v0.2.2.zip` from this conversation and choose **Replace current with uploaded**. Do not delete existing plugin first (would endanger stored settings).
3. Read back plugin inventory: v0.2.2 ACTIVE, Typhoon key still configured but never show actual key.
4. Visit the signed-in WordPress homepage, send a **long** Thai question such as `สรุปบทความ GS20 แบบละเอียด 10 ข้อพร้อมแหล่งอ้างอิง`. Confirm page scroll only, first paragraph is visible after reply, entire long answer can be read without internal chat scroll, citations still link to real published articles.
5. Refresh initial session and confirm note shows only `คำตอบอาจผิดพลาดได้`, first-visit card fits within handset view, keyboard does not obscure composer, and normal navigation/sections stay intact.
6. Evaluate five-width actual page responsive screenshots and guest/privacy/cost control gates separately. Do not use Coming Soon Lighthouse results as authenticated homepage evidence.
7. Keep the site `coming_soon/unlaunched` and public guest chat disabled unless separately approved.

**Outcome:** Live CSS auto-height patch **present by readback**, **not written by this session**; **v0.2.2 build and local mock/browser QA PASS**; **v0.2.2 not installed / actual production visual QA UNKNOWN / Public Launch HOLD**.
