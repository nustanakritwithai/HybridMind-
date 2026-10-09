# HYBRID MIND — UI V3 Homepage Production Deployment

**Date:** 2026-10-09 (Asia/Bangkok)
**Site:** https://hybridmind.online · WordPress.com Atomic Site ID `257844857`
**Owner request:** “เอาเวอร์ชั่นล่าสุดขึ้นเว็บจริงก่อนดีกว่า” (deploy latest HYBRID MIND UI V3 to live site).
**Scope:** Homepage **Page #16** UI V3, retaining live published article URLs; no general WordPress theme change, article edits, public AI Chat enablement, or Draft publication.
**Rule:** UNKNOWN ≠ PASS.

## Result: V3 UI LIVE, verified by anonymous public HTML

- WordPress `pages.update(id=16, content.raw=...)` succeeded on existing Published Page #16.
- **Before:** `publish`, modified `2026-10-09T20:39:52`, raw body 14,159 chars, 18 Gutenberg top-level blocks.
- **After:** `publish`, modified **`2026-10-09T22:08:28`**, raw Gutenberg body **54,342 chars**, one `core/html` block; exact string match to reviewed GitHub candidate.
- WordPress staging Draft **Page #79** was created with identical candidate body and `jetpack_seo_noindex=true` to test content fidelity and script preservation; stage readback exactly matched 54,342 chars, `status=draft`, modified `2026-10-09T22:07:05`. Rendered REST source retained V3 style/script. Staging is not public and must remain Draft until separately cleaned up.
- Independently fetched anonymous `https://hybridmind.online/?hm_v3_verify=20261009_2220` HTML after live update. WordPress served the **V3 editorial page**, not Coming Soon: `<body ... page-id-16 ...>`, `class="hm-v3"`, V3 Hero text, custom Masthead, Reading Room, Visual Lab and V3 footer. HTML size **138,294 chars**.
- **Public HTML exactness:** `<style id="hm-v3-live-styles">` CSS text and `<script id="hm-v3-live-script">` JavaScript text **exactly match the GitHub candidate**. Live response contained **1 H1**, 0 duplicate DOM IDs, 17 internal-anchor hrefs with 0 missing target IDs.
- All three displayed cards point to existing Published Posts **#55 AI ERA**, **#52 AI game development**, **#31 GS20**. No Draft #57 card/links or prototype-only UI banner. Logo links to real homepage.
- Existing WP theme Assembler header/footer source NOT edited; scoped inline CSS hides these theme template parts **only on body.page-id-16**, preventing duplicate navigation on the homepage. Other WordPress pages retain their theme layout.
- Typhoon Chat plugin v0.2.2 was already **inactive** before deployment; homepage V3 does not embed the chatbot shortcode. This UI contains *local* HTML/CSS/JS learning demos only; the manual `GET` WordPress data refresh is for public post content, not provider model API use.

## Source and rollback

- **Exact full pre-deploy Gutenberg backup:** [WORDPRESS_PAGE_16_PRE_V3_2026-10-09.html](../backups/WORDPRESS_PAGE_16_PRE_V3_2026-10-09.html), confirmed byte-for-byte at the WordPress/GitHub readback boundary, GitHub blob SHA `5ae5edd46a4d1e704f0cb339a06f68467713d5f0`.
- **V3 production Gutenberg payload:** [HYBRID_MIND_V3_WORDPRESS_HOME_CANDIDATE_2026-10-09.html](../design/HYBRID_MIND_V3_WORDPRESS_HOME_CANDIDATE_2026-10-09.html), GitHub blob SHA `9d295ca2da54d53d411a2e6f809b04b3ee559502`. This is an adaptation of the owner-approved V3 standalone prototype, with scoped CSS and staging/production copy changes.
- If regression occurs: fetch the **exact backup** from GitHub, verify current `pages.get(id=16,context=edit)`, then `pages.update(id=16, content.raw=backup, user_confirmed=true)`. Read back exact content, homepage public HTML, published cards and site status; do not change the live URL, site theme, site visibility or Draft statuses as part of restoring Page #16.
- Jetpack Backup reports backup subsystem active, last known successful full backup **Oct 8 2026 18:15:15**, restore preflight **null/UNKNOWN**. WordPress page revision plus exact GitHub body backup gives **content rollback**, not a tested whole-site disaster recovery guarantee.

## Quality assurance details

| Verification | Result |
| --- | --- |
| Standalone original V3 prototype QA | PASS in previous V3 work |
| Adapted V3 native WordPress wrapper, CSS scoped to `.hm-v3` | PASS structural |
| Local Chromium wrapper at 320/375/390/768/1280/1440 CSS px | PASS: no horizontal overflow, JS errors |
| Local wrapper: Hero Chatbot/Agent and Visual Lab A2A switches | PASS |
| Local wrapper: all filters (3/1/2/1), search Godot (1), clear, mobile menu open/close | PASS |
| Staged Draft #79 raw and rendered REST source fidelity | PASS |
| Production Page #16 raw equals V3 candidate | PASS |
| Anonymous homepage HTML includes V3 design, CSS/JS byte-identical to candidate | PASS |
| Internal anchor IDs / page title heading / published-only cards | PASS |
| Actual Production Android/desktop screenshot/computed CSS/actual mouse-click QA | **UNKNOWN — no authenticated browser visual test performed** |
| Live external WordPress GET refresh as an actual visitor | UNKNOWN (fallback-to-snapshot implemented in JS) |
| Future new posts automatically included | **Not implemented**: three known published IDs only, manual refresh can update those, not discover new layouts |
| Latest WordPress excerpt/title/URLs integrated | PASS for 3 approved post snapshots; refresh is available on click |
| SEO complete; crawlers definitively noindex | **UNKNOWN / L5 HOLD** |

## Invariants carried forward

- At last checked site remained **`launched / discourage_search`**, WordPress `blog_public=0`. This does **not** guarantee external robots noindex: previously inspected HTML meta robots was `max-image-preview:large`, not `noindex`.
- Draft **#57** remains Draft (do NOT publish); Draft staging #79 also remains Draft.
- Typhoon guest endpoint stays disabled because plugin remains inactive. L4 guest security/privacy/cost gating is unresolved.
- UI is **Content-only V3**; interactions are client-side demonstrations, not a live autonomous Website Agent.
- Outstanding L1 Contact / Privacy / Editorial / Affiliate pages, AI News archive empty in old category, full-site restore, L3 live browser viewport and L5 performance/SEO remain separate tasks.

## Next steps

1. Owner visually inspect https://hybridmind.online/ on Android and desktop; compare to local preview. If any critical visual issue, use the exact Page #16 rollback above.
2. Collect real Production browser screenshots 320/375/390/768/1280 and verify sticky nav, search/filters, readability, card links, scrollbar, reduced-motion and contrast.
3. Later replace fixed 3-post V3 Reading Room with a genuine WordPress Query Loop or safe REST renderer that adds newly published posts automatically.
4. Finalize trust pages and resolve robots/noindex before inviting major search traffic. Typhoon remains inactive until separate guest-security approval.

**Verdict:** **V3 HOMEPAGE LIVE — Production source & public response PASS; browser-computed visual QA UNKNOWN**. Owner-requested deployment complete; site-wide launch gates not implicitly waived. UNKNOWN ≠ PASS.
