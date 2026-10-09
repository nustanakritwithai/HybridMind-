# HYBRID MIND — Visual-First A2A Pilot / Implementation Status

**Date:** 2026-10-09 (Asia/Bangkok)  
**WordPress:** https://hybridmind.online, site ID 257844857  
**Current system:** Gutenberg / Assembler / Typhoon Chat v0.2.2 / Uncanny Automator v7.7.0 installed.  
**Top rule:** UNKNOWN ≠ PASS.

## Decision
The owner will **not write and decorate each article in WordPress**. AI agents should repeatedly research, fact-check, visually storyboard, build visuals and WordPress Drafts. Gutenberg is only the output format behind an automated visual-first publishing pipeline.

Do not confuse these:
- **A2A workflow contract / manifest**: designed and versioned.
- **Reusable renderer source**: authored in GitHub, executable by a Node runner after validation.
- **WordPress draft prototype**: produced in current turn from the manifest through a deterministic mapping, then independently read back.
- **Automated unattended trigger/transport**: NOT DEPLOYED; no recurrence, service credentials, queue or Agent2Agent network endpoint configured.
- **Public auto-publish:** NOT APPROVED.

## Artifacts on main

1. [Visual-first A2A architecture](VISUAL_FIRST_A2A_PUBLISHING_V0.1.md)
2. [JSON Schema](../../contracts/visual-article-v1.schema.json) — typed content modules and editorial gates
3. [Deterministic Gutenberg Renderer](../../tools/visual_article/render_gutenberg.mjs) — no arbitrary model HTML
4. [Renderer Smoke Tests](../../tools/visual_article/test_renderer.mjs) — for a Node CI runner, **not executed in this session**
5. [Responsive Visual Article Style Kit](../../tools/visual_article/visual-article.css) — **not deployed to live Global Styles yet**
6. [Pilot Visual Manifest](../../examples/ai-game-tools.visual-article.json) — preserves source owner essay

## Pilot WordPress preview

- **Draft post #54**, slug `visual-pilot-ai-game-tools`
- Title: `Visual Pilot — บทเรียนจากการสร้างเกมด้วย AI: AI เก่งแค่ไหน ก็ต้องใช้เครื่องมือให้ถูกงาน`
- Authenticated preview: `https://hybridmind.online/?p=54&preview=true`
- Edit link: `https://hybridmind.online/wp-admin/post.php?post=54&action=edit`
- Status: **DRAFT**
- Existing original **Published post #52** is **unchanged** (`modified=2026-10-09T10:52:15`, featured image #51).
- A2A manifest contains 15 modules: embedded full-res infographic, 10-second summary, four option comparison, process sequence, decision cards, checklist, pull quote, and seven original narrative sections.
- All **63 original article paragraphs** transferred to Draft; source image from WordPress Media #51 embedded at native ratio (not duplicated as featured image).

## Live WordPress Draft readback

| Check | Result | Evidence |
|---|---|---|
| Draft created with correct slug/title | **PASS** | WordPress posts.create/posts.get |
| No publication | **PASS** | `status=draft` |
| Pilot original source #52 unchanged | **PASS** | WordPress posts.get |
| Source image #51 embedded with alt text | **PASS** | Raw and server-rendered content |
| Summary/comparison/process/decision/checklist/quote classes | **PASS** | WordPress posts.get |
| 63 narrative paragraphs transferred | **PASS** | Manifest extraction before save and content markers after readback |
| WordPress output preserved visual columns and image | **PASS** | Server-rendered blocks |
| Renderer `.mjs` runtime unit tests | **UNKNOWN** | Test source committed; not executed by Node/CI in this turn |
| 320/375/390/768/1280 authenticated visual screenshot matrix | **UNKNOWN** | Coming Soon blocks anonymous screenshot; owner has not previewed draft |
| Accessibility/contrast/click targets in actual browser | **UNKNOWN** | Requires signed-in QA |
| Automated recurring A2A job | **NOT DEPLOYED** | No schedule, connected agent secrets, or queue |
| Public Launch | **HOLD** | Coming Soon remains enabled |

## A2A handoff expectations

Every run must deliver the following as independent immutable outputs:

```text
research.json
claims.json
visual-article.json             # schema-validated manifest
assets.json                     # media IDs, credits, licenses and alt
visual-article.gutenberg.html   # deterministic render
draft_receipt.json              # wp_post_id, status=draft, source digest
qa-report.json                  # PASS / FAIL / UNKNOWN per gate
```

Use `trace_id` + `article_id` as idempotency keys; never create duplicate posts on retry. Reject unknown blocks, remote arbitrary scripts, unsourced prices and labels that imply an AI-generated product render is a verified photograph.

## Next execution priorities

1. Owner reviews signed-in Draft #54 visually and confirms what visual modules look good vs excessive. A2A visual-only approval does NOT approve publishing.
2. Fix any block validation or responsive issues in renderer/style kit, with screenshot evidence. Avoid editing Published post #52.
3. Run the committed Node tests in a controlled CI job. Validate artifact against JSON Schema 2020-12 and compare deterministic output to WordPress Draft readback.
4. Add a narrow authenticated WordPress Draft-publisher adapter with secured per-run credentials and idempotency; it may write Drafts only.
5. Configure recurring trigger **after choosing cadence and approving quotas**. The trigger may be Uncanny Automator, Github Actions or a dedicated A2A orchestrator, but installed plugins alone do not mean automations are running.
6. Introduce Review Dashboard and log source, model version, prompt version, manifest digest, media rights and approval.
7. Request explicit owner approval before any auto-publication or public website launch.

**Gate:** VISUAL-FIRST CONTRACT/PILOT WP DRAFT READBACK PASS; AUTOMATED A2A JOB UNKNOWN/NOT DEPLOYED; END-USER PREVIEW/RESPONSIVE QA UNKNOWN; PUBLIC PUBLISH HOLD.
