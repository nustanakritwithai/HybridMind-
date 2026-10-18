# Knowledge textbook reader prototype

From the repository root, run `node scripts/serve-pilot.mjs` and open `http://127.0.0.1:8000/knowledge-textbook/`. The server binds to loopback only; use `HM_PILOT_PORT` to choose another local port. The reader loads `../data/pilot-catalog.json` and uses `../search/local-search.mjs` for local keyword search.

Run checks with `npm run lint`, `npm test`, and `npm run evaluate`. `npm run build` stages a runnable copy under `dist/hybridmind-knowledge-phase1`. No package install or API key is required.

Snapshot coverage and editorial review status are shown in the interface. Article and topic mappings remain proposed until approved. Section text is rendered as text; canonical WordPress articles remain the source for Gutenberg media and interactive blocks.

Reading progress is off by default. When enabled it is stored only in this browser's `localStorage`; Reset progress clears reader progress keys on this device. Invalid section query IDs fall back to the topic. Progress comparison is revision-aware and independent of catalog list order.

Only the five requested pilot articles with an explicit `password_protected: false` observation enter the browser catalog and its section index. The other 243 rows have unknown password and visibility state and are excluded from the runnable package, server response, search and mapping cards until checked. The full 248-row inventory remains in the source worktree's offline/reference folders; neither the full inventory nor raw inputs are copied into `dist/` or the ZIP.

This prototype does not include full-corpus taxonomy, verified WordPress anchors, rich WordPress block rendering, cross-device progress, or semantic search. Snapshot headings are navigation metadata, not full lesson bodies. Search is a keyword baseline with a small Thai-English alias list; it is not yet relevance-scored against human gold labels. See `docs/search-evaluation.md` for known acceptance gates.

On mobile, the disclosure contains topic links and per-article collapsible heading outlines. Section links update the stable `topic` and `section` query parameters. An invalid section ID displays a one-time fallback message while showing the topic. Opting in preserves an existing revision record; Reset progress clears records and pauses saving until the next topic or section navigation.

The packaged ingestion script can rebuild the full offline catalog only when its four `reference/inventory/knowledge-inventory/` inputs are supplied separately. They are deliberately omitted from the runnable ZIP. The packaged `data/pilot-catalog.json` is the public-only projection. The loopback server serves a fixed route allowlist and does not serve arbitrary local files.
