# HYBRID MIND — Typhoon Chat Mobile Smoke Test

**Date:** 2026-10-09 (Asia/Bangkok), owner screenshot ~08:40 local  
**Website:** https://hybridmind.online/  
**WordPress ID:** 257844857  
**Homepage:** page #16  
**Rule:** UNKNOWN ≠ PASS

## Evidence
The website owner supplied an Android browser screenshot **after** the Typhoon chatbot replaced the former AI Engine widget on the homepage. The screenshot shows the Typhoon AI chat interface embedded in the actual homepage Hero, the message composer, a blue sent-message bubble and a Thai AI answer in the conversation area. The answer acknowledges it cannot access live news or real-time information, instead of presenting fabricated latest-news claims. The screenshot also shows the four-category visual home section beginning below the Hero.

The screenshot was supplied in the project conversation and **is not embedded or uploaded into this public GitHub repository**. Do not claim a screenshot artifact exists in GitHub.

## Independent CMS readback (same round)
- WordPress homepage #16: **PUBLISHED**, last modified `2026-10-09T08:31:05`.
- `[hybridmind_typhoon_chat]` present on homepage; old `[mwai_chatbot ...]` absent.
- Visual Hero and the four-category editorial sections retained.
- Original 18 top-level Gutenberg sections retained.
- Registered plugin **Hybrid Mind — Typhoon Chat v0.1.0**: **active**.
- Theme **Assembler** unchanged.
- WordPress site still **`coming_soon` / `unlaunched`**.
- Homepage content hash at readback `61afdfd7e39377a4dde8dde31e2929fe07ca6561`.

## QA gates
| Test | Status | Basis |
| --- | --- | --- |
| Typhoon widget is present in actual homepage | PASS | CMS readback + user mobile screenshot |
| Homepage user prompt receives Thai-language assistant reply | **PASS, one smoke test** | Owner-provided mobile screenshot |
| Responds cautiously about no live-news access | PASS for observed answer | Screenshot text; not a broad anti-hallucination validation |
| Homepage retains editorial sections and working theme | PASS for CMS structure | WordPress readback |
| Mobile layout is completely accessible, legible, no overflow at all widths | **UNKNOWN** | One screenshot is not a responsive matrix |
| Tiny text / nested panels | **VISUAL IMPROVEMENT CANDIDATE** | Small body text and multiple nested Hero/chat containers visible in screenshot; quantify in viewport tests before modifying |
| Guest use, actual public rate limits, safe API budget under load | **UNKNOWN / HOLD** | Screenshot does not prove guest or security behavior |
| News live-search / WordPress-grounded retrieval | **NOT CONFIGURED** | Bot itself states it cannot access fresh news |
| Public launch / Coming Soon release | **HOLD** | User approval for public launch not given |

## Next actions
1. Treat the basic Typhoon integration as an initial **working technical milestone** rather than full launch readiness.
2. Improve mobile readability: increase rendered chat body/font sizes, reduce nesting and redundant copy, check input and button widths, scrolling after sending, contrast, focus and on-screen keyboard.
3. Test at 320/375/390/768/1280 CSS px, screenshots before/after, and validate readability rather than relying on Gutenberg readback.
4. Prepare Typhoon-specific behavior instructions for Hybrid Mind, including dated evidence/source references, admission of unknowns and no unverified product claims.
5. Add retrieval from real WordPress news/articles as a distinct feature with source provenance before promising latest AI news; model-only chat is not live news search.
6. Test guest access, privacy/data policy, throttling, abuse and costs separately. Do not enable public chat or launch the site until approval.

**Decision: Chat prompt→reply first smoke test PASS. Full mobile UX and public launch gate NOT PASSED.**
