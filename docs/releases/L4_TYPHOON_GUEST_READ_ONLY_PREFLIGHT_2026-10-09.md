# HYBRID MIND — L4 Typhoon Guest, Safety & Cost READ-ONLY Preflight

**Checkpoint:** 2026-10-09 (Asia/Bangkok)
**Site:** https://hybridmind.online · WordPress.com Atomic Site ID `257844857`
**Scope:** WordPress plugin/settings readback + GET-only REST discovery + Privacy Draft review. **No Typhoon chat POST, no token spend test, no privilege/visibility or policy page changes.**
**Highest rule:** UNKNOWN != PASS. PRE-LAUNCH / NO GO.

## Read-only facts confirmed

- WordPress.com `plugins.list` confirms **Hybrid Mind — Typhoon Chat v0.2.2 ACTIVE**, plugin file `hybridmind-typhoon-chat/hybridmind-typhoon-chat`. Other active plugins include Jetpack, Akismet and Gutenberg; not an external public-Typhoon launch approval.
- WordPress REST namespace `/hybridmind/v1` advertises `POST /chat`, `GET /knowledge-status` and `GET /knowledge-preview`; existence of a POST route is **not proof** anonymous chat is authorized, safe, rate-limited or chargeable.
- Authorized GET of `knowledge-status`: `version=0.2.2`, `mode=published_wordpress_only`, `knowledge_enabled=true`, `knowledge_limit=3`, `published_posts=3`, `published_pages=2`, `configured=true`, `external_live_web_search=false`, `reads_drafts=false`.
- Authorized GET `knowledge-preview` returned `sources=[]` with no query, not evidence that all retrieval requests return no sources or that the bot is broken.
- WordPress reading/visibility: `coming_soon / unlaunched`, `blog_public=0`; no release authority.
- WordPress discussion defaults: `default_comment_status=open`, `default_ping_status=open`, previous comment moderation policy needs separate launch decision.
- Anonymous Coming Soon HTML previously observed including a Typhoon client-script tag/config on the splash. This is a **security review item**; it does not prove presence of the active chat widget, an open guest POST, token leakage or model access. A WordPress nonce being present in markup is not an API key.
- Privacy Policy Page #68 remains **Draft** and clearly marks provider prompt retention, logs, cookie specifics, data-controller public contact and Thai PDPA review as unresolved. This is appropriate cautious wording, not a PASS for publish-ready compliance.

## Limitations / security blockers

- **Guest endpoint permission and abuse behavior: UNKNOWN.** No anonymous POST request was sent, to avoid unknowingly spending provider tokens and breaching the preview/launch freeze. Route discoverability alone is not an exploit.
- **Server-side API key secrecy: UNKNOWN** without authenticated source-code review/server inspection or controlled endpoint tests. No provider secret was requested, read back or copied.
- **Rate limit, per-IP / session quota, token/context cap, daily cost budget, billing alert, 429/5xx handling, input size, privacy/logging retention: UNKNOWN.**
- **Draft isolation functional test: UNKNOWN.** Knowledge-status `reads_drafts=false` is config PASS, but actual malicious user attempts and content leak tests were not performed.
- **Prompt injection, malicious links, unsafe HTML and exfiltration claims: UNKNOWN** pending controlled authorized black-box suite and source review.
- Connected WPVibe core REST proxy worked, but plugin-backed source-file inspection is unavailable: WPVibe plugin route `/wpvibe/v1/` is not installed/working on this WordPress instance. Do not retry plugin-backed file tools until site setup changes; no new plugin installation is requested or authorized.
- External unauthenticated source fetch for `knowledge-status` and `knowledge-preview` could not be verified due to access restrictions in external fetch tools. Do **not** classify inaccessible as safe, denied, or broken.

## Recommended controlled L4 suite — NOT executed

1. Decide launch mode `CONTENT-ONLY` or `CONTENT+TYPHOON-GUEST` before running chargeable tests. Default remains HOLD.
2. Obtain an approved provider usage budget (maximum charge/test), non-sensitive logs and allowed guest test account/scenario; never share key, cookie, JWT or passwords in public reports.
3. Review installed PHP server handler or package offline for guest permission, nonce/origin behavior, rate limits, upper request size, max model tokens, strict published-only retrieval, proper output escaping, explicit error handling and data retention.
4. Controlled 15+ test cases with authorization: Thai/English basic prompts, blank/oversized payload, high-frequency requests, concurrency, denied guest, stale nonce, no draft disclosure (e.g. #57), fabricated up-to-date news claim, prompt injection, source attribution and 429/5xx/timeouts. Record observed HTTP status and financial/provider usage but not sensitive payloads.
5. If any P0 guest/privacy/cost gate remains UNKNOWN, keep Guest Typhoon disabled/restricted on release day (separately tested configuration) or keep the site HOLD. The Public Launch authorization must remain separate.

**Conclusion:** Configuration/route inventory **PASS**, but guest security and costs **UNKNOWN / L4 HOLD**. Site still Coming Soon. No WordPress changes, no chat calls, no provider token cost generated in this inspection.
