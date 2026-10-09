# HYBRID MIND — Content-only Soft Public Launch (Owner-directed)

**Date:** 2026-10-09 (Asia/Bangkok)
**Target:** https://hybridmind.online · WordPress.com Atomic Site ID `257844857`
**Owner directive:** “ตอนนี้เอาแค่ให้มันออนไลน์ก่อน” (put the website online now, without completing all planned launch features).
**Operational choice:** publish the existing editorial site in **CONTENT-ONLY** mode; temporarily disable unverified guest chat; preserve Draft articles, avoid publishing policy Drafts or activating extra features. Do not mark remaining release checks PASS.

## Actual production writes and rollback

### 1. Typhoon Chat temporarily deactivated

- WordPress core REST `POST /wp/v2/plugins/hybridmind-typhoon-chat%2Fhybridmind-typhoon-chat`, body `{"status":"inactive"}`.
- Independent GET returned `plugin=hybridmind-typhoon-chat/hybridmind-typhoon-chat`, `status=inactive`, `version=0.2.2` — **PASS**.
- No plugin deletion, provider key disclosure or paid chat POST was performed.
- Re-enable later **only after L4 Guest Privacy/Security/Cost review**, via an explicitly approved WordPress plugin activation. Its server-side configuration may remain stored; this was not a tested recovery from deactivation.

### 2. Homepage #16 changed only in one Hero top-level block

- Before: Page `#16` `publish`, modified `2026-10-09T08:49:54`, 18 top-level Gutenberg blocks; section index 0 `core/group` block hash `4b784d3ca54c6eeaa4bcb23442a88823a7c00124`, full content hash `b04c4cb5a97067bf86e864fc633109355872c1cc`.
- **Exact pre-change index-0 Gutenberg block backup** saved in [L6 homepage Hero backup](../wordpress/L6_SOFT_LAUNCH_HERO_CONTENT_ONLY_PRECHANGE_2026-10-09.md). This is a block backup, not a full-site backup.
- Used WordPress `page-sections.replace` index 0 with optimistic-lock tokens, changing **four carefully scoped strings**: Hero headline from `ถาม AI` to `อ่าน AI`; introductory paragraph to editorial content; replaced inactive `[hybridmind_typhoon_chat]` shortcode block with a notice that chat is under security/privacy review; changed “ลองถาม” teaser to “เริ่มอ่าน”.
- After independent WordPress page and section readbacks: Page remains Published, modified `2026-10-09T20:39:52`, 18 top-level blocks; **all other 17 original section block hashes unchanged**; shortcode absent; replacement text present — **PASS**.
- Rollback: restore the exact original block from the linked backup with a new optimistic-guarded section update, separately approved; reactivate Typhoon only after L4 gate, not as an automatic rollback.

### 3. WordPress Coming Soon turned off — PUBLIC launch

- Final preflight: `coming_soon/unlaunched`, `blog_public=0`, Typhoon inactive, #57 Draft.
- Owner-directed `manage-site.launch` returned `success=true`, `previous_state=unlaunched`, `new_state=launched`, note “Your site is now visible to everyone.”
- Independent `manage-site.status` immediately after launch: `visibility=public`, `launch_status=launched`.
- Anonymous GET page HTML: **actual Homepage #16 markup**, `<body class="home ... page-id-16 ...">` (NOT Coming Soon). Contains editorial Hero and cards #55/#52/#31. No Typhoon Chat client script or raw shortcode. **Anonymous homepage access PASS**.
- Anonymous URL `/?p=57` showed a WordPress “ไม่พบหน้า” title (Draft body not present). **Draft protection PASS for this inspected anonymous request**.
- WordPress `posts.list(status=publish)` continues to return only **#55, #52, #31**. No Draft article (#18/#54/#57) or policy Draft (#67–#70) was published.

### 4. Search visibility returned to “discourage”

- **Important caveat:** WordPress `manage-site.launch` automatically changed `blog_public=0` to **1** (public/indexable).
- To preserve the owner's “online first, do not actively open Google indexing separately” constraint, immediately used confirmed `settings.update` `blog_public=0`; response: before `1`, after `0`.
- After write, `manage-site.status` reports `visibility=discourage_search`, `launch_status=launched`; `settings.get` `blog_public=0` — **configuration PASS**.
- **External noindex is NOT certified:** two inspected anonymous Homepage HTML responses (including cache-busting URL) showed `<meta name="robots" content="max-image-preview:large">`, **not** `noindex`. Therefore effective search crawler prohibition **UNKNOWN**, possibly impacted by WordPress rendering/caching. Do not claim indexing is fully prevented or SEO passed. Search engines may see public pages; `blog_public=0` is only a discouragement request, not absolute privacy.
- This is a user-requested **content-only soft launch**, not full L5 SEO signoff.

## Remaining launch blockers knowingly carried into live soft launch

- L1 — Contact #67, Privacy #68, Editorial Policy #69, Affiliate Disclosure #70 remain Draft and are not in Footer; identify a legitimate owner-selected public contact route and review real Typhoon/Jetpack/cookie practices before publishing. Legal/privacy completeness **HOLD**.
- Editorial — AI News archive still empty but linked in Homepage, Navigation and Footer; **FAIL / HOLD** until page/nav editorial decision. GS20 #31 seller original source for 602 THB still missing.
- L3 — Authenticated browser responsive and interactive matrix (320,375,390,768,1280 CSS px) **UNKNOWN**. #55 has no featured thumbnail; other cards can crop infographics.
- L4 — Typhoon inactive (safe Content-only operational posture), full guest auth/rate limits/provider cost/retention **UNKNOWN**, do not reactivate without approved QA.
- L5 — Latest known Jetpack Backup succeeded Oct 8 2026 18:15:15, **no same-day full backup or restore rehearsal confirmed**; sitemap/robots real search behavior, monitoring, site icon, OpenGraph, performance and redirects **HOLD/UNKNOWN**.
- This soft launch is **publicly accessible NOW**; not equivalent to declaring every release gate passed.

## Immediately recommended live checks

1. Validate anonymous direct access to Homepage, #31/#52/#55, Explained and Footer/navigation from a real browser and at least one Android phone; capture viewport screenshots, horizontal overflow and card-crop findings.
2. Verify robots/noindex response through independent uncached HTTP and WordPress settings to resolve mismatch. If owner wants public Google indexing later, obtain **separate** explicit indexing approval.
3. Decide whether to remove empty AI News nav/home/footer links or prepare a reviewed first story with independent publication approval.
4. Finalize Contact/Privacy disclosure quickly now that site is live, with owner-provided real contact (do not invent contact email).
5. Confirm same-day recoverable backup and appropriate monitoring, as the website is publicly reachable.

**Final operational state:** **LIVE — CONTENT ONLY / `launched + discourage_search`**. `#57=draft`, `#3=trash`, `Typhoon=inactive`. SEO, Browser QA, legal/privacy and guest-chat launch gates remain separately **HOLD/UNKNOWN**. **UNKNOWN != PASS.**
