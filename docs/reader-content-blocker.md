# Superseded blocker record

The five full bodies and media were imported from public REST on 2026-10-25. See [current delivery status](rest-content-delivery.md). The text below is the historical metadata-only handoff and does not describe the current pilot.

# Reader content and media blocker

## Current phase-one path

The proposed topic `hm:topic:verify-ai-work` presents five individually verified public, non-password-protected WordPress articles: `hm:article:1077`, `1073`, `2241`, `2310`, and `2494`. Each card includes its WordPress title, snapshot excerpt, last-modified date when available, proposed-mapping status, and a hardened link to the original article. The local reader also offers stable heading IDs and a collapsible per-article outline.

The supplied snapshot does not include the five article bodies, rendered Gutenberg HTML, image URLs or files, or interactive block data. The checked local exports are the normalized inventory, mapping CSV/JSON, review flags and notes; the catalog has titles and heading metadata only, `source_hash` is null, and no verified WordPress anchor IDs are available. The local reader therefore does not present a heading list as a complete lesson.

## Retrieval attempts and blocker

I attempted one anonymous read-only WordPress REST GET for verified post 1077 to determine whether the body could be fetched locally. The executor denied outbound TCP with `EACCES` before receiving an HTTP response. The available local snapshot ZIP and repository exports were checked and contain no post bodies. Search snippets do not provide a complete, attributable body/media package for all five posts or the original Gutenberg block structure.

I did not assemble a local article from partial crawler text, infer missing images, or run scripts copied from WordPress. As a result, full body/media rendering is **blocked for this handoff**. WordPress remains the canonical reading destination, and every verified article card links directly to its existing HTTPS URL in a separate tab. The link is restricted to `hybridmind.online` and sets `rel="noopener noreferrer"`.

## Safe local import contract

The pilot now includes a versioned entry schema (`contracts/knowledge-content-v1.schema.json`), a bundle schema, an offline-only importer (`scripts/import-structured-content.mjs`), and an allowlisted DOM renderer. Its tests use an explicitly labeled synthetic fixture; that fixture is never a build or server input. The current app fetches the optional bundle only from the fixed `/data/pilot-content-bundle.json` route and renders entries whose provenance is `wordpress_export`. If the route is absent, the metadata-only view remains available.

Each normalized entry has a separate `content_digest`, computed as SHA-256 of UTF-8 canonical JSON for `{article_id, canonical_url, source_revision, blocks}`. Object keys are recursively sorted, array order is kept, and the serialization has no BOM or whitespace. The importer calculates it; the build and loopback server recompute it and reject a mismatch. This digest verifies that normalized blocks stay unchanged after import; it does not establish that they were derived from the supplied WordPress bytes. `source_hash` describes the original WordPress payload bytes and is marked `unverified` with a null hash when those bytes are unavailable. When exact bytes are included as `source_payload_base64`, `source_hash_status: "source_bytes_verified"` means only that their decoded bytes match the stored source hash. `content_derivation_status` remains `unverified` because the importer does not prove that normalized blocks came from those bytes. A claimed digest string by itself is never treated as proof.

To unblock source rendering, provide a saved structured export for each of the five IDs with: public `publish` status and `password_protected: false` checked at both enumeration and body-read time; the exact canonical URL; the public-catalog `source_revision`; the exact original payload bytes (or leave `source_hash_status` unverified); an import timestamp; and typed block data. Images must include canonical upload URLs, source alt text, and captions/attribution when present. The importer checks the canonical URL, public status and revision against the catalog. Normalized-block derivation from original bytes still requires an independently reviewed parser/export mapping. Run:

```powershell
node scripts/import-structured-content.mjs <wordpress-export.json> <article-bundle.json> [public-catalog.json]
```

The output is a one-article bundle. Combine only validated `articles` entries into `offline/pilot-content-bundle.json`; the build validates that bundle against `contracts/knowledge-content-bundle-v1.schema.json`, rejects fixtures, excludes articles absent from the public projection, and recomputes every normalized content digest. Then rebuild and run the reader locally. The importer does not fetch WordPress, bypass the current network restriction, or mutate the site.

Known renderer scope: headings, paragraphs with checked inline link offsets and credential-free HTTPS links, lists, quotations, code, and canonical upload images are rendered as DOM nodes with `textContent`. Unknown Gutenberg blocks become a static explanatory note with their HTML/payload discarded; the original article link remains available for interactive use. This is a safe fallback, not playback of the original interactive block.

## Safe completion criteria

A future content export can complete this path without changing WordPress: obtain the five public exports through an authorized, throttled read-only method; verify status and password protection; checkpoint each result; preserve URL, revision and source hash; then import only the structured allowlist. Scripts, event handlers, forms, embeds and executable block payloads do not run locally. Unsupported interactive blocks receive the static fallback. Images load only from the canonical uploads path and retain source alt text and captions supplied by the export.

This blocker is separate from topic selection, search indexing, deep links, progress, and the metadata-only outlines, which are covered by the current prototype and tests.
