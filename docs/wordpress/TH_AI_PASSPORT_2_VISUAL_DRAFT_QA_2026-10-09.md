# HYBRID MIND — TH-AI Passport 2.0 Visual Interactive Draft QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online (WordPress.com Atomic site ID 257844857)  
**Reference design:** [AI ERA 2026 Post #55](https://hybridmind.online/2026/10/09/ai-era-2026-agent-tools-a2a/)  
**Release rule:** UNKNOWN ≠ PASS  
**Status:** **WORDPRESS DRAFT CREATED; CODE/CONTENT READBACK PASS; BROWSER VISUAL QA UNKNOWN; PUBLICATION HOLD.**

## Deliverable

- **New WordPress Post #57**, `status=draft`
- Title: **TH-AI Passport 2.0 — จาก AI Chatbot สู่ AI Agent | Visual Interactive**
- Slug: `th-ai-passport-2-gemini-enterprise-visual-guide`
- [Draft preview (login required)](https://hybridmind.online/?p=57&preview=true)
- [Edit post](https://hybridmind.online/wp-admin/post.php?post=57&action=edit)
- Categories: **AI News** (`26694707`), **Explained** (`26694708`)
- No duplicate featured image: the infographic Hero is rendered inside the visual page; `featured_media=0`.
- WordPress saved a **55,892-character** Gutenberg markup body containing a **single `core/html` block** with an escaped `iframe srcdoc`, a parent resize/anchor bridge, an accessible standalone reference paragraph, and an editorial disclaimer.
- Visual page source is a self-contained **43,588-character HTML document**, using CSS graphics and one inline JS script. No third-party images/scripts embedded.

## Visual and interactive inventory

1. Hero concept visual with LEARN → EARN → DO illustrated workflow
2. Distinct metrics: 5 million original-program capacity, 500k new reported rights, up to 10 months, 1,000 points
3. Separate press-conference usage figures: 1.57 million registrations, 745,000 users, 17.3 million prompts
4. Two-mode conceptual toggle: AiPASS 1.0 chatbot versus AiPASS 2.0 agent/workflow
5. Timeline: original 19 Aug, 9 Oct announcement, 2 Nov reported deadline, 9 Nov reported activation date
6. Interactive points laboratory: seven activity values from AiPASS website, +/− controls, reset and presets, visual progress to 1,000 points, **not real earned points**
7. Four-item local eligibility self-check: nationality/age, identity app, account; no personal data submitted
8. Three-question quiz and score with explanations; points unrelated to AiPASS
9. Three-tier learning route, citations, uncertainty labels and editorial cautions

## Fact sourcing and editorial constraints

- **AiPASS official** https://aipass.go.th/ and https://aipass.go.th/about : TH-AI Passport original target 5 million signups, Thai nationals age 15+, identity via Thang Rath/ThaID, Google/Microsoft/Apple account, seven learning activity point values including short clip 40/video 100/docs 50/article 30/quizzes 25+25+50.
- **9 Oct 2026 press conference report** https://www.bangkokbiznews.com/tech/ai/1255683 : new Gemini Enterprise **500,000** rights; threshold **1,000 points**; application **9 Oct–2 Nov 2026** or until capacity; activation **9 Nov**, free up to **10 months**; reported 1.57m registrations, 745k actual users and 17.3m prompts by 8 Oct.
- **8 Oct advance/rumor report** https://mgronline.com/cyberbiz/detail/9690000097990 is explicitly earlier than the press announcement; the article was edited so it does **not** label the 9 Oct announced figures as mere unsupported rumor. Distinguishes reported announcement from unverified actual eligibility/remaining inventory.
- **Google docs** https://docs.cloud.google.com/gemini/enterprise/docs/workflow-builder : Workflow Builder can create agents/workflows with tools/connectors, subject to provisioning/admin policies. The exact **edition, entitlement, limits and permissions allocated through AiPASS remain UNKNOWN**.
- **Important:** The article is a **third-party explainer**, not AiPASS or government registration, and makes no claim that a simulated score equals approved access. No automatic applications or external transactions occur.

## WordPress connector and static test results

| Check | Status | Evidence |
| --- | --- | --- |
| Post #57 is DRAFT with exact slug/title | PASS | WordPress posts.create/posts.get |
| WordPress created without content warnings | PASS | `_content_warnings` absent |
| Post edit raw HTML saved fully | PASS | **55,892 characters**, independent readback |
| WordPress rendered view has iframe and parent controller | PASS | posts.get(context=view) |
| Source references and current press stats saved | PASS | raw readback |
| CSP meta inside `srcdoc`, opaque sandbox without `allow-same-origin` | PASS **source level** | file parse/readback |
| Original #55 unchanged | PASS | Published, `modified=2026-10-09T12:31:17` |
| Original game article #52 unchanged | PASS | Published, `modified=2026-10-09T10:52:15` |
| WordPress site visibility | PASS — Coming Soon / unlaunched remains unchanged | site status |
| HTML: 9 sections, 6 citation cards, 7 activity values, 3 quiz questions, 9 valid internal anchors | PASS — static | BeautifulSoup parse |
| JavaScript syntax | PASS — static | Node `--check` |
| CSS stylesheet parse | PASS — static | tinycss2, 0 parser errors |
| No JS `fetch`, XHR, WebSocket, localStorage, cookies or `eval` present in authored script | PASS — static only | source inspection |
| iframe parent bridge in local Chromium browser | **UNKNOWN** | Chromium returned `ERR_BLOCKED_BY_ADMINISTRATOR` for both file and local HTTP |
| Actual button/calculator/quiz interaction in signed-in WordPress browser | **UNKNOWN** | requires owner screenshot/manual interaction |
| Full mobile 320/375/390/768/1280 CSS px layout | **UNKNOWN** | no actual browser QA |
| Accessibility/performance/security runtime audit | **UNKNOWN** | not independently tested |
| Public launch / publication | **HOLD** | not authorized |

## Security scope

`iframe sandbox="allow-scripts allow-popups"` without `allow-same-origin` or `allow-popups-to-escape-sandbox`. Meta CSP sets `default-src 'none'`, `connect-src 'none'`, `form-action 'none'` and permits only the authored inline JS/CSS. This is a **configuration-level precaution**, not a substitute for runtime CSP/browser security tests. External reference links use `rel="noopener noreferrer"`.

The iframe is a complete GPT-generated lesson **not** a dynamic Typhoon-generated Widget. No Visualize Engine, A2A Worker, privileged widget API, autonomous publishing or paid transaction was deployed. The production Chat/Assembler setup remains in place.

## Visual QA requested next

Have the owner open the login-protected Draft preview on the actual Android browser and:
1. Confirm the entire dark Hero fits horizontally and the mobile top navigation can scroll if necessary.
2. Toggle `1.0 · Chatbot` and `2.0 · Agent`; descriptions and steps must change.
3. On calculator, select `วิดีโอ 10 เรื่อง` → must display **1,000**; reset → **0**.
4. Check all four items → local status **เตรียมข้อมูลครบ 4 รายการแล้ว** without sending personal information.
5. Answer Quiz question 1 with the **second** option, verify feedback, advance and restart.
6. Scroll to the bottom, confirm source links and no clipping or inner scrolling; attach one top and one lower screenshot.

**Decision:** WordPress Draft/HTML static checks **PASS**. Live Visual Interactive QA **UNKNOWN**; keep post as Draft and site as Coming Soon. No public launch or publication.
