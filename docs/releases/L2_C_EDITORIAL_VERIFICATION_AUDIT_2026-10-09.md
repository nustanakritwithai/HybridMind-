# HYBRID MIND — L2-C Editorial Verification Audit

**Date:** 2026-10-09 (Asia/Bangkok)
**WordPress:** `hybridmind.online` (site ID `257844857`)
**Scope:** READ ONLY content and evidence review of Posts #31, #52, #55, #57, with source/structure checks. No WordPress edits, publication, theme or visibility changes authorized by this work.
**Release status:** PRE-LAUNCH / HOLD; UNKNOWN != PASS.

## Executive audit matrix

| Workstream | CMS source integrity | Claim / attribution | Interactive / mobile | Editorial gate |
|---|---|---|---|---|
| C1 GS20 #31 | PASS (readback) | FAIL missing original vendor listing; other claims explicitly qualified | Visual/browser UNKNOWN | HOLD |
| C2 AI game tools #52 | PASS (readback) | Core technical explanation consistent with official docs; direct official citations absent (gap) | Featured image browser UNKNOWN | HOLD pending sources/visual QA |
| C3 AI ERA #55 | PASS (readback) | A2A/MCP/Computer Use descriptions supported by linked official references | Code structure PASS; actual clicks/scroll/copy/quiz UNKNOWN | HOLD pending interactive/mobile QA |
| C4 TH-AI Passport #57 | PASS (Draft readback) | FAIL precision: '5 million registration rights' vs official target '5 million people'; headline news metrics otherwise corroborated by dated reporting; product edition & individual eligibility UNKNOWN | Code/photo structure PASS; browser test UNKNOWN | HOLD; do NOT publish |

These statuses apply only to listed checks. A PASS in code markup does **not** establish functional PASS in a signed-in browser.

## Evidence fingerprint / snapshot

| ID | Title brief | Status | Modified (WP site time) | Raw content characters | FNV-1a/32 content fingerprint (noncryptographic) |
|---|---|---|---|---:|---|
| #31 | GS20 Smart Glasses | publish | 2026-10-09T04:35:17 | 9,739 | `01a9becd` |
| #52 | AI game development tools | publish | 2026-10-09T10:52:15 | 10,286 | `0d6ab95e` |
| #55 | AI ERA 2026 Interactive | publish | 2026-10-09T17:47:46 | 50,842 | `2c3ac838` |
| #57 | TH-AI Passport 2.0 Interactive | draft | 2026-10-09T14:43:11 | 62,069 | fingerprint not captured in this report |

Fingerprints are for quick change detection; they are not cryptographic guarantees. WordPress content was read using `posts.get(context=edit)`.

## C1 — GS20 Smart Glasses, Post #31

**PASS: transparency already present.** The 602 THB figure is explicitly dated October 9, 2026 and described as vendor-provided, not a contemporary verified selling price. Text warns that advertised AI translation, photochromic/auto-focus language, UV protection, audio, app/Thai support and battery labeling have not been independently tested or confirmed. AI illustrations are prominently disclosed; Featured Image #26 is 1254×1254 PNG, with alt text explicitly saying it is AI-generated, not a tested product photo. Three in-body infographics carry explanatory alt text.

**FAIL: commercial evidence / traceability.** The body has **0 outbound anchor links**. There is no direct link or archived evidence of the precise Shopee product listing and option on which 602 THB and hardware specs were based. This prevents independent reproduction of vendor claims; retail listings from other merchants or similar model names are not interchangeable proof.

**Required proposal (not executed):**
1. Owner provides original vendor URL / evidence of product variant, options, captured date, price and exact quoted claims.
2. Add a visibly dated “seller statement / unverified” source link and, if needed, qualify title or label the 602 THB figure as an *illustrative vendor observation* instead of a universal GS20 price.
3. Confirm representative imagery does not depict absent features (screen/AR HUD); use only real product photos if source provenance/rights are documented. Preserve existing AI illustration disclosures.
4. Test featured image crop, three in-body infographics and phone layout before release.

**Editorial outcome:** HOLD. Missing provenance is an editorial FAIL; it is *not* proof that the quoted price or seller claims were false.

## C2 — AI game tools, Post #52

**PASS on technical direction, with source limitations:** Post differentiates first-person experience from general capabilities; Godot scenes/nodes/physics, Unreal Blueprint/Lumen/Nanite, Blender Python scripting and conditional Unreal licensing match their official published descriptions at the general level. It correctly avoids promising AAA visuals automatically and says Unreal is free to start for many developers (not always paid). Source documents:
- Godot nodes/scenes: https://docs.godotengine.org/en/stable/getting_started/step_by_step/nodes_and_scenes.html
- Godot MIT license: https://godotengine.org/license/
- Unreal Lumen: https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine
- Unreal Nanite: https://dev.epicgames.com/documentation/unreal-engine/nanite-in-unreal-engine
- Unreal current license: https://www.unrealengine.com/license
- Blender Python documentation: https://docs.blender.org/api/main/info_quickstart.html

**Editorial gap:** Post #52 has **0 outbound anchor links** to the relevant official technical/licensing documentation. Author assertions about subjective efficiency are personal experience, not externally verified benchmarks. Featured Image #51 is a 1536×1280 JPEG Thai infographic with alt text; actual image visual/crop checks are **UNKNOWN**.

**Proposal (not executed):** Add 4–6 footnoted official links adjacent to technical claims, preserve original personal voice, and add explicit “experience, not controlled performance comparison” note if quantitative effects might be inferred. Browser/mobile image QA remains required.

**Editorial outcome:** Source additions recommended / visual HOLD; no material technical contradiction established from the examined official sources.

## C3 — AI ERA 2026, Post #55

**Reference check:** The four source links in the saved Visual HTML point to accessible official or first-party pages:
- A2A: https://a2a-protocol.org/
- Linux Foundation A2A release: https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year
- MCP: https://modelcontextprotocol.io/
- OpenAI computer use: https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use

Definitions distinguish agent-to-tool (API/MCP), control of graphical interfaces (Computer Use), and agent-to-agent delegation (A2A); these are broadly consistent with primary references.

**Static inventory PASS only:** 50,842-character post, `iframe srcdoc` with `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"` and `allow="clipboard-write"`. Embedded source contains path switching, shopping example cases, prompt variations, copy-to-clipboard fallback, three-question quiz and postMessage height/anchor bridge. Quick static check found no duplicate HTML IDs and no unresolved literal `getElementById` targets (38 IDs, 28 literal calls). This does NOT prove buttons actually work.

**Must test on authenticated browser (UNKNOWN):** all [data-path] options; [data-case] examples; prompt switching and clipboard success/failure on Android; each quiz correct/wrong/restart state; anchor scrolling/iframe height; 320/375/390/768/1280 CSS px and keyboard focus. Check that A2A examples are hypothetical where provider capability is not verified. Avoid presenting source fetch restrictions as broken outbound links.

**Editorial outcome:** Core content/reference PASS; interactive/mobile QA HOLD.

## C4 — TH-AI Passport 2.0, Draft Post #57

**Primary distinction confirmed:**
- Official AiPASS about page targets at least **5,000,000 people aged 15+** in the original initiative; it does NOT establish 5 million Gemini Enterprise seats.
  https://aipass.go.th/about
- News reports dated Oct 9, 2026 describe **500,000 Gemini Enterprise seats**, **1,000 learning points** as qualification to apply, **Oct 9–Nov 2, 2026** application window (or until quota exhaustion), **Nov 9** start, **up to 10 months**, plus 1.57 million registered, 745,000 active AI users and 17.3 million prompts as of Oct 8.
  https://www.bangkokbiznews.com/tech/ai/1255683
  https://www.posttoday.com/ai-today/750158
- Official AiPASS's existing 100-point membership tier and official activity scores differ from the new 1,000-point Gemini seat eligibility. The cited official site supports short video 40, standard video 100, document 50, article 30, assessments 25/25/50 per relevant unit.
  https://aipass.go.th/about
- Official Google Gemini Enterprise Workflow Builder docs confirm relevant workflows/agent features exist *within authorized editions and permissions*; they do NOT prove the AiPASS allotment has every such feature. Some editions have restrictions; exact AiPASS edition and quotas remain UNKNOWN.
  https://docs.cloud.google.com/gemini/enterprise/docs/workflow-builder
  https://docs.cloud.google.com/gemini/enterprise/docs/workflow-builder/quotas-and-limits

**Editorial FAIL C4-01 — incorrect unit / wording.** The Draft's main callout uses **“เว็บไซต์ AiPASS ยืนยันเป้าหมายเดิม 5 ล้านสิทธิ์”**, its statistic blurb says **“จำนวนสิทธิ์ลงทะเบียนของโครงการเดิม”**, and quiz explanation uses comparable wording. However the cited government program describes a target of **5,000,000 people**. The current text correctly separates 500,000 Gemini Enterprise allocations from the larger original program, but must correct the first figure's *unit and nature* consistently across callout, stat panel and quiz explanation. Recommended language: **“เป้าหมายเดิม: ยกระดับทักษะคนไทยอย่างน้อย 5 ล้านคน (ไม่ใช่โควตา Gemini Enterprise)”**. Not changed yet.

**Editorial UNKNOWN C4-02:** Exact Gemini Enterprise edition, practical per-account entitlements, remaining quota, accepted application flow, rights and provider conditions are not established from an official AiPASS allocation/contract source. News reports corroborate announced general offer, not actual entitlement of individual users. No guarantee of automatic allocation.

**Static UI evidence:** Post is Draft and has Featured Media #63 (AI cover PNG 1672×941, alt expressly says AI-generated); exactly three embedded editorial photographs, saved via media #58–60 and Jetpack URLs, with clear alt captions and non-official-activity disclaimers. Original image source/license evidence is stored at `docs/wordpress/TH_AI_PASSPORT_2_REAL_PHOTOGRAPHY_QA_2026-10-09.md`; source photographs are attributed to Pexels photographers. The page uses scoped iframe CSS, sandbox and CSP with photo host allowlist, locally computed eligibility checklist, points calculator, 1.0/2.0 mode, three-question quiz and height/anchor bridge.

**Static calculator consistency:** Official activity schedule matches code: short clip=40, 5–10 minute video=100, document=50, article=30, pre/mid/post=25/25/50. Video preset sets `video=10` and should result in **1000**; Reset zeros all entries. This is static expected behavior, not a witnessed browser PASS. The calculator does not establish real recorded AiPASS points and discloses this appropriately.

**Browser QA UNKNOWN:** Full-bleed Featured cover (without white gap), photographs load/crop/captions, colored text contrast, 1.0/2.0 switching, preset 10×100=1000, Reset=0, mixed preset, checkbox checklist, all quiz branches and reset, iframe height/anchor scroll, mobile 320/375/390/768/1280. Do not publish on code-level PASS.

**Outcome:** Article release gate HOLD until C4-01 language fix (with separate precise owner permission), latest terms confirmed, visual interactive browser QA and explicit separate publication approval.

## Suggested approval-sized change batches (not yet authorized)

**Batch C1:** Post #31 — add dated seller listing citation / source details only; preserve title/body/visual structure unless independently approved.  
**Batch C2:** Post #52 — add 4–6 official technical links and concise experience-vs-benchmark qualifier; no visual rewrite.  
**Batch C3:** Post #55 — no editorial rewrite needed based on current static evidence; perform authenticated interactive/mobile QA, propose only narrowly proven fixes.  
**Batch C4:** Post #57 — correct three occurrences of “5 million registration rights” and quiz answer narrative to “at least five million people (program target)”; preserve 500,000 Gemini offer and all widgets, photos and status=DRAFT. Review actual post change snapshot before any eventual approved write.

For each future write: re-read source and backup/revisions, guard against concurrent editors, change only the approved block/fields, independent before/after readback, then signed-in browser tests. NEVER conflate authenticated Preview with anonymous Public. UNKNOWN != PASS.

## Outstanding release decisions

- L1 Contact/Privacy/Editorial/Affiliate policies — HOLD until owner review.
- L2-B B3 AI News archive empty and linked — HOLD; #57 may not be published implicitly.
- L2-C audit performed, but **not an approved content-repair action**.
- L3 responsive browser QA, L4 Typhoon guest safety/cost, L5 recovery/SEO and L6 Public Launch — not cleared.
- WordPress site remains `coming_soon / unlaunched`, Public Launch NO GO.

**No Production WordPress mutation was performed during this L2-C audit.**
