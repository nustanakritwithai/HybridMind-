# HYBRID MIND — Public Launch Readiness Plan V1.0

**Prepared:** 2026-10-09 (Asia/Bangkok)  
**Production CMS:** WordPress.com Atomic, Site ID `257844857`, https://hybridmind.online  
**Brand:** HYBRID MIND — Live Smarter. Live Future.  
**Theme:** Assembler  
**Owner's rule:** **UNKNOWN ≠ PASS.** Public launch requires a NEW, SEPARATE, explicit owner authorization.

## Executive decision

**NOT READY for public launch as of this snapshot.** Prioritize editorial trust, reliable mobile UX, visitor-facing AI-chat controls, prelaunch recovery, and an explicit release approval. **Do not wait for the separate A2A Visualize Engine to become autonomous or complete.** Existing GPT-generated interactive pages can serve as launch content once their own QA passes.

Suggested two possible launch modes:
- **CONTENT-FIRST soft launch (recommended if Typhoon Guest QA remains UNKNOWN):** public editorial articles and interactive visual lessons; either disable/restrict public Typhoon chat or show only a tested read-only/non-chat information surface until safety/cost/guest gates pass. This **requires its own reviewed configuration change**—do not assume the plugin can be toggled safely without testing.
- **FULL AI PUBLIC launch:** public editorial + working Typhoon chatbot available to visitors. Requires guest/auth, origin, input controls, cost budget, abuse rate-limits and failure-handling PASS before site visibility is changed.

No option has been authorized or implemented merely by writing this plan.

## Verified snapshot (read-only connector checks)

| Evidence / item | 2026-10-09 fact | Release classification |
| --- | --- | --- |
| Site state | `visibility=coming_soon`, `launch_status=unlaunched` | PASS for preserving gate |
| Homepage | WordPress Page **#16 Published**, static homepage set to #16 | Structure PASS / signed-in browser matrix UNKNOWN |
| WordPress AI chatbot | Hybrid Mind — Typhoon Chat **v0.2.2 Active**; endpoint namespace has `POST /hybridmind/v1/chat`, read-only knowledge-status/preview | Installed PASS / public guest safety UNKNOWN |
| Knowledge source | `knowledge_enabled=true`, `external_live_web_search=false`, `reads_drafts=false`; 4 published posts in WordPress | Readback PASS / answer quality/security UNKNOWN |
| Published editorial posts | **#31 GS20 buying guide**, **#52 AI game development**, **#55 AI ERA 2026 interactive** | Published PASS / final signed-in/mobile visual QA UNKNOWN |
| AiPASS visual article | Post **#57 Draft**, Featured Image **#63**, photos and calculator/quiz present, styling and cover-only CSS readback | Draft readback PASS / visual + news claim gate UNKNOWN / publishing HOLD |
| Other Drafts | Article #18, prototype #54, page #17, chat sandbox page #32 | Must remain Draft unless individually approved |
| Placeholder post | **#3 “Hello World!” Published** | **FAIL — remove from public-visible editorial/archive through approved cleanup** |
| About page | Page **#1 Published** but **still WordPress sample paragraph** | **FAIL — replace before launch** |
| Contact/Privacy/Editorial/Affiliate pages | Not present in published/draft page inventory (nine pages listed) | **FAIL — required editorial transparency pages absent** |
| AI News archive | Category `ai-news` has **0 Published articles** although featured in Navigation #4 & Footer | **FAIL/CONTENT GAP — publish vetted story or temporarily hide the empty category** |
| #55 category | Published interactive AI ERA is **Uncategorized** | CONTENT HYGIENE — assign appropriate approved category |
| Site identity | `site_icon=0`, `site_logo=0`; header has typographic Hybrid Mind branding | P1 — add recognizable favicon/site icon |
| Site footer | Brand + explore links; lacks Privacy, Contact, Editorial, Affiliate policy links | **FAIL — link finished policy pages before launch** |
| Default discussion settings | `default_comment_status=open`, pingback flag on | P0 decision: guest comments open? spam/moderation plan |
| Backup | Jetpack Backup state **active**, latest successful attempt **2026-10-08 18:15:16**, 4 backups reported | Backup service PASS / restore rehearsal & same-day preflight UNKNOWN |
| Security scan | Jetpack Scan last recorded **2026-10-08**, `state=idle`, `threats=[]` | Previous scan PASS / does not certify launch-time security |
| Account protection | Jetpack Account Protection **active** | PASS for installed setting |
| Monitor | Jetpack Monitor `monitor_active=false` | P1 recommended before launch |
| Search visibility | `blog_public=0` while Coming Soon enabled | PASS for prelaunch; search indexing must be a separate launch decision |
| Site permalink | `/%year%/%monthnum%/%day%/%postname%/` | Config checked / redirects & 404s need browser QA |

**Source of truth:** WordPress.com read-only `posts.list`, `pages.list`, `pages.get(1,16)`, `categories.list`, `navigation.get(4)`, `template-parts.get(assembler//footer)`, plugin list, `settings.get`, `manage-site.status`, `backup.rewind_status`, `backup.storage_status`, `scan.status`, `monitor.status`, `account-protection.status`, Typhoon `knowledge-status` and `/hybridmind/v1`.

## Gate 0 — Freeze and recover before edits

**Goal:** A recoverable, stable release candidate.

- Freeze new Visualize Engine features and theme overhaul while closing launch blockers.
- Record exact content/site/plugin versions and change log. Keep GitHub Project Control current; avoid concurrent CSS/edit overwrites.
- Take/verify a current full WordPress backup **on launch day**. Backup status `active` is not proof of restore.
- Perform approved safe restore rehearsal on staging/clone or inspect a supported restore-preflight; verify data, uploads, plugin configuration and page outputs. Never test destructive restore against active Production without an explicit plan and approval.
- Keep known rollback points, including AI chat ZIP, current theme/template changes and CSS snapshots.

**Gate:** Restore rehearsal documented PASS (or explicit owner risk acceptance with mitigation, but not falsely marked PASS); changes frozen; rollback path available.

## Gate 1 — Editorial identity, transparency and contact [P0]

1. Replace Published About Page #1's WordPress sample paragraph with genuine Hybrid Mind mission, editorial model, attribution and limitations.
2. Create or finalize **Contact**, **Privacy Policy**, **Editorial Policy**, **Affiliate Disclosure**. Do not invent address, phone or email; obtain owner-selected public contact route. Privacy content must explain that chatbot text is sent to Typhoon/AI provider, purposes of processing and relevant data/cookie handling; review for actual services and Thai PDPA.
3. Update footer and menu to surface Contact/Privacy/editorial/affiliate disclosures in a clear location; verify working links in both anonymous and signed-in browser paths.
4. Decide if comments are enabled on launch. If enabled: moderation/anti-spam/rules and privacy; if disabled: set intentionally and verify.
5. Review image provenance: AI-generated cover #63 labeled as illustration, stock photographs credited and without misleading official/real-event implication.

**Gate:** Mandatory pages Published with accurate information, usable contact route, footer links tested, no placeholder content.

## Gate 2 — Editorial launch package [P0]

1. **Remove or hide “Hello World!” #3** from public listing after owner approves cleanup; don't just cosmetically hide title while leaving indexed permalink publicly discoverable.
2. **AI News empty:** editorially review AiPASS visual **Draft #57**, correct current rights/edition/claims and verify sources; publish only after separate explicit owner approval. Alternatively remove AI News links temporarily until a properly reviewed article exists.
3. Assign Published AI ERA #55 to a relevant category instead of Uncategorized if editorially appropriate.
4. Proofread #31's dated price/vendor claims, #52 original graphics and #55 Agent examples. Ensure that abstract AI illustrations are not presented as factual images.
5. Review all category archives and Homepage latest-post query. Verify direct links, branded 404 response, internal navigation and attribution.
6. Keep private QA Drafts (#54, #18, #17, #32 and untitled pages) out of public nav, archives and search.

**Gate:** No starter content, featured navigation destinations useful, minimum 3–4 independently checked launch articles; any advertised news/archive has content or is clearly marked/hidden.

## Gate 3 — Real Mobile / Interactive Visual QA [P0]

**Widths required:** **320, 375, 390, 768, 1280 CSS px** with authenticated preview (site still Coming Soon). At least one Android real-device walkthrough and one desktop browser for layout, accessibility and keyboard focus.

Test scenarios:
- Homepage: header/logo, mobile hamburger open/close and keyboard navigation, Hero, Typhoon text input/scroll, four topic cards, latest-post feed, footer, no side scroll.
- AI ERA #55: path tabs, shopping modes, prompt copy, quiz, iframe auto-height/scroll bridge and sources.
- AiPASS #57: edge-to-edge **cover-only layout** with no white gap and full intact image, three editorial photos, colored headline contrast, switch 1.0/2.0, points preset 10 videos → 1,000, Reset → 0, eligibility checklist, quiz and references; any crop/overflow is FAIL.
- Game article #52: full infographic not clipped and readable on phone.
- Focus visibility, touch targets, alt text, disclosure, contrast, no iframe nested scrolling, browser console failures and image loading.

**Gate:** Screenshots, device/viewport sizes and per-test PASS/FAIL/UNKNOWN; no material FAIL/UNKNOWN for mandatory visitor journeys. A WordPress Gutenberg/HTML/CSS readback is not a browser QA PASS.

## Gate 4 — Public Typhoon chatbot and WordPress security [P0 for full-AI launch]

- Confirm API key remains server-side and never appears in HTML, REST JSON or logs. Do not copy actual key into GitHub.
- Verify how non-logged-in users interact, request Origin/nonce validation, CSRF/abuse controls, rate limits/IP/guest quotas, tokens and provider cost ceiling and notification/billing guard.
- Run minimum **15+ real integration cases**: Thai/English; blank/long prompts; accidental private information; prompt injection; unpublished Draft references blocked; fake current-news query must not pretend real-time web search; response sources and link clicks; 429/5xx/network timeouts; multiple simultaneous guests; mobile focus/scroll.
- Ensure prominently linked privacy/disclaimer for AI processing, accuracy caveats, and external model provider.
- Make an explicit decision: **if any material guest/chat gate is UNKNOWN, public launch must be content-only with chat appropriately disabled/restricted or remain HOLD.**
- No extra privilege or new autonomous Typhoon feature under Public Launch.

**Gate:** Tested visitor chat with costs capped and failure handling PASS—or fully tested content-only fallback with chat blocked.

## Gate 5 — SEO, resilience, analytics [P0/P1]

- Verify domain `hybridmind.online` serves HTTPS and selected canonical URLs, sitemap/robots behavior, mobile page titles, OG/social share previews, images, accessible link labels and favicon/site icon.
- Current `blog_public=0` should remain during Coming Soon. Search indexing and sitemap submission are **launch-time decisions**, not steps performed now.
- Check real-page Lighthouse/performance rather than Coming Soon splash. Optimize image sizes, lazy loading, caching, page speed and accessibility without breaking interactive inline CSP.
- Monitor: Jetpack Monitor currently OFF; consider enabling and testing downtime alerts for release day (owner approval needed).
- Backup health and rollback smoke tested; last Backup and Scan must be sufficiently recent at cutover. A previous no-threat scan alone does not prove security.
- Decide analytics/cookie consent/retention; verify privacy text matches actually configured services.

**Gate:** Every critical visitor URL opens successfully when public, site indexability matches explicit owner intention, monitoring/restore/runbook ready.

## Gate 6 — Explicit go/no-go and launch window [REQUIRES OWNER]

**Checklist of owner choices:**
- Launch mode = `content-only` or `content+Typhoon-public`.
- Which Draft articles have their **own** publish approval? A site launch must not silently publish Draft #57.
- Are the actual Contact details, privacy language, terms and affiliate status approved?
- Who monitors the first 24 hours and owns emergency rollback?
- Explicit approval to change WordPress.com **`coming_soon → public`**, and separately to enable search indexing if desired.

**Operations only after authorization:**
1. Freeze/snapshot/backup; check no editor races.
2. Verify release matrix, privacy/menu/content, guest/chat mode.
3. Change site visibility and indexing only with direct owner approval and documented action.
4. Open an anonymous/incognito browser on mobile and desktop, verify homepage, all category pages, all published articles, contact/privacy, CSS/JS/photos/forms and chat mode.
5. Recheck Site Status and browser 200/redirects. Record screenshot/monitor evidence.
6. If material launch-critical failure, execute agreed rollback (visibility/private gate and/or content/config rollback as necessary), and document outcome.

**Default as of now: NO GO.** No WordPress setting, page, post or template changes authorized by this planning document.

## Priority order and suggested work rounds

| Round | What to do | Prerequisites | Exit criteria |
| --- | --- | --- | --- |
| **L1 — Trust pages** | Fix About #1 and prepare Contact, Privacy, Editorial Policy, Affiliate Disclosure; decide public contact | Owner supplies real contact path & legal disclosure preferences | Pages accurate, no placeholders, footer discoverable |
| **L2 — Clean content** | Remove Hello World, categorize AI ERA, resolve empty AI News and vet AiPASS #57 | Editorial review + separate publication/cleanup approvals | Public menu/archives accurate |
| **L3 — Responsive QA** | Device matrix with owner screenshots for #16, #55, #57, #52; fix clipping/scroll | Authenticated device/browser | Critical viewport checks PASS |
| **L4 — Guest AI QA** | Test public-mode Typhoon safely and record cost/rate limits; choose launch mode | Privacy disclosures and API budget decision | 15+ tests PASS or tested chat-disabled fallback |
| **L5 — Final security/SEO/backup** | Fresh backup, restore preflight, SSL, Search Console prep, site icon, monitor, anonymous checklist | Changes stable and frozen | Rollback/launch runbook PASS |
| **L6 — Go/No-Go** | Owner reviews signed release checklist, explicitly approves visibility change | All mandatory gates | Authorized public cutover / documented HOLD |

The **first immediate concrete action** is **L1: replace the generic Published About page and agree an authentic Contact channel, then draft the four trust/disclosure pages**. Do not start marketing campaigns or invite users while Contact/Privacy and guest AI behavior are unresolved.

## Explicit exclusions and protection

- No new plugin installation or unattended A2A/Visualize Engine activation required to launch.
- Do not auto-publish Draft #57 or turn on Typhoon widget generation.
- Do not treat `Published` in WordPress as publicly viewable while Coming Soon is active.
- Do not flip `blog_public`/Coming Soon yet.
- No guest/user payment/account/password or actual affiliate links invented.
- No fabricated PASS for five-width authenticated browser QA.

**Prepared from read-only WordPress/Jetpack connector checks and project-specific docs on 2026-10-09. This is a release plan, NOT a launch operation.**
