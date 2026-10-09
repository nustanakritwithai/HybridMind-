# HYBRID MIND — AiPASS 2.0 Chromatic Typography QA

**Date:** 2026-10-09 (Asia/Bangkok)  
**Site:** https://hybridmind.online · WordPress.com Atomic site ID `257844857`  
**Article:** Post **#57**, slug `th-ai-passport-2-gemini-enterprise-visual-guide`, **DRAFT**  
**Preview:** https://hybridmind.online/?p=57&preview=true  
**Source baseline:** WordPress Revision **#61** (2026-10-09 13:55:00).  
**Result after edit:** Revision **#62**, modified 2026-10-09 14:33:06.  
**Rule:** UNKNOWN ≠ PASS.

## Owner request

Increase typographic color throughout the AiPASS 2.0 Visual Interactive article while preserving its navy visual identity, legibility, factual content, interaction logic, live photographs, source references, and Coming Soon state.

## Applied changes

Only WordPress Post #57 top-level **`core/html` block index 0** was edited via `post-sections.replace`, with current modified timestamp, content hash, block hash and block-type optimistic locks.

- Added **9 target heading markups** for short phrases, without changing the underlying words: Hero contrast of AI answering vs doing; key facts; AiPASS 1.0 → 2.0; Agent workflow timeline; 1,000-point calculator; eligibility; developer learning path; comprehension quiz; sources/unknowns.
- Added an **iframe-internal** scoped `<style>` patch: **1,118 characters** of CSS affecting only text colors (no position/font-size/overflow/image dimensions).
- Four accessible accents on existing dark background: sky blue `#94d4ff`, mint `#82efcd`, lavender `#d3bcff`, gold `#ffe0a4`. Small decorative separator arrow `#aebfff`.
- Styled four large factual-stat values, three usage-stat headings, four timeline titles, three skills-rung titles, dynamically updated mode heading, quiz headline, eligible-self-check emphasis, photo-panel titles, selected source labels, and editorial takeaway.
- Base paragraphs remain light text and original navigation/buttons use their previous states and focus styling. Color alone is never used to distinguish `PASS/UNKNOWN`: evidence labels remain explicit.

**Static contrast preflight:** tested chosen accent color hex pairs against five existing dark panel backgrounds (`#071121`, `#102740`, `#112b45`, `#0e2136`, `#122c45`); minimum computed ratio across the principal accent palette is **7.95:1**. These are **source-level comparisons**, not a comprehensive WCAG/computed-style audit.

## Rollback and prewrite safeguards

- Prior snapshot at **Revision #61**, WordPress raw content length **60,390 characters**, iframe document **47,578 characters**, Gutenberg index-0 block hash `7f940e3060176fe4b0f6caa6222036934fea2fd5`.
- Guarded edit verified **exactly one match for each of the nine headings**, exact reversibility of injected spans/CSS to the previous decoded iframe, and text-only equality of all H1/H2 headings before and after.
- Verified embedded JavaScript, three photo `<img>` elements, anchor link list and CSP meta string **unchanged** before write.
- Existing press facts, source links, calculator and quiz, iframe messaging and WordPress trailing paragraphs were not edited. No external credentials or entire unpublished Draft HTML copied to public GitHub.
- To revert this specific edit, use WordPress's recorded Revision #61 after checking whether other changes intervened; do not blindly overwrite concurrent work.

## Independent WordPress post-write readback

| Check | Status |
| --- | --- |
| Post #57 still Draft with same slug/category/featured setting | **PASS** |
| New WordPress revision #62 recorded | **PASS** |
| Full `core/html` updated and view renders iframe `srcdoc` | **PASS** |
| Color CSS and 11 accent span occurrences across 9 headings | **PASS** |
| 3 Pexels editorial photos remain referenced | **PASS** |
| Calculator and quiz control IDs remain | **PASS static** |
| AiPASS 1.0/2.0 mode controls remain | **PASS static** |
| Press statistics and source links remain | **PASS static** |
| CSP image host restrictions remain | **PASS static** |
| Two other Gutenberg block hashes unchanged | **PASS** |
| Coming Soon / unlaunched status unchanged | **PASS** |
| Actual signed-in phone image, color rendering and interaction | **UNKNOWN — requires screenshot/tap QA** |
| Public release approval | **HOLD** |

Readback content lengths: **62,069** characters WordPress serialized post; decoded iframe HTML **49,034** characters. New index-0 block hash `230e8862c15ee84f68310c68b4eaa24aa411cbdc`. Source paragraph block hashes `c5af945e01a01cc49429ecc8eb1044b513af73fa` and `c9c61f25f97095ceea35c86830cb47a93a111f8d` remain unchanged.

## Next action

Owner opens the [Draft #57 preview](https://hybridmind.online/?p=57&preview=true) in authenticated Android browser, refreshes, checks headline readability, stat contrasts, photos and 1,000-point calculator plus quiz, and shares a screenshot if anything is clipped or visually overwhelming.

**Decision:** TYPOGRAPHY COLOR CHANGE STORED & READBACK **PASS**; REAL-BROWSER VISUAL QA **UNKNOWN**; DRAFT/COMING SOON **RETAINED**.
