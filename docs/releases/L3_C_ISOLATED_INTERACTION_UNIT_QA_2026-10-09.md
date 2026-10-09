# HYBRID MIND — L3-C Isolated Interaction Unit QA

**Checkpoint:** 2026-10-09 (Asia/Bangkok)
**Target:** WordPress Atomic Site ID `257844857`, https://hybridmind.online
**Mode:** Read WordPress source only; execute extracted JS on an **isolated mock DOM** in an ephemeral V8 evaluator; no guest login, no network calls, no WordPress mutation.
**Rule:** UNKNOWN != PASS.

## Latest live code IDs

- AI ERA Post **#55**, status `publish`, modified `2026-10-09T17:47:46`.
- TH-AI Passport Post **#57**, status `draft`, modified `2026-10-09T18:31:53`.

For each, fetch `posts.get(context=edit)`, read raw Gutenberg content, extract the `iframe srcdoc` attribute, decode HTML entities, select the actual JS logic and instantiate a minimum document shim. This runs the page's own event listener callbacks or calculator functions, rather than merely checking that source text or answer keys exist. The mocked DOM supplies elements, `textContent`, `style`, `children`, button click callbacks and disabled/hidden state. No real `iframe`, CSS layout or browser permission system is present.

## Quiz #55 — interaction unit sequence

| Case | Observed mocked DOM state | Outcome |
| --- | --- | --- |
| Initial render | `คำถาม 1 จาก 3`; three answer buttons; Next disabled | PASS |
| Q1 select correct option index 1 | Shows `✓ ถูกต้อง`, Next enabled | PASS |
| Q2 select wrong option index 2 | Shows `✕ ยังไม่ใช่`; no correct-score increment | PASS |
| Q3 select correct option index 2 | Enables completion | PASS |
| Finish | Score `2/3`; active quiz hidden; result shown | PASS |
| Restart | Question returns 1/3, selection map empty; Next disabled | PASS |

**Result:** Isolated callback and quiz-state **PASS**. Real browser, keyboard focus, sandbox and scrolling still UNKNOWN.

## TH-AI Passport #57 — calculator unit tests

Extracted the actual `act` array, `counts`, `recalc()` and `setCount(id,value)` logic, called with mock `document` and read DOM outputs:

| Case | Observed output | Result |
| --- | --- | --- |
| Empty initial state | Total `0`, progress `0%` | PASS |
| Set videos to 10 | Total `1,000`, progress `100%` | PASS |
| Set videos to 0 | Total `0` | PASS |
| Mixed preset values: video5/short5/doc4/article2/pre1/mid1 | Total `1,010`, progress capped at `100%` | PASS |
| Negative and excessive counts | `setCount('video',-4)→0`; `setCount('video',1000)→99` | PASS |

The mixed preset *intentionally exceeds* the simulated 1,000-point target; that alone is not a bug. Source includes wording that points are a simulation, not an AiPASS award.

## TH-AI Passport #57 — interaction unit sequence

| Case | Observed mocked DOM state | Outcome |
| --- | --- | --- |
| Initial Quiz | Question 1 of 3; three answers; Next disabled | PASS |
| Q1 correct answer index 1 | Correct-feedback message, score `1 / 3` | PASS |
| Q2 incorrect answer index 2 | Wrong-feedback message, score unchanged | PASS |
| Q3 correct answer index 1 + finish | Final wording `คุณตอบถูก 2 จาก 3 ข้อ`, completed card visible | PASS |
| Restart | Question index 0, score 0, `0 / 3`, `answered=false` | PASS |

**Result:** Isolated JavaScript behavior **PASS**. This is stronger than syntax parsing alone but is still **NOT a real browser test**. The harness does not model WebKit/Chromium rendering, iframes, CSP enforcement, clipboard, touch hit targets, WP plugin CSS, Actual ResizeObserver, or web fonts.

## Hard boundaries / L3 gate

- **Browser + responsive across 320/375/390/768/1280 CSS px: UNKNOWN.**
- **Real iframe-height bridge, click targets, rich DOM CSS and images: UNKNOWN.**
- **Actual authenticated Draft #57 preview: UNKNOWN.** Anonymous preview still serves Coming Soon as designed.
- **Post #57 must remain Draft.** No content or site state changed.
- L3-C unit test milestone reached; **L3 release remains HOLD** pending authenticated visual/manual QA and documented screenshots.

Do not overstate this isolated unit pass as public website functionality PASS.
