# HYBRID MIND — L3 Authenticated Interactive & Responsive QA Matrix

**Prepared:** 2026-10-09 (Asia/Bangkok). **Status: PENDING / READ ONLY PLAN.** Site remains Coming Soon; anonymous browsing shows a splash page and is not valid content QA.

## Test setup

- WordPress account with authorized signed-in preview (no change to site visibility or post status).
- Device width set: **320, 375, 390, 768, 1280 CSS px**; preferably a real Android plus desktop browser for keyboard.
- Use real browser DevTools console and visible screenshots with device/viewport, URL, timestamp, and result. Capture failing user journeys and console logs only without tokens, session cookies or private data.
- Test #57 via authenticated Draft preview, not an anonymous public URL.
- Check actual click/focus/scroll. Reading HTML event listeners does not constitute runtime PASS.

## Cases / expected outcomes

| ID | Page | Action / expected | Status |
| --- | --- | --- | --- |
| H01 | Homepage #16 | At all widths no sideways page scrolling or overlapping header | UNKNOWN |
| H02 | Homepage #16 | New #55 card appears in Latest / Explained, card opens correct URL | UNKNOWN |
| H03 | Homepage #16 | Topic cards and mobile navigation activate expected links, footer accessible | UNKNOWN |
| G01 | #52 game article | Featured image #51 fully visible, legible Thai text, no crop on mobile | UNKNOWN |
| G02 | #52 game article | Six newly added official-document links open intended source tabs without broken markup | UNKNOWN |
| A01 | #55 AI ERA | Change all tool/GUI/A2A path tabs; each changes title, description and steps | UNKNOWN |
| A02 | #55 AI ERA | Change manual/agent shopping scenarios and verify different steps and caveat | UNKNOWN |
| A03 | #55 AI ERA | Change prompt variant and click Copy; paste matches selected text; failure feedback if denied | UNKNOWN |
| A04 | #55 AI ERA | Quiz Q1 correct index 1, Q2 correct 0, Q3 correct 2; wrong branch displays feedback | UNKNOWN |
| A05 | #55 AI ERA | Quiz Next disabled before answer, enabled after; scoring correct; Restart resets | UNKNOWN |
| A06 | #55 AI ERA | Anchor navigation, iframe auto-height, no nested scrollbar or clipped quiz on Android | UNKNOWN |
| A07 | #55 AI ERA | Keyboard focus visible, usable touch targets; 320–1280 CSS px | UNKNOWN |
| P01 | Draft #57 AiPASS | Featured cover #63 full bleed, no white title-space gap or unwanted crop | UNKNOWN |
| P02 | Draft #57 AiPASS | All three editorial photographs load with captions, no misleading event affiliation | UNKNOWN |
| P03 | Draft #57 AiPASS | Chatbot/Agent mode switch updates text and step cards | UNKNOWN |
| P04 | Draft #57 AiPASS | Reset calculator => 0; preset Videos 10 => 1,000; preset Mix -> expected sum (verify from source) | UNKNOWN |
| P05 | Draft #57 AiPASS | Each +/- changes counts and total, visual progress bounded at 100%, no account access | UNKNOWN |
| P06 | Draft #57 AiPASS | Eligibility checklist counts 0–4, has no false guaranteed seat promise | UNKNOWN |
| P07 | Draft #57 AiPASS | Three quiz questions, correct/wrong feedback, result, restart all work | UNKNOWN |
| P08 | Draft #57 AiPASS | All internal anchors, iframe height, color contrast and source cards on all widths | UNKNOWN |
| P09 | Draft #57 AiPASS | New language correctly says >=5m Thai people vs reported 500k new Gemini seats in callout/stat/quiz | UNKNOWN |
| S01 | Site visibility | Coming Soon on anonymous session remains intact; internal preview permitted only for authorized users | UNKNOWN |

**Required additional QA for #31:** Photo #26 and all three in-body AI infographics not clipped; every AI illustration disclosed; seller data stays qualified; mobile widths 320–1280.

## Gate decision rule

Use PASS only for witnessed in-browser execution with recorded screenshot/console and expected outcome. FAIL for an observed defect. UNKNOWN when no actual browser attempt has occurred or evidence is incomplete. HOLD for unapproved content/publication actions. Don't infer link failure from external web-fetch restrictions. Don't turn off Coming Soon or publish draft #57 just to run tests.

**Current L3 overall:** UNKNOWN / PENDING.
