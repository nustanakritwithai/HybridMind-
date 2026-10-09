# HYBRID MIND — Typhoon Chat v0.2.0 (Website Knowledge Retrieval)

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online / WordPress.com Atomic / site ID 257844857  
**Current live plugin when this report was written:** v0.1.0, active  
**Candidate installer:** `hybridmind-typhoon-chat-v0.2.0.zip`, created in the ChatGPT conversation and **NOT YET INSTALLED on production**  
**SHA256:** `04ec7a50374d64c545cbdbefb5520a75ee0c13f116c1ad2bd37a949cd0915c5a`  
**Gate:** UNKNOWN ≠ PASS

## User goal

Upgrade Hybrid Mind's own Typhoon Chat so the assistant can read the site's published material itself and accurately describe Hybrid Mind, summarize GS20, and link readers back to the site's sources. The prior version answered some brand questions generically and displayed literal Markdown syntax like `**bold**` and `### heading`.

## Implementation (local ZIP package, not deployed)

- Same WordPress plugin slug `hybridmind-typhoon-chat` and same settings option `hybridmind_typhoon_settings`; existing saved Typhoon API Key, model ID and guest/public setting are designed to persist across upgrade. No keys included in source or ZIP.
- New PHP module `includes/knowledge.php` performs live-on-request **read-only search of the WordPress database**, using only `post_status=publish` and `post_type=[post,page]`; it rejects drafts, private, password-protected items, WordPress Hello World sample and offsite URLs. Up to 3 source snippets by default, maximum 4.
- The assistant's system instructions explicitly identify Hybrid Mind as a Thai AI/technology/Modern AI Lifestyle media brand, with knowledge-before-selling and a `Live Smarter. Live Future.` identity.
- Extracted snippets are supplied to Typhoon as **untrusted evidence**, separated from conversation instructions. The LLM is asked not to obey instructions within articles, invent links, or claim live external web search.
- Server response includes real same-site links and titles. Frontend displays these under the answer as `อ่านเพิ่มเติมจาก Hybrid Mind`; links are checked again for same HTTPS origin.
- The frontend formats a safe subset of Markdown (headings, bold text, lists and inline code) through DOM creation and `textContent` only; no AI-supplied HTML is evaluated.
- Existing server-side Typhoon API proxy, Origin check, admin-only initial chat, best-effort usage limiter, model and key persistence remain.
- Adds a no-cost public-content search QA box in Settings → Hybrid Mind Typhoon for Administrator.
- Adds **Admin-only** `GET /wp-json/hybridmind/v1/knowledge-status` and `GET /wp-json/hybridmind/v1/knowledge-preview?question=GS20`. A direct browser visit may require a valid WordPress REST nonce; use Settings' QA form or an authenticated REST client.

## Test evidence

**LOCAL (PASS):**
- PHP lint for both PHP files; JavaScript syntax check.
- Mock WordPress retrieval tests: brand question, GS20 question, latest articles; deny draft/private/password-protected, unrelated sample, offsite URLs.
- Mock Typhoon round-trip: existing key remains in options and is only attached to the upstream Authorization header; not exposed to browser output; brand system prompt and retrieved sources are sent; retrieval may be disabled without breaking chat.
- Frontend mock DOM tests: headings and lists render, HTML-looking model text remains plain text, external source URLs rejected, input submit and focus preserved.
- ZIP integrity verified, root directory matches existing plugin slug.

**LIVE (UNKNOWN):**
- User has not yet installed this v0.2.0 ZIP.
- Actual source retrieval through WordPress plugin code, Typhoon model responses, Thai formatting and source-link UX after upgrade remain untested on the real website.
- Logged-out guest access and privacy, abuse resistance and costs are separate HOLD gates.

The existing WP REST endpoints were independently checked and currently expose published GS20 post #31 and published homepage #16. This verifies the site has public content available to retrieve but does not prove v0.2.0 itself is live.

## WordPress install & smoke test

1. Back up the WordPress site first.
2. Download `hybridmind-typhoon-chat-v0.2.0.zip` from the conversation.
3. WordPress → Plugins → Add New Plugin → Upload Plugin; upload v0.2.0 ZIP and choose **Replace current with uploaded** when WordPress reports v0.1.0 is installed. Do NOT delete the plugin first.
4. Open `https://hybridmind.online/wp-admin/options-general.php?page=hybridmind-typhoon`. Confirm existing Typhoon API key remains configured; public chat stays closed for QA. Enable `Knowledge from website` if unchecked.
5. In the Settings page search test type **GS20**: expect the *published* GS20 article with a real on-site URL. No Typhoon usage is incurred by this preview.
6. Open the existing homepage #16 while logged in. Ask `Hybrid Mind คืออะไร?`, `สรุปบทความ GS20 จากเว็บนี้`, and `วันนี้มีข่าว AI สดจากอินเทอร์เน็ตไหม?`.
7. PASS only if the bot describes the actual brand, shows grounded source links for relevant content, formats Markdown without raw tokens, and does not claim real-time external web access.
8. Capture Android/desktop screenshots and audit the plugin's response/error messages after upgrade.
9. Keep Coming Soon unchanged; public launch and enabling public guest chat require separate approval.

## Constraints and known limits

- **No general live internet search**: Only the WordPress site's publicly published material. Extending to external trusted sources would be a future feature requiring a separate source and security design.
- Retrieval uses WordPress DB queries rather than a vector index. At large content volumes, a scalable index should be planned.
- No write privileges are given to the chat (no post editing, publishing, deleting, user data or admin credentials).
- The plugin sends selected public excerpts plus user messages to Typhoon. Provide a suitable privacy notice before allowing public readers.
- Best-effort transient limits are not billing-grade protection against distributed requests.
- API Key is not part of repository, ZIP, chatbot payload, or visible metadata.

## Current release state

**V0.2.0 BUILD & MOCK QA PASS / INSTALL REQUIRED / REAL PROVIDER QA UNKNOWN / PUBLIC LAUNCH HOLD.**

No theme change, front-page rewrite, public visibility toggle, or content deletion was performed during this package build.
