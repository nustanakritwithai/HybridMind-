# HYBRID MIND — Typhoon AI direct WordPress integration (V0.1.0)

Date: 2026-10-09 · Site: https://hybridmind.online · WordPress.com Atomic · Theme: Assembler · Rule: **UNKNOWN ≠ PASS**

## Goal

Replace the non-working AI Engine homepage chat with a dedicated WordPress shortcode chat calling Typhoon's documented `POST https://api.opentyphoon.ai/v1/chat/completions` from the **server**, keeping the API key out of browser HTML/JS. The user already has a Typhoon API Key and should enter it directly in WordPress Admin, not in this repository or chat.

## Current implementation state

- **PASS (local)**: Built WordPress plugin ZIP `hybridmind-typhoon-chat-v0.1.0.zip` with PHP REST endpoint, HTML/chat JS/CSS, WordPress settings page, server-only Bearer auth, basic best-effort rate limiting, and default **Admin-only** chat. PHP and JS syntax checked; ZIP integrity checked; 13 mock checks passed.
- SHA256 of ZIP: `06bac501c4254576ca6223dc83ce883623822a6252591c657bbec04be55bb446`.
- **UNKNOWN**: Not yet installed on the live WordPress site. No real Typhoon API call or actual authenticated end-to-end UI test has passed.
- **HOLD**: Public chat remains off until key/model checks, test prompts, privacy and cost protections pass.
- The previous broken AI Engine widget is still on homepage #16 until the new plugin is installed and tested. Do not mistake it for a working connection.

The installable ZIP was generated as a conversation artifact for user upload; it is **not** automatically deployed and not included in this public repository. Never commit credentials.

## Deployment steps (WordPress.com Atomic)

1. Download the ZIP from the ChatGPT conversation.
2. Open WordPress Dashboard → Plugins → Add New Plugin → Upload Plugin, upload ZIP and activate. WordPress.com documentation: https://wordpress.com/support/plugins/install-a-plugin/
3. Open WordPress Dashboard → Settings → Hybrid Mind Typhoon (`/wp-admin/options-general.php?page=hybridmind-typhoon`).
4. Paste the existing Typhoon API Key into the masked input and Save. Verify model ID from the user's own Typhoon account; initial default is the example model `typhoon-v2.5-30b-a3b-instruct`.
5. **Keep Public chat unchecked**. Insert `[hybridmind_typhoon_chat]` into a Gutenberg Shortcode block in a DRAFT test page. Logged-in admin can test while guests remain blocked.
6. Verify 3 live questions, including Thai general questions, a request for current news (AI must not invent freshness), and unverified GS20 features.
7. Only after test PASS, replace the existing `[mwai_chatbot ...]` shortcode on homepage page #16 with `[hybridmind_typhoon_chat]`, preserving Gutenberg Hero design and other sections. Re-read WordPress markup and rendered content.
8. Capture authenticated mobile and desktop screenshots; test submit, error and focus behavior. Then consider separate public chat enablement with WAF/bot protection, rate limits and a privacy policy. Public site launch remains a separate approval gate.

## Design/safety

- Custom WordPress REST endpoint: `POST /wp-json/hybridmind/v1/chat`.
- API key stored server side in a non-autoloaded WordPress option, never in JS, HTML, GitHub or browser storage.
- Browser sends user message + bounded recent history to same-origin WordPress REST endpoint; WordPress sends to Typhoon via TLS and returns a text reply. Replies are inserted via `textContent`, not HTML.
- Strict Origin / Referer checks, short message limit, per-IP/day and per-minute guest throttling, global daily cap; **transient caps are best effort**, not a billing-safe absolute rate limiter under concurrency or distributed abuse.
- Public chat is disabled on initial plugin activation. Admin can conduct acceptance tests even when public is disabled.
- The plugin does not persist conversation messages; content is sent to Typhoon. Privacy notice and verification of provider data handling are outstanding before public access.
- No theme change, no public launch, no new API secret generated and no old content deleted.

## Release status

**INSTALL REQUIRED / LIVE API UNKNOWN / PUBLIC CHAT HOLD / PUBLIC SITE COMING SOON**
