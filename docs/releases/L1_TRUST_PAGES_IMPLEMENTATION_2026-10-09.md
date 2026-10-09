# HYBRID MIND — L1 Trust Pages Implementation & QA

**As of:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online (WordPress.com Atomic ID 257844857, Assembler theme)  
**Authorization:** Owner explicitly responded **ทำเลย** after the L1 Public Launch Readiness plan.  
**Rule:** UNKNOWN ≠ PASS  
**Decision:** **L1 PARTIAL / HOLD**; site remains **COMING SOON / UNLAUNCHED**; no public launch or AI-guest permission was changed.

## Objective

Establish accurate, non-placeholder site identity and prepare essential editorial transparency pages before public release. Do not fabricate public contact details, data retention periods or legal-compliance claims.

## Actual WordPress changes (independently read back)

| Page | ID | Status after task | Result |
| --- | --- | --- | --- |
| **เกี่ยวกับ HYBRID MIND** | **#1** | **Published**, modified `2026-10-09T15:19:59` | Replaced a genuine stock WordPress example with authentic Thai brand copy, visual brand header, mission, four editorial pillars, source-awareness and links to the published #52/#55 articles |
| **ติดต่อ HYBRID MIND** | **#67** | **Draft** | Contact topics and moderation guidance; intentionally leaves public Facebook/email unspecified |
| **นโยบายความเป็นส่วนตัว** | **#68** | **Draft** | Discloses general AI Chat transmission to Typhoon, potential WordPress/Jetpack/Akismet processing, no password/sensitive-data warning, conditional data rights; marks contact, logs, retention and cookies as **unverified/required to inspect** |
| **นโยบายบรรณาธิการ** | **#69** | **Draft** | Source reliability, AI-assisted text/visuals, simulated learning tools, corrections and affiliate transparency |
| **การเปิดเผยลิงก์ Affiliate** | **#70** | **Draft** | Explains conditional commission, separates merchant claims from independent evaluations and requires disclosure near future active tracking links |

All new pages use serialized Gutenberg blocks with a dark Hybrid Mind visual lead and structured copy. Each Draft carries a section `หมายเหตุสำหรับผู้ดูแล — ต้องตรวจรับก่อนเผยแพร่`. WordPress saved/read them back with no reported warnings. Comments for these pages remain closed.

**Why draft:** User has not chosen an authorized public contact channel. Privacy policy cannot be called a complete approved legal notice until actual provider retention, cookie and personal-data processing are verified. New page creation deliberately used WordPress Draft status, per default editorial gate; this plan is not an authorization to publish them.

## About #1 backup and readback

- Exact old Published About markup (415 chars) preserved at [L1 About Prechange Backup](../wordpress/L1_ABOUT_PRECHANGE_BACKUP_2026-10-09.md), commit `2a099d8624037e27ee54acd2720e8113198d66d1`.
- Guard compared live placeholder and original backup immediately before the change; no concurrent edits detected.
- `pages.update(id=1)` changed only full About content and excerpt; kept Published and original permalink. Updated block markup: **4,803 chars**.
- Independent WordPress edit/view readback: site title and tagline, mission, two core/columns pairs, editorial principles and article links present; old WordPress sample text absent.

## Footer link to verified published page

- Backed up current Assembler Footer exactly **2,655 chars** at [L1 Footer Prechange Backup](../wordpress/L1_FOOTER_ABOUT_LINK_PRECHANGE_2026-10-09.md), commit `a7208c5de5c68875b5ad3e6a36c4c4a39d55106a`.
- Optimistic prewrite reread matched backup byte-for-byte; inserted **one** `เกี่ยวกับ HYBRID MIND` link to `https://hybridmind.online/เกี่ยวกับ/` within the EXPLORE section.
- Independent `template-parts.get` readback shows Footer **2,843 chars**, with exactly **one** About link, unchanged existing four category/topic links and preserved branding/copyright. No Draft links placed in Footer.
- Did **not** change the Header navigation, shared Single/Pages templates, other articles, homepage, chatbot plugin, site indexing, or visibility.

## QA and release gate

| Requirement | Result | Evidence / why |
| --- | --- | --- |
| Published About placeholder removed | **PASS** | WordPress #1 edit/view readback |
| About remains published / permalink retained | **PASS** | `pages.get(id=1)` |
| Four trust-policy pages exist with accurate Draft status | **PASS** | `pages.create` and independent `pages.get(edit/view)` |
| Contact has authenticated real/public endpoint | **UNKNOWN / HOLD** | Owner has not authorized any email or Facebook Page URL |
| Privacy legal/provider/cookie and retention review complete | **UNKNOWN / HOLD** | Typhoon retention, analytics/cookie inventory, data controller and contact not verified |
| Editorial/Affiliate policies reviewed and separately approved | **PENDING** | Draft content prepared; not published |
| Footer links to working Published About | **PASS — CMS structural** | `template-parts.get`; click QA still required |
| Footer links to Privacy/Contact/Editorial/Affiliate | **HOLD by design** | Those pages are still Draft |
| 320/375/390/768/1280 authenticated browser QA | **UNKNOWN** | Site Coming Soon blocks normal public preview; no full viewport evidence |
| Coming Soon still active, launch unapproved | **PASS** | `manage-site.status` |
| Other posts/pages unaffected | **PASS at operation scope**, not broad visual guarantee | Only #1 page updated; #67–70 created; Footer template part updated |

## Required owner decision (one missing input)

**Choose the actual public contact route and provide its full value: a dedicated HYBRID MIND Facebook Page URL or a public contact email address.** Never expose WordPress admin email or private mailbox as public contact without explicit owner authorization.

Only after that:
1. Replace Draft #67's temporary contact copy with verified clickable details and design a tested contact flow.
2. Confirm controller/provider/retention/cookies and data subject request route; update Privacy #68 without false guarantees or personal data exposure.
3. Editorially review policy #69 and affiliate #70; approve page publication **separately** and switch Draft → Published only after direct authorization.
4. Add appropriate Published links to Footer, back up template before each change, click-test.
5. Continue L2 content cleanup and L3 browser QA before an eventual explicit **public launch** decision.

## Evidence

- [Public Launch Readiness Plan V1.0](HYBRID_MIND_PUBLIC_LAUNCH_READINESS_V1_2026-10-09.md)
- [Project Control](../PROJECT_CONTROL.md)
- WordPress #1 About: https://hybridmind.online/เกี่ยวกับ/
- Draft previews (login required):
  - https://hybridmind.online/?page_id=67&preview=true
  - https://hybridmind.online/?page_id=68&preview=true
  - https://hybridmind.online/?page_id=69&preview=true
  - https://hybridmind.online/?page_id=70&preview=true

**Status: L1 substantive content production COMPLETE; OWNER CONTACT / PRIVACY and BROWSER QA gates OPEN; PUBLIC LAUNCH HOLD.**
