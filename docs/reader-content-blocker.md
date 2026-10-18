# Reader content and media blocker

## Current phase-one path

The proposed topic `hm:topic:verify-ai-work` presents five individually verified public, non-password-protected WordPress articles: `hm:article:1077`, `1073`, `2241`, `2310`, and `2494`. Each card includes its WordPress title, snapshot excerpt, last-modified date when available, proposed-mapping status, and a hardened link to the original article. The local reader also offers stable heading IDs and a collapsible per-article outline.

The supplied snapshot does not include the five article bodies, rendered Gutenberg HTML, image URLs or files, or interactive block data. It has 5,672 corpus-wide H2/H3 metadata rows, but no verified WordPress anchor IDs. The local reader therefore does not pretend that a list of headings is a complete lesson.

## Retrieval attempts and blocker

I attempted one anonymous read-only WordPress REST GET for verified post 1077 to determine whether the body could be fetched locally. The executor denied outbound TCP with `EACCES` before receiving an HTTP response. Direct page opens through the web retrieval tool were also unavailable. The web search index returned rendered text for some of the articles, but it did not provide a complete, attributable body/media package for all five posts or the original Gutenberg block structure.

I did not assemble a local article from partial crawler text, infer missing images, or run scripts copied from WordPress. As a result, full body/media rendering and interactive Gutenberg playback are **blocked for this handoff**. WordPress remains the canonical reading destination, and every verified article card links directly to its existing HTTPS URL in a separate tab. The link is restricted to `hybridmind.online` and sets `rel="noopener noreferrer"`.

## Safe completion criteria

A future content export can complete this path without changing WordPress: request only these five IDs through anonymous, throttled GETs; verify `status=publish` and `password_protected=false` before and again with each body read; checkpoint each result; preserve the source URL, revision and SHA-256; then render only an explicit safe HTML/Gutenberg allowlist. Scripts, event handlers, forms, embeds and executable block payloads must not run locally. Unsupported interactive blocks should get a clear static fallback plus the original WordPress link. Images should load only from the canonical media host and retain their source alt text and attribution where present.

This blocker is separate from topic selection, search indexing, deep links, progress, and the metadata-only outlines, which are covered by the current prototype and tests.
