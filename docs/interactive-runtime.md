# Reviewed interactive textbook runtime

This follows the published textbook commit `98404bcebd1cbfe94c33f55a208d55eca3ffaaf7`. The article capture, text, raster media, credits, source URLs, 138 section IDs and reading-progress contract remain the source of truth.

## Inventory and provenance

Five captured articles contain 107 original input/select/button/textarea controls:
- 1077 and 1073: none.
- 2241: Video Lab (28) and Citation Gate (4).
- 2310: Video Lab (28) and Authorization Gate (6).
- 2494: Video Lab (28) and Approval Gate (13).

The six displayed lab roots use four reviewed local implementations. Each adds an explicit whole-lab reset; existing source reset controls are retained. Native details disclosures, source anchors and links remain available.

The public REST capture includes the three domain scripts and CSS as source data. The shared Video Lab runtime was absent from REST: its plugin asset was discovered in the canonical article HTML. The isolated asset, excluding the site's Jetpack/tracker bundle, was read for review:
- `https://hybridmind.online/wp-content/plugins/hybridmind-video-lab/assets/lab.js`
  SHA-256 `0bdfe61d49f0789ad4f24493c34cd6da49a027e77d93bffc334ee97d7160586f`.
- `https://hybridmind.online/wp-content/plugins/hybridmind-video-lab/assets/lab.css`
  SHA-256 `e844b85d6bc480006c5a160bbce3fe6e1eaa39be88140163d919b2ca239709d3`.

Their captured bytes are under `reference/source-exports/interactive-runtime-2026-10-25/`. These are HybridMind's dependency-free Canvas 2D implementation and stylesheet, not a third-party renderer install. No WordPress plugin was installed or changed. The raw scripts are not runtime inputs and never execute in the reader.

## Boundary and lifecycle

The approved renderer keeps its normal sanitizer. Only an entry whose article ID, canonical URL, revision, provenance, declared hash **and actual WebCrypto SHA-256 of full source HTML** match the reviewed registry can retain safe controls/classes/data attributes inside its known lab roots. Approval is bound to that object and exact HTML string; clones or changed content do not inherit it. Newly constructed root nodes are registered privately in a WeakMap, so a CSS class alone cannot activate code.

Imported script/style/event attributes, external frames, form actions and inline style remain stripped. A fixed module table supplies the reviewed implementations; there is no evaluation or dynamic import of source text. Local modules use text/DOM construction and contain no networking, persistence, API keys, tracker or vendor dependency. The page's CSP and permissions are unchanged. Clipboard copy is initiated by the existing explicit user control; if the browser refuses it, the text is selected and a truthful manual-copy message is shown.

All selectors are scoped to the nearest lab; IDs and ARIA/label references are namespaced without changing stable section anchors. Components return getState/dispose/reset. Before rerender, the manager saves state in memory keyed by article revision/hash, then aborts listeners and disposes RAF/observers. Section/chapter/history remounts restore that state; whole-lab reset restores defaults. Nothing is added to localStorage. Reading progress and its reset remain independent. Canvas animation stops offscreen/disconnected, and reduced motion is respected.

At narrow reader widths, the six Canvas stages use two columns and three rows so labels and hit targets remain separate. Camera and drag controls still adjust the view. The caption sits below the nodes, above the selected-stage explanation. This is a deliberate responsive adaptation of the source desktop scene.

## Behavior limits

The restored interactions are the source's educational simulations:
- Citation scenarios assume fixture hash/span checks; they do not verify real documents or truth.
- Authorization shows fixed synthetic IDs and order; it does not call an authorization service or reranker.
- Approval uses a synthetic one-use receipt and manual expiry; it has no real TTL timer or external action.
- Video Lab is a native-canvas explanatory scene, prompt generator and hypothetical cost calculator. It does not upload, edit, render or publish a real video.
- A future changed source snapshot requires review and new hash pins; otherwise it remains safely static.

The release manifest deliberately does not claim unrestricted interactive parity. The acceptance evidence must enumerate controls actually exercised, clipboard outcome, remount/scroll behavior, viewports and safety assertions. Field performance, every browser/assistive technology and unseen future source interactions remain outside that evidence.

## Reproduce verification

Use Node.js 24 and installed Edge/Chrome (set HM_EDGE_PATH on Linux):

```sh
npm run lint
npm test
npm run evaluate
npm run build:pages
npm run test:pages
```

For public verification, run the same interactive browser suite with HM_LIVE_URL set to the already configured Pages reader and HM_EXPECTED_RELEASE_SHA set to the exact merge SHA. Local-only safety fixtures do not change the site. Screenshots and per-control evidence are written under artifacts/interactive. Deploy only after exact-head CI and review; then compare release.json and public runtime file hashes before reporting the new version live.

## Acceptance evidence

The local acceptance suite exercises 107 original input/select/button/textarea controls (including reading the generated output), six added resets and native disclosures. It asserts the citation revision matrix and five citation cases, all twelve tenant/filter-position/TopK combinations, seven approval-field changes, scope/expiry/consume/replay behavior, all three video instances and their isolation, canvas drag/tap/keyboard response, clipboard outcome, changed-source rejection and chapter/history remount state. Screenshots cover six roots and each video scene/prompt/cost panel at 1440×1000 and 390×844: thirty images per run.

The original 31 regression tests plus five registry/safety tests and one browser acceptance test total 37. Pages packaging has a separate test; CI repeats both browser suites with the repository URL prefix. A browser test skipped for a missing executable does not count as acceptance; the workflow requires an installed browser. The release evidence is `artifacts/interactive-validation-20261025.txt` and `artifacts/interactive-browser-evidence.json`.

Static review found and fixed mutable verification-status/block-type checks, a restored approval-view label mismatch, and an initial pause-state label. Visual review found and fixed dark intro text on dark surfaces and overlapping phone canvas labels. Clipboard use remains tied to the original explicit copy controls; no permission is granted by the test harness.

The first PR CI run exposed a pause assertion dependent on the host motion preference and prior test actions. The suite now explicitly tests normal playback with reset state, then reloads with reduced motion and checks all three labs start paused. Explicit Play/Pause still works in reduced motion, matching the original plugin. Live runs preserve local evidence and write separate `artifacts/live-interactive/` screenshots plus `artifacts/live-interactive-browser-evidence.json`, including the tested URL, expected release SHA and timestamp.
