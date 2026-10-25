# Existing GitHub Pages delivery

The repository was already public and its Pages API reported `build_type: workflow`, source `main` at `/`, and site URL `https://nustanakritwithai.github.io/HybridMind-/`. Before this release the URL returned 404, there were no deployments, and no Pages workflow existed on main. The owner's 2026-10-25 approval permits publishing the textbook on this existing site. No Pages, repository, WordPress, DNS, audience or access settings are changed.

## Build and checks

Run in a Git checkout with Node.js 24 and Edge/Chrome available:

```sh
npm run lint
npm test
npm run evaluate
npm run build:pages
npm run test:pages
```

Set `HM_EDGE_PATH` to the installed browser executable on Linux. Set `HM_PILOT_BASE_PATH=/HybridMind-` when running `node --test tests/reader-browser.test.mjs` to exercise the repository URL prefix. The browser and server use an isolated temporary profile and ephemeral loopback ports.

`dist/pages` contains only the public reader, five verified article bodies, local media, search runtime and a release manifest. The original root `index.html` is preserved byte for byte. The reader is at `knowledge-textbook/`; there is no WordPress deployment. `release.json` records the exact checkout commit and SHA-256 of every runtime file. The Pages artifact test verifies those hashes and excludes offline inventories, source exports, tests and local tools. `build:pages` requires a Git checkout; the runnable ZIP uses `npm run serve` instead.

The workflow checks the exact PR head with read-only repository permission. Only successful main builds can deploy. The deploy job uses GitHub's required Pages/OIDC job permissions; default repository permissions and environment protection rules remain untouched. Official Actions are pinned to resolved commit hashes. The existing `github-pages` environment governs publication. CI requires the installed browser and fails if it is missing; browser coverage is not silently skipped.

Before merge, verify the exact head's checks and review the diff. After merge, verify the main build and deployment, fetch `release.json`, compare its commit and asset hashes, and exercise mobile full text, images, TOC, named previous/next, search, history and progress reset on the returned Pages URL. A draft PR or successful build alone is not a live deployment.

Rollback: revert the textbook release PR on main and rerun a reviewed Pages build that preserves the previous root. Do not reset shared history or modify WordPress. Since there was no previous successful Pages deployment, there is no verified earlier live textbook release to restore.

## Exact static reductions in the captured pilot

| WordPress article | Script blocks omitted | Canvas replaced by note | Controls rendered as disabled text |
| --- | ---: | ---: | ---: |
| 1077 — facts, numbers and citations | 0 | 0 | 0 |
| 1073 — generated code tests | 0 | 0 | 0 |
| 2241 — current revision citation gate | 1 | 1 | 32 |
| 2310 — authorization before hydration | 1 | 1 | 34 |
| 2494 — approval action fingerprint | 1 | 1 | 41 |

All five retain their complete captured readable text, raster images, table/code/list structure and source links. Original inline styles are removed; typography/layout uses the reader CSS. Forms are unwrapped, input/button/select/textarea labels or values become static spans, and canvas/iframe/object/embed/video/audio become a labeled note with a canonical source link. Script/style/SVG/MathML nodes are omitted; the five captured bodies contain no SVG, MathML, iframe, video or audio nodes. The advanced articles' simulations and 3D/video-editing examples cannot be operated here. Raw captures and original WordPress URLs remain the reference; interactive parity is **not** passed.

The public REST capture is separate from the earlier inaccessible Library source ZIP. Its original archive hash is not claimed as verified. The phase-one Library deliverable was successfully replaced at version 8 on 2026-10-25; later deployment updates should retain those same identities. Local xattr persistence is unsupported by the Windows helper (`os.setxattr`); upload success and versions are recorded separately.
