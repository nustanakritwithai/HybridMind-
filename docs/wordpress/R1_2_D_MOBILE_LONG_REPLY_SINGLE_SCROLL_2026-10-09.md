# HYBRID MIND — R1.2-D Mobile Long Reply UX / Single Scroll (2026-10-09)

**Project:** Hybrid Mind — Visual AI Media Platform  
**WordPress:** https://hybridmind.online/ · site ID `257844857` · Assembler theme  
**Rule:** UNKNOWN ≠ PASS  
**Scope:** user's reported double scroll, too-short answer feed and verbose note.  
**Outcome:** **LIVE CSS WRITTEN + READBACK PASS / Typhoon plugin v0.2.2 BUILD & MOCK QA PASS / PRODUCTION INSTALL & VISUAL RETEST HOLD.**

## User observation and defect

Owner's latest mobile screenshot shows AI answer content clipped inside a fixed-height chat feed, forcing the user to scroll the message box separately from the website and then scroll back down to the input. The note below the send button is overly verbose.

The shipped Typhoon Chat v0.2.1 code explains the observed behavior:

```css
.hm-typhoon-chat__feed {
  height:clamp(160px,25vw,300px);
  max-height:42vh;
  overflow-y:auto;
}
```

The WordPress R1.2 Global Styles had a mobile override still using `max-height: 44vh; overflow-y:auto;`. Plugin JS executed `feed.scrollTop=feed.scrollHeight` during messages and `textarea.focus()` after completing an answer, which could pull the viewport back to the input on mobile.

## 1) Site CSS patch — completed

**Backup before any live write:** [R1.2-E-01 Original Global Styles CSS](R1_2_E_CHAT_SINGLE_SCROLL_CSS_BACKUP_2026-10-09.md), original `Global Styles ID=2` user CSS length **3820 characters**.

The owner explicitly requested to fix the mobile chat interaction. We appended one **scoped `.hm-ai-hero`** CSS media rule to WordPress Global Styles — no unscoped typography or theme change:

```css
/* R1.2-E-01: mobile Typhoon answers use ONE page scroll (no nested chat scroll). */
@media (max-width: 781px) {
  .hm-ai-hero .hm-typhoon-chat__feed {
    height: auto !important;
    min-height: clamp(128px, 22dvh, 220px) !important;
    max-height: none !important;
    overflow: visible !important;
    overscroll-behavior: auto !important;
  }
  .hm-ai-hero .hm-typhoon-chat__bubble {
    overflow-wrap: anywhere;
  }
}
```

The initial feed is viewport-proportional with bounded minimum height. Long replies increase the **height of the document** instead of opening an inner 44vh scroll area; users still need to scroll **once down the page** to read text longer than one physical screen. No software can make an arbitrary long response fit simultaneously without scrolling or shrinking the font.

**Independent live readback:**
- Global Styles ID `2`, CSS **4246 characters**, original 3820-character content is an exact prefix and the only addition is this 426-character scoped rule.
- Existing page #16 remains **Published**, Typhoon shortcode remains, content modified timestamp unchanged: `2026-10-09T08:49:54`.
- WordPress site remains `coming_soon` / `unlaunched`.
- Live plugin remains **v0.2.1** at readback; JS still refocuses the input and the existing long note is still rendered. Do NOT claim those fixes are live until upgrade.

## 2) Plugin v0.2.2 — candidate ZIP, not yet installed

Package created: `hybridmind-typhoon-chat-v0.2.2.zip` (available from this ChatGPT conversation, not in this GitHub repository). ZIP SHA256: `6e3346241dc70e1c429217109ae00a8e8f1d6d7e59f792505dfa51ad8870cb47`.

Only these changes were made on top of the plugin v0.2.1 source:
- PHP: version `0.2.2`; chat note changed to exactly **`คำตอบอาจผิดพลาดได้`**.
- Frontend JavaScript: when viewport is at most **781 CSS px**, stop calling `feed.scrollTop` to move an inner scrollbar, blur the active textarea before request to close a phone keyboard, scroll the outer page to the **start of the new answer** after rendering, and do not automatically refocus the input when reply arrives. Desktop keeps its existing internal-feed scrolling/focus behavior.
- Plugin CSS: same single-page-scroll CSS fallback for the homepage when viewport <=781px. Preserves send button, chat font, existing theme markup.
- REST API, Typhoon provider call, secure server-side API key, knowledge retrieval, citations, WordPress plugin slug and `hybridmind_typhoon_settings` storage remain unchanged; **no saved settings reset and no API key in ZIP**.
- No automatic change to public guest access or site launch.

### Local QA

| Test | Result | Caveat |
| --- | --- | --- |
| PHP lint for both files | PASS | Static/syntax only |
| JavaScript parse `node --check` | PASS | Syntax only |
| Existing WordPress knowledge retrieval mock tests | PASS | Local fixture |
| Mock Typhoon API + secure response and provider key separation | PASS | Does not call real provider |
| Desktop Markdown and safe link DOM test | PASS | Local fixture |
| New mobile submit/blur/no-refocus/answer-anchor test | PASS | Local fixture |
| Chromium UI test @ 320, 375, 390, 768, 1280 CSS px | PASS in **mock component only** | Not real WordPress/Assembler/Coming Soon authenticated browser |
| No horizontal overflow in mock | PASS for all five mock widths | Whole live page still UNKNOWN |
| No nested feed scroll in mock @ 320,375,390,768 | PASS | Desktop 1280 retains internal feed scroll by design |
| Exact Thai note and 16px send / 13px note in mock | PASS | Production v0.2.2 UNKNOWN |
| ZIP integrity, expected plugin directory and no credential file | PASS | Installation/activation not yet tested |

**Examples from isolated Chromium fixture:** initial chat height ~471–477px on 320–390px widths; long mock answer expands the chat to several thousand pixels with a **single page scroll**; no horizontal overflow. These values are **fixture metrics, not actual homepage/browser measurements**.

## 3) How to deploy v0.2.2 (owner action required)

1. Back up your site before upgrading; current Global Styles and prechange CSS are preserved in GitHub.
2. Download the ZIP from the current ChatGPT conversation; WordPress Admin → Plugins → Add New → Upload Plugin.
3. Upload `hybridmind-typhoon-chat-v0.2.2.zip`, choose **Replace current with uploaded**. Do **NOT** delete old plugin or clear settings.
4. Verify Settings → Hybrid Mind Typhoon still shows API configured; public chat stays in its existing state and coming soon must not be changed.
5. In authenticated Android homepage: verify the short note, initial layout, ask a question with long answer, confirm one-page scroll, and that the keyboard doesn't reopen by itself; test source links.
6. Read back plugin version `0.2.2`, WordPress rendered note and CSS before a release claim.

## Gate

**R1.2-D / Mobile Chat UX remains PARTIAL / HOLD**. CSS config was saved, but the full v0.2.2 UX fix requires a manual plugin upgrade and new authenticated screenshots. Public/guest, external fresh news, security, and complete five-width authenticated responsive matrix remain outside this change's success evidence. Coming Soon remains enabled.
