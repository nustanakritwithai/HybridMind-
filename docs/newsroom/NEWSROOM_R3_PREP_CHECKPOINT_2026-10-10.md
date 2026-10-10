# HYBRID MIND — Newsroom R3 preparation checkpoint (2026-10-10)

Baseline R2 commit: `413e8cbd50a09dde2cc51566f479b4e6e1faefd1`.
Isolated R3 branch: `feat/newsroom-r3-draft-adapter-prep-20261010`.

## Verification (offline, 0 WordPress writes)
- Existing R2 source and node renderer blob SHA rechecked.
- R2 25-test suite independently re-run from a clean copy: **25/25 PASS** after fixing an untracked `output/cli-base.gutenberg.html` fixture dependency in the offline patch.
- R3 claim-scope + REST-shaped adapter tests: **36/36 PASS** using mock WordPress only.
- Real Node v22.16.0 end-to-end CLI: exit 0, 12,492-byte Gutenberg output, SHA-256 `aae8e4fc66cb85fb650ad663cb6101b5f514d1b285234d0ff3799243f190080d`; mock timeout/replay returned the same post ID.
- Chromium Mock: 320,375,390,768,1280,1440 CSS px; no page overflow. This is NOT WP Preview or physical Android.
- New claim review separates schema/source-reference structure (PASS fixture) from substantive claim support (**HOLD**, human review required).
- Thai copy from offline authored fixture; **zero AI calls**, no real model quality result.

## Remote WordPress boundary
Read-only `/wp/v2/users/me?context=edit` showed connected role `administrator` with `publish_posts=true` and `edit_others_posts=true`: it is **not** draft-only.
Current `posts.create` schema did not expose the required durable `hm_newsroom_job_id` and `hm_newsroom_owner` metadata; registration/readback is unproven. No new credentials/plugins were created.

## Full local deliverable (separate artifact)
Filename: `HYBRIDMIND_Newsroom_R3_Preparation_Source_Evidence.zip`
SHA-256: `ba1e3aa6cf924b9271f560157084e71c96835fbcdade2c01aa46560867ad91a0`

The archive contains the new `tools/newsroom_v3/` Python transport/ledger/claim-review code, tests, R2 portability fix, reproducible commands, complete case-level results, Chromium mock preview, additive diff, and one-Draft approval plan. **These source files were tested in an isolated local workspace; this checkpoint commit does not claim the archive contents have been pushed to GitHub.** Integrating the tested archive into this branch remains a separate transfer step.

R3 safety: live REST POST disabled in code; no WordPress Draft created or published; no scheduler, API/model expense, Homepage/CSS/Template/Typhoon/Affiliate changes.
Codex's unpushed workspace remains UNKNOWN; path ownership and review notes are in the local archive. No auto-publish approval is implied.
