# HYBRID MIND — Post #57 Cover CSS Backup (2026-10-09)

- Site: https://hybridmind.online (WordPress.com ID 257844857)
- Post: #57 — AiPASS 2.0 Visual Interactive — status Draft; Featured Image Media #63
- Global Styles ID: 2; CSS chars: 4888
- Theme: Assembler single-post featured block hardcodes 4:3; cover is 1672×941 (approximately 16:9).
- Site status at snapshot: coming_soon / unlaunched.
- Purpose: make featured image **Post #57 only** preserve original ratio, while retaining all existing site CSS.

## Exact original Global Styles CSS

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
  font-size: 16px !important;
  line-height: 1.4;
}
.hm-ai-hero .hm-typhoon-chat__note {
  font-size: 13px !important;
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
/* R1.2 Android 08:55 compact chat feed: preserve readable text, shrink empty state */
@media (max-width: 781px) {
  .hm-ai-hero .hm-typhoon-chat__feed {
    height: auto !important;
    min-height: 0 !important;
    max-height: 44vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .hm-ai-hero .hm-typhoon-chat__bubble {
    overflow-wrap: anywhere;
    line-height: 1.6;
  }
}

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

/* Hybrid Mind R2-IMG-52: show complete infographic on post #52 (no 4:3 cropping) */
body.single-post.postid-52 figure.wp-block-post-featured-image {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  aspect-ratio: auto !important;
  overflow: visible !important;
}
body.single-post.postid-52 figure.wp-block-post-featured-image img {
  display: block;
  box-sizing: border-box;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  aspect-ratio: auto !important;
  object-fit: contain !important;
  object-position: center center !important;
}

```

## Rollback policy

Remove only the appended `R2-COVER-57` rules if they are the only difference since this backup. Do not overwrite concurrent changes, change the theme template, change other posts, or toggle Coming Soon.
