# HYBRID MIND — R1.2 Mobile Visual Redesign / QA
**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online/ (WordPress.com Atomic site 257844857)  
**Page:** Published Static Homepage #16, Assembler Theme  
**Rule:** UNKNOWN ≠ PASS  
**Overall:** **PARTIAL / HOLD** — code and WP rendered markup verified; postchange mobile and desktop visual QA not yet verified.

## Scope and approval
Owner approved R1.2-A/B/C/D to improve mobile typography and responsive card layouts while preserving existing Typhoon functionality, Assembler and the Coming Soon gate. No theme replacement, no plugin reinstall, no draft publication and no public launch.

## A — Baseline
- Evidence: owner-provided Android screenshot ~08:40 local showed Typhoon responding to a question on homepage, multiple nested white frames, tiny text, and side-by-side editorial cards that looked cramped.
- WordPress prechange: homepage #16 published, 18 top-level Gutenberg sections, Typhoon shortcode present, `hm-ai-chat-panel` wrapping the shortcode with duplicate AI disclaimer, topic cards in two `core/columns` sections.
- Before editing: saved exact serialized Hero Gutenberg block to [R1_2_HERO_PRECHANGE_2026-10-09.md](R1_2_HERO_PRECHANGE_2026-10-09.md). Pre-change global-styles user overrides `styles: []` (no custom CSS).

## B — Chat layout and copy
- Updated only top-level Gutenberg section #0 using WordPress.com `page-sections.replace` optimistic locks.
- Removed the outer Gutenberg light `hm-ai-chat-panel` group surrounding the plugin's own `hm-typhoon-chat` card, eliminating one white frame and one redundant AI disclaimer.
- Preserved the **real** `[hybridmind_typhoon_chat]` shortcode, the dark-gradient `hm-ai-hero`, all navigation links, news section, content cards, and the rest of the homepage.
- Shortened intro copy; example questions now concern evergreen AI skills/glasses rather than promising live news.
- CMS save result: modified `2026-10-09T08:49:54`; section data/content hash `b04c4cb5a97067bf86e864fc633109355872c1cc`; no loss of existing 18 blocks.
- **Status: PASS for Gutenberg save and rendered markup; real postchange interaction/visual unknown.**

## C — Scoped Mobile CSS
- Added WordPress **Global Styles > styles.css** scoped exclusively to `.hm-ai-hero`, `.hm-typhoon-chat` descendants and `.hm-visual-topic-grid` elements; did not alter theme templates or unscoped general typography.
- Chat bubbles set to 16px; textarea 16px; send button minimum height 48px; line height improved; message feed becomes scrollable within a bounded height.
- Mobile breakpoint <= 781px: reduced Hero padding; input and Send button stack; responsive H1 sizing; buttons wrap.
- Card breakpoint <= 680px: two topic sections switch to one-column stacking; card padding and typography improved.
- Narrow mobile breakpoint <= 380px: further padding reduction, readable message bubbles.
- CSS text passed balanced-braces check and was independently read back as **3404 characters** under global-styles ID 2 initially, then **3798 characters** after the Android 08:55 follow-up.
- **Status: PASS for stored stylesheet and selector coverage; browser-applied responsive behavior UNKNOWN.**

## D — Post-change WordPress readback
| Test | State | Evidence |
| --- | --- | --- |
| Page #16 remains Published / canonical homepage | PASS | WordPress pages.get |
| Typhoon shortcode still present | PASS | Gutenberg edit context |
| Rendered Typhoon chat DOM includes input/form/feed | PASS | WordPress pages.get view context |
| No old AI Engine shortcode | PASS | WordPress markup |
| `hm-ai-chat-panel` redundant wrapper removed | PASS | WordPress markup/render |
| Four category URLs remain | PASS | Rendered page content |
| Latest articles query + GS20 card preserved | PASS | Rendered page content |
| Smart Buying and Explore anchors remain | PASS | WordPress page content |
| Top-level Gutenberg sections | PASS | 18 sections |
| Theme Assembler unchanged | PASS | Theme editor context |
| Site visibility | PASS | `coming_soon` / `unlaunched` |
| Actual Android 320/375/390 CSS px screenshots | UNKNOWN | Only prechange screenshot available |
| Actual desktop/tablet 768/1280 CSS px screenshots | UNKNOWN | Authenticated browser required |
| Touch target, on-screen keyboard, send/scroll after change | UNKNOWN | No postchange device interaction proof |
| Public guest chat + abuse safeguards | HOLD | Not within scope / no public launch |

## Verification summary
Latest WordPress homepage: `#16` / `2026-10-09T08:49:54` / `b04c4cb5a97067bf86e864fc633109355872c1cc`. Global Style ID 2 custom CSS saved and reread. No changes made to the theme or public visibility.

## Scoped CSS saved in WordPress
```css
/* Hybrid Mind R1.2: scoped to homepage AI Hero and editorial topic cards */
.hm-ai-hero,
.hm-ai-hero *,
.hm-visual-topic-grid,
.hm-visual-topic-grid * {
  box-sizing: border-box;
}
.hm-ai-hero,
.hm-ai-hero .hm-typhoon-chat,
.hm-visual-topic-grid {
  max-width: 100%;
}
.hm-ai-hero .hm-typhoon-chat {
  width: 100%;
  margin: 8px auto 0;
  font-size: 16px;
  line-height: 1.6;
}
.hm-ai-hero .hm-typhoon-chat__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.hm-ai-hero .hm-typhoon-chat__feed {
  min-height: 140px;
  max-height: 440px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.hm-ai-hero .hm-typhoon-chat__bubble {
  max-width: 100%;
  font-size: 16px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.hm-ai-hero .hm-typhoon-chat__form {
  gap: 10px;
}
.hm-ai-hero .hm-typhoon-chat__form textarea {
  min-width: 0;
  max-width: 100%;
  min-height: 88px;
  font: inherit;
  font-size: 16px;
  line-height: 1.55;
}
.hm-ai-hero .hm-typhoon-chat__send {
  min-height: 48px;
  padding: 12px 18px;
  font-size: 16px;
  line-height: 1.4;
}
.hm-ai-hero .hm-typhoon-chat__note {
  font-size: 13px;
  line-height: 1.55;
}
.hm-visual-topic-grid .wp-block-column {
  min-width: 0;
}
.hm-visual-topic-grid .wp-block-column > .wp-block-group {
  height: 100%;
  max-width: 100%;
}
.hm-visual-topic-grid .wp-block-column :is(h3, p) {
  overflow-wrap: anywhere;
}
@media (max-width: 781px) {
  .hm-ai-hero {
    padding: 22px 18px !important;
    border-radius: 18px !important;
  }
  .hm-ai-hero h1 {
    font-size: clamp(26px, 6.2vw, 34px) !important;
    line-height: 1.22 !important;
  }
  .hm-ai-hero > p {
    font-size: 16px !important;
    line-height: 1.6;
  }
  .hm-ai-hero .hm-typhoon-chat {
    padding: 16px !important;
    border-radius: 16px !important;
  }
  .hm-ai-hero .hm-typhoon-chat__feed {
    min-height: 130px;
    max-height: 45vh;
  }
  .hm-ai-hero .hm-typhoon-chat__form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .hm-ai-hero .hm-typhoon-chat__form textarea {
    width: 100%;
    min-height: 80px;
    flex: initial;
  }
  .hm-ai-hero .hm-typhoon-chat__send {
    width: 100%;
    flex: initial;
  }
  .hm-ai-hero .wp-block-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .hm-ai-hero .wp-block-button {
    flex: 1 1 160px;
  }
  .hm-ai-hero .wp-block-button__link {
    width: 100%;
    display: block;
    padding: 13px 16px;
    text-align: center;
  }
}
@media (max-width: 680px) {
  .hm-visual-topic-grid {
    display: flex !important;
    flex-flow: column nowrap !important;
    gap: 16px !important;
  }
  .hm-visual-topic-grid .wp-block-column {
    width: 100% !important;
    flex: 0 0 auto !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
  .hm-visual-topic-grid .wp-block-column > .wp-block-group {
    padding: 20px !important;
    border-radius: 16px !important;
  }
  .hm-visual-topic-grid .wp-block-column .has-large-font-size {
    font-size: 26px !important;
    line-height: 1.25;
  }
  .hm-visual-topic-grid .wp-block-column p:not(.has-large-font-size) {
    font-size: 16px;
    line-height: 1.55;
  }
}
@media (max-width: 380px) {
  .hm-ai-hero {
    padding: 17px 12px !important;
  }
  .hm-ai-hero .hm-typhoon-chat {
    padding: 13px !important;
  }
  .hm-ai-hero .hm-typhoon-chat__bubble {
    font-size: 15px;
  }
}
```

## Android 08:55 follow-up (owner screenshot) — R1.2 incremental QA

The owner supplied a new Android browser screenshot taken after the R1.2 wrapper/typography/card edits, while signed in on the existing WordPress homepage. The screenshot supports these **visual observations**:

- The extra nested Gutenberg white panel is absent; the Typhoon chat widget itself is the primary chat card.
- H1, message bubble, typing field and send button are visibly larger and more legible compared with earlier screenshot.
- The send button is stacked full width below the input field; no obvious horizontal overflow in the visible crop.
- The initial chat feed still has excess blank space beneath the greeting, making the first screen unusually tall.
- The screenshot shows a greeting **but not a newly sent user message or response**. Post-change chat completion remains **UNKNOWN**, and screenshots across other viewport widths remain untested.

### Targeted follow-up CSS (same day)

To resolve the observed empty-feed issue, append a narrow CSS override under `@media (max-width: 781px)`, scoped to `.hm-ai-hero .hm-typhoon-chat__feed`:

- `height: auto !important;`
- `min-height: 0 !important;`
- `max-height: 44vh;`
- `overflow-y: auto;` and `overscroll-behavior: contain;`
- Keep readable bubble line-height, input text and 48px send button.

WordPress Global Styles `styles.css` readback grew from **3404 to 3798 characters**. The new rule was read back and the template still renders `hm-typhoon-chat__feed` and the form. Homepage retained its original 18 sections, published status, 4 editorial category cards, recent GS20 entry and both anchor links. Theme stays `assembler`, site remains `coming_soon / unlaunched`. No plugin/key/network code changed.

**Gate:** This CSS is saved but actual new mobile visual result must still be verified with one more screenshot after refresh. Do not claim that the empty-feed problem is resolved on the device until observed.

## Release gate / next action
**R1.2 is PARTIAL.** User must open the actual signed-in homepage in Android and Desktop, refresh, inspect Hero/chat/cards/footer, send a question, and share mobile screenshot evidence after the change. Do not call R1.2 final PASS on the basis of WordPress HTML readback. Browser rendering is particularly important because WordPress is Coming Soon, and unauthenticated HTML fetches do not represent the signed-in experience.

If the CSS needs rollback: read custom Global Styles ID 2, remove only its R1.2 `styles.css` value (or restore the previous empty style layer using explicit comparison) and selectively replace Hero section 0 from the prechange snapshot. Do not restore the whole page. Rollback has **not** been tested.

**Postchange Typhoon direct reply:** UNKNOWN; prechange homepage Thai response screenshot PASS.
