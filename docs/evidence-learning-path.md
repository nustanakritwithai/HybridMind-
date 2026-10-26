# Evidence learning path — bounded continuation of PR #5

Base: 30caf8d412ccf7e5ed71bb9afd83b871fb16a96f. The new batch contains three existing public WordPress articles, not a bulk migration.

## Proposed sequence and learning purpose

1. **1740 — Retrieval Evaluation**: separate retrieved sources, retained context, answer correctness and citation support. This is the introductory step within this engineering path, not a claim that it requires no AI background.
2. **1755 — Evidence Sufficiency**: build on stage diagnosis by checking complete, applicable proof sets, joins and question scope. More documents or duplicate records do not complete a missing premise.
3. **1770 — Claim Decomposition**: preserve atomic units, qualifiers and entity identity before checking reference support. A claim absent from a reference is not thereby false; unsupported claims must not disappear during decomposition.

The book links to existing article 1077 before the path and article 2241 after it. Each new topic contains one complete article and has revision 1. The three-topic path supports named previous/next topics, Back/Forward and completion at the end. Existing topic IDs, article/section IDs, body revisions, completion histories and the original one-topic path remain unchanged.

All three mappings, difficulty levels and the path are **editorial proposals**, not user-approved taxonomy. New guidance is labelled ANALYSIS and separate from captured source content. Source FACT/CLAIM/ANALYSIS/SIMULATION labels and uncertainty language are retained verbatim where present; the importer does not add source labels or reclassify a simulation as factual evidence.

## Sources, integrity and scope

Anonymous REST GET captured 1740/1755/1770 on 2026-10-26. Exact canonical URLs, observed modified_gmt revisions, response-byte hashes, content.rendered UTF-8 hashes and all image metadata hashes are in reference/source-exports/public-rest-2026-10-26/capture-manifest.json.

The saved three bodies add 95 headings, 15 local image files and six reviewed simulations. Together with the retained pilot: **8 complete articles, 233 sections, 35 unique media files, 33 inline plus 8 featured placements, and 12 reviewed lab roots**. Visible source captions, credits, alt text and original references are retained. No missing source image metadata, duplicate source IDs or missing source anchor targets were found in this capture.

The public capture is distinct from the previously inaccessible Library source ZIP. Hashes establish identity and captured bytes, not factual correctness, author ownership or raw WordPress database equivalence.

## Reproduce without network

Fresh checkout contains the validated public catalog, complete bundles, source captures and local media. Node.js 24 and installed Chrome/Edge suffice; no dependency installation or credentials are required.

- `node scripts/import-evidence-batch.mjs` replays the three saved captures with response/body/media hash checks; repeated imports retain IDs and revisions.
- `npm run lint`, `npm test`, `npm run evaluate`, `npm run build:pages`, `npm run test:pages`.
- `npm run serve`; open the printed loopback URL.
- For an explicit new read-only capture, `node scripts/capture-evidence-batch.mjs` throttles requests 1.6 seconds, records checkpoints and stops on HTTP errors including 429. Existing captured bytes must match checkpoints. A changed upstream revision requires a separately reviewed capture; do not overwrite a checkpoint to silence a mismatch.
- The legacy five-source importer describes the previous capture; it is not the release assembly command. Avoid stale offline overrides from another worktree.

## Interactive and search limits

See evidence-interactives.md. Six new reviewed literal local modules retain authored deterministic rules; exact source hash/revision/URL gates activation. Imported scripts/styles are not executed. No new trackers, network APIs, credentials or persistent lab state are added.

The simulations are not LLMs, real retrievers, NLI, training, actual authorization decisions or external-world verification. All-world truth remains UNKNOWN where the source says so.

Keyword search remains local. The historical five-source test is kept in its original corpus scope because IDF depends on corpus size. The expanded eight-source diagnostic retains all seven historical expected sections in the top five, with source hit@1 1/7, source hit@5 6/7, section hit@1 5/7 and section hit@5 7/7. The old section hit@1 was 6/7; H04 now ranks a different relevant UTF-8/byte-offset heading from the same article first. No relevance gold labels were changed and no semantic-search claim is made. Further Thai relevance judgments remain editorial work.

## Release and evidence

The existing workflow checks the exact PR head and deploys only main to the existing Pages route. New content tests pin all original five articles, sections, topics, path and body records to the PR #5 baseline, test source integrity and private/unknown exclusion, and retain all existing interactive regressions.

Browser evidence is saved under artifacts/evidence-path; live verification uses artifacts/live-evidence-path with HM_LIVE_URL and HM_EXPECTED_RELEASE_SHA. Tests exercise controls and semantic winning/abstention/unknown cases, repeated chapter navigation, history, reset, image loading, duplicate IDs, labels and desktop/mobile overflow. This is bounded browser coverage, not certification of every assistive technology.

Original homepage, WordPress, affiliate, RAMAGAN, ECC, credentials, access and costs are unchanged. Rollback is a reviewed revert of this release.
