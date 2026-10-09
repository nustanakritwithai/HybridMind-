# HYBRID MIND — L3-C Interactive Source Verification: Syntax, Quiz, Calculator

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online · WordPress.com Atomic ID 257844857  
**Mode:** WordPress READ ONLY + isolated JavaScript parsing / data assertions. **No browser or Production write**.  
**Gate rule:** UNKNOWN != PASS.

## Why this is not L3 browser PASS

The WordPress editor/REST readback supplies original Gutenberg and `iframe srcdoc` strings. The connected WordPress-page HTML viewer fetched the anonymous site and observed the WordPress.com `wpcom-coming-soon-body` splash; anonymous `/?p=57&preview=true` similarly did not yield Draft preview. There was **no authenticated browser with controllable viewport, console and click/touch interactions** in this execution environment. Do not use public Coming Soon removal as a workaround.

All findings below distinguish **syntactic/data assertions** from **user-visible functional QA**.

## Verified latest source snapshot

| Post | Status | Modified WordPress local | Iframe JS scripts |
| --- | --- | --- | --- |
| #55 AI ERA | `publish` | `2026-10-09T17:47:46` | 2 inner script tags |
| #57 TH-AI Passport | `draft` | `2026-10-09T18:31:53` | 1 inner script tag |

Extraction: `posts.get(context=edit)` for IDs #55 and #57, isolate `iframe srcdoc` and decode HTML attribute entities to original inner document, extract all `<script>...</script>` blocks, compile with JavaScript `Function` constructor without executing the page.

**Syntax: PASS on all 3 extracted JavaScript scripts.** No syntax exception raised. This does not execute event listeners, iframe cross-origin messaging or browser API permissions.

## DOM and control source assertions

- **#55:** 34 unique ID attributes, no duplicates, no missing targets among literal `getElementById(...)` and shorthand references checked; source contains path switch, scenario switch, prompt switch, clipboard copy, quiz and `ResizeObserver`. Source presence **PASS**, runtime **UNKNOWN**.
- **#57:** 37 unique ID attributes, no duplicates, no missing targeted DOM IDs among literal references checked; contains `recalc`, `setCount`, reset and video preset handlers, Chatbot/Agent mode switch, eligibility checklist, quiz, iframe height messaging. Source presence **PASS**, runtime **UNKNOWN**.
- `#55` iframe sandbox includes `allow-scripts allow-popups allow-popups-to-escape-sandbox`; `#57` includes `allow-scripts allow-popups`. Clipboard fallback, sandboxed iframe resizing and scrolling need actual cross-browser checks; do not infer success.

## Quiz data validity

Parsed the JavaScript quiz array **as data** and checked every `correct` value is an integer in the [0, options_length) range:

| Post | Q1 (0-based) | Q2 (0-based) | Q3 (0-based) | All in range? |
| --- | --- | --- | --- | --- |
| #55 | 1 | 0 | 2 | **PASS** |
| #57 | 1 | 0 | 1 | **PASS** |

These values are consistent with expected conceptual answers in the source; clicking a choice, updating scoring, rendering feedback and restarting remains **UNKNOWN**.

## Draft #57 learning-point model

Retrieved seven activity point rates directly from the saved embedded JavaScript:

| Activity | Points |
| --- | ---: |
| short clip | 40 |
| video 5–10 minutes | 100 |
| document | 50 |
| article | 30 |
| pre-learning assessment | 25 |
| mid-learning assessment | 25 |
| post-learning assessment | 50 |

Checks:
- Video preset 10 videos × 100 = **1,000**: calculation/data assertion **PASS**.
- Mixed preset encoded in the code is 5 videos + 5 short clips + 4 documents + 2 articles + 1 pretest + 1 midtest = **1,010**: calculation/data assertion **PASS**. Exceeding the demonstration goal of 1,000 is allowed in this source model and does not itself prove a bug.
- No explicit browser `fetch(...)` or `localStorage` calls found in the extracted `#57` core JS. This is **not** an independent network/privacy security audit.
- Reset handler source sets every activity count to zero before recomputing: expected outcome 0, but interactive Reset button **UNKNOWN**.
- Quiz progress, aria feedback, image load events, mobile touch and actual iframe-height updates **UNKNOWN**.

## Known outstanding release-critical browser tests

1. Authenticated homepage #16 at **320/375/390/768/1280 CSS px**, in particular 16:9 cropped cards, #55 card without Featured Image, mobile header and overflow.
2. #55 case/path/prompt choices, clipboard permissions or fallback, quiz wrong/correct/finish/restart, no nested scroll.
3. #57 Draft preview as site editor/owner (never guest): Full-Bleed cover, three editorial photos, title CSS/colors, simulator 10 videos→1,000 and Reset→0, quiz/checkbox/scroll.
4. Actual links, console exceptions, focus, alt/contrast, Android and desktop.
5. Document screenshot URL, viewport, test step, expected/actual, PASS/FAIL/UNKNOWN. Confirm no unrelated site/content modifications.

**Gate decision:** L3-C source integrity **PASS** for listed syntax and data checks; end-to-end interactive/browser **UNKNOWN/HOLD**.

**No WordPress writes, no publication, no launch.**
