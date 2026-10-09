# HYBRID MIND — R1.2-D Responsive & Visual QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Scope:** WordPress.com Atomic site ID `257844857`, homepage `https://hybridmind.online/`, static page `#16`, Assembler theme, Hybrid Mind — Typhoon Chat v0.2.1.  
**Release rule:** **UNKNOWN ≠ PASS.**  
**Result:** **R1.2-D = PARTIAL / HOLD.** One Android real-device view has been sampled, production content/markup and responsive CSS have been inspected, and a real CSS-priority problem was found. Authenticated actual page render at specified 320 / 375 / 390 / 768 / 1280 CSS px has **not** been recorded.

## Evidence types and limits

- **E1 — Live WordPress.com authenticated readback:** `pages.get (edit/view)`, `page-sections.list`, `global-styles.get`, `templates.get`, `template-parts.get`, `navigation.get`, `categories.list`, `theme.active`, launch status.
- **E2 — Owner-supplied Android screenshots** in this ChatGPT project (including ~08:55 and ~09:54 local on 2026-10-09). These demonstrate that the production homepage UI and the Typhoon chatbot ran on **one real Android browser**. The images have not been copied into this GitHub file/repository. CSS-pixel viewport width is **not established**, and screenshots are cropped to chat areas; they do not prove full page, header/menu, footer, or desktop.
- **E3 — WPVibe unauthenticated production HTTP/HTML fetch** of `https://hybridmind.online/`: received `<body class="wpcom-coming-soon-body">` and **no homepage Hero/chat DOM** in body. It contains some Hero CSS in the `<head>`, which is **not** evidence that the homepage DOM was visible to that visitor.
- **E4 — Lighthouse/Google PageSpeed Insights mobile** on public `https://hybridmind.online/`: 91 Performance, 95 Accessibility, 100 Best Practices, 66 SEO; LCP 3.3 s, CLS 0, TBT 0 ms, FCP 1.5 s. **These are scores for the Coming Soon splash, NOT the signed-in homepage**. Lighthouse `landmark-one-main` applies to that splash; do **NOT** attribute it to the Assembler homepage. The SEO `is-crawlable` failure is expected while Coming Soon intentionally injects `noindex`.
- **E5 — Local code/fixture review** of the plugin ZIP `hybridmind-typhoon-chat-v0.2.1.zip` (SHA256: `a96f195e6a447217f7b159d9f56844da2b15cfed31ea2014c7450ee6cfdf1505`) plus scoped WordPress custom CSS. This tests the shipped component CSS, not the complete authenticated production layout. The live plugin version matches 0.2.1; byte-for-byte comparison with active remote CSS was not independently available.

## Verified production CMS invariants

| Item | Result | Evidence |
| --- | --- | --- |
| Homepage #16 published, canonical site homepage | PASS | E1 |
| Latest WordPress homepage content modified `2026-10-09T08:49:54` | PASS | E1 |
| Hero embeds `[hybridmind_typhoon_chat]`; old AI Engine shortcode absent | PASS | E1 |
| Typhoon v0.2.1 active; previous Android screenshots show messages and responses | PASS for installed status + sampled real interaction | E1/E2 |
| Gutenberg top-level block count | PASS (18) | E1 |
| Four editorial categories linked in homepage | PASS for registered href destinations | E1 |
| `#hm-explore` and `#hm-smart-picks` exist | PASS | E1 |
| Homepage article query renders GS20 featured image, nonempty alt | PASS | E1 |
| Core text heading order (1× H1, followed by H2 and H3 sections) | PASS | E1 |
| Chat textarea has associated label, required input and submit button | PASS for markup | E1 |
| Chat message feed has `role=log` / `aria-live=polite` | PASS for markup | E1 |
| Header Navigation #4 has `overlayMenu=mobile` block config | PASS for config only | E1 |
| Assembler theme unchanged | PASS | E1 |
| Site remains `coming_soon` / `unlaunched` | PASS | E1 |

## Actual mobile screenshot observations

| Observation | Status | Notes |
| --- | --- | --- |
| Chat card and input/button visibly fit **the captured Android viewport** | **PASS — limited single-view sampling** | No obvious horizontal clipping of visible chatbot parts in supplied screenshots |
| User sends Thai text and receives Thai model reply | **PASS — sampled live interaction** | E2, screenshots captured after site chat layout fixes; not a load or guest test |
| Long answer stays within styled feed and can be viewed at different scroll positions | **PASS — sampled** | E2, text flow and scroll were visible; scroll-to-bottom automation and keyboard state remain unknown |
| Markdown headings, bold and source list visually render | **PASS — sampled** | E2 for 09:54 images; source click-through itself not tested |
| On-screen Android keyboard stays out of the way while entering text | **UNKNOWN** | No screenshot with software keyboard open |
| Mobile hamburger opens, closes, traps focus, respects back button | **UNKNOWN** | No postchange menu-open interaction evidence |
| Four visual topic cards stack correctly on production mobile | **UNKNOWN** | No postchange full cards screenshot |
| Footer legibility / no clipping | **UNKNOWN** | Footer not visible in captured screenshots |
| No horizontal scroll anywhere on signed-in **full** page | **UNKNOWN** | Screenshots only cover selected cropped areas |

## Responsive viewport acceptance matrix

The live Global Styles user CSS (ID 2; 3,798 characters) contains rules at **781 / 680 / 380 CSS px**. The v0.2.1 plugin adds **620 CSS px** rules.

| Required width | Static responsive rules | Local component-only Chromium test | Signed-in **actual homepage** browser screenshot |
| --- | --- | --- | --- |
| 320 px | Hero compact + stacked chat form + single-column cards | Fixture had no horizontal overflow | **UNKNOWN** |
| 375 px | Hero compact + stacked chat form + single-column cards | Fixture had no horizontal overflow | **UNKNOWN** |
| 390 px | Mobile Hero and stacked form + single-column cards | Fixture had no horizontal overflow | **UNKNOWN** |
| 768 px | Mobile Hero/form breakpoint; topic cards may remain two columns | Fixture had no horizontal overflow | **UNKNOWN** |
| 1280 px | Desktop Hero/form; native multi-column cards | Fixture had no horizontal overflow | **UNKNOWN** |

**Important:** The local fixture uses the plugin CSS plus matching scoped rules, but not the full WordPress theme and authenticated page. Its "no overflow" result **must not** be used to turn the last column into PASS.

## Defects and actionability

### R1.2-D-01 — Text-size override conflict (FAIL at source/CSS-spec level)

The shipped v0.2.1 plugin CSS contains:

```css
.hm-typhoon-chat__send { font-size: 14px !important; }
.hm-typhoon-chat__note { font-size: 12px !important; }
```

The site's R1.2 scoped CSS attempts `16px` and `13px` for these two elements but does **not** use `!important`; therefore those attempts do not win the cascade. In an isolated Chromium test at 320/375/390/768/1280, the computed values remained **14px for Send** and **12px for the note**. The input did compute to **16px**, and Send stayed at **48px tall** in the fixture.

**Classification:** **FAIL against intended R1.2 typography specification (code-level).** This is **not** a claim of failing WCAG font-size requirements; browser-computed values for signed-in production remain to be measured. The disclaimer is small in the owner screenshot.

**Minimal proposed fix, not yet applied:** Update only the existing scoped Global Styles rule to `font-size: 16px !important;` for `.hm-ai-hero .hm-typhoon-chat__send`, and `font-size: 13px !important;` for `.hm-ai-hero .hm-typhoon-chat__note`. This is a **site-wide style write** and requires owner authorization/retest. Do not change plugin files or theme.

### R1.2-D-02 — Authenticated viewport matrix missing (HOLD / UNKNOWN)

With the site unlaunched, the external browser/PSI sees a WordPress.com Coming Soon splash, not the page the owner sees while signed in. The connector exposes WordPress-rendered block HTML but cannot supply authenticated **computed geometry, full-page screenshots or mobile keyboard interaction** through its documented interface. Request signed-in browser screenshots at the five specified widths and record `document.documentElement.scrollWidth <= window.innerWidth` on each.

### R1.2-D-03 — Coming Soon splash lacks main landmark (FAIL for splash, not homepage)

The Lighthouse `landmark-one-main` finding is supported for the **unauthenticated WordPress.com Coming Soon splash**. The Assembler `assembler//page` template contains a `<main>` element. Its runtime presence on the authenticated homepage is **UNKNOWN** until the browser-rendered actual homepage is inspected. Do not rewrite sitewide templates based on the splash finding.

### R1.2-D-04 — Prelaunch navigation/editorial observation (not a responsive blocker)

All four registered category URLs exist. **AI News category contains zero published posts**, so the archive may look empty even if navigation technically works. Separate Editorial Foundation gate; not a fabricated link failure. The actual tap and mobile menu interaction remain unverified.

## Static readability / color check (not full WCAG audit)

Using colors from shipped v0.2.1 CSS and theme tokens:

- Submit text `#051827` on `#0596e3`: contrast **5.55:1**.
- AI bubble text `#1d405a` on `#e6f4ff`: **9.70:1**.
- User bubble white on `#076cbd`: **5.40:1**.
- Note `#536274` on white: **6.24:1**.
- Hero white on dark `#14243b`: **15.61:1**.

These all exceed 4.5:1 for the named opaque color pairs **in code**. Real inherited styles, rendering and complete WCAG criteria remain **UNKNOWN**.

## Next acceptance actions / ownership

1. Obtain explicit authorization to apply the two minimal **scoped font-size** corrections above; if approved, back up and patch CSS, read back, and repeat a signed-in screenshot test.
2. While signed into WordPress, use desktop Chrome DevTools responsive toolbar for **320, 375, 390, 768, 1280 CSS px**. For each, inspect the header/menu, Hero, chat (greeting, typed prompt, reply), all four cards, latest article and footer. Capture screenshot(s).
3. At a narrow width, send a Thai chat prompt with the on-screen keyboard open and validate focus, send button, error messaging, textarea overlap, message scroll, and link taps.
4. Inspect in real DOM for exactly one main landmark on the **authenticated homepage**. Do not use Coming Soon Lighthouse results for this step.
5. Verify `scrollWidth <= innerWidth`, tap target >=44px for primary actions, text legibility and that the mobile menu can open and close. Note that WCAG generally uses a smaller minimum than this internal 44px UX target.
6. Update the report with device sizes, date/time, URLs, observed results and screenshots; close gate **only when no material FAIL/UNKNOWN remains**.
7. Maintain Coming Soon and do not enable public guest chat as part of R1.2-D.

**Decision:** R1.2-D **PARTIAL/HOLD**, due to verified CSS-size spec conflict + absent authenticated five-width viewport/keyboard/menu/footer proofs. The Typhoon functional smoke test on one Android handset has PASS evidence. No live site settings or styles were changed in this QA-only round.
