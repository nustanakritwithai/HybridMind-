# HYBRID MIND — Newsroom R2 CLI / Mock Adapter Evidence

Date: 2026-10-10 (Asia/Bangkok). **UNKNOWN ≠ PASS**.

## Checkpoints
- `main` at audit: `c12eeaa569ec42f1903b82c62644625272e2e3af`
- R1 parent: `680411b112d3d9175f85640f44c770840057bbea`
- R2 isolated branch: `feat/newsroom-node-cli-mock-draft-r2-20261010`
- Additive code only: `tools/newsroom_v2/`, `tests/test_newsroom_v2.py`, `contracts/newsroom-item-v2.schema.json`, `examples/newsroom-agent-security.v2.json`.
- No `main`, Homepage, shared CSS, WordPress posts, plugins, credentials, or settings were changed. Zero WordPress API writes.

## Actual runtime / commands
Requirements: Node.js >=18; Python >=3.11; `jsonschema>=4.21` (see existing `requirements-newsroom.txt`). Run from repository root:

```bash
python3 -m pip install -r requirements-newsroom.txt
node --version
node tools/newsroom_v2/cli.mjs run --input examples/newsroom-agent-security.v2.json --out .local/r2 --db .local/r2.sqlite --now '2026-10-10T20:40:00+07:00' --mock-timeout
node tools/newsroom_v2/cli.mjs run --input examples/newsroom-agent-security.v2.json --out .local/r2-replay --db .local/r2.sqlite --now '2026-10-10T20:40:00+07:00'
python3 -m unittest tests.test_newsroom_v2 -v
```

Runtime tested: Node v22.16.0, Python 3.13.5, jsonschema 4.26.0. The existing renderer file matched GitHub blob SHA `265c14d1ea51639c8e1da1aaa8b31206ddf1f4e7` byte-for-byte. Local reconstructed v0.1 Visual Article JSON Schema matched remote semantics after sorted canonical JSON comparison (length 7223; FNV `8d763f1e`). Canonical contract in this GitHub branch is unchanged.

Gutenberg-only Node renderer: exit code 0, stderr empty, output 10,634 bytes (SHA-256 `a597e60a472d92f5f7094bfcc0e500dd9a7c857b4671847932db2d7c07c0a862`).

End-to-end Node CLI: validator -> existing Node Gutenberg renderer -> fixed citation/interactive composer -> HTML/serialized-block allowlist guard -> SQLite mock adapter. All five subprocess exit codes 0. Output 12,492 UTF-8 bytes, SHA-256 `aae8e4fc66cb85fb650ad663cb6101b5f514d1b285234d0ff3799243f190080d`. Source reference is visible/clickable in output; no script, 3 fixed native details. `editorial=PENDING`, `WordPress post ID=null`.

Simulated timeout after local mock commit: `MOCK_DRAFT_RECONCILED`, post ID 1, stable job `hmv2-2f1155cdabb39d0ea8361c1ecebf`. Same SQLite after replay: `MOCK_DRAFT_REPLAY`, one draft row, one job row, zero published rows, hash equal. Revision mismatch from simulated human edit produces HOLD rather than overwrite. Worker lock and duplicate event/source correction cases tested.

**Test matrix: 25/25 PASS, 0 FAIL** (cases run in four groups to respect isolated runner timeouts). Negative cases: invalid schema/source/date, old news, long headline, missing image proof, javascript URL, inline events, arbitrary Gutenberg block, injected markup, suspected secret, conflicting evidence, editorial gate, cross-source duplicate, source correction, retry/timeout, human edit, worker lease. Cases that HOLD produce no promotable Gutenberg artifact.

## Mock Chromium (not a WordPress Preview)
Desktop/mobile emulation at 320, 375, 390, 768, 1280, 1440 CSS pixels: no horizontal overflow; fixed HTML details clicked successfully. Separate stress HTML fixture tested long heading, table internal scroll, link, broken image. Not physical Android and not production rendering.

## WordPress approval gate (NOT ATTEMPTED)
For Site ID `257844857`, propose **one new** Draft titled “Google Research เสนอแนวทางความปลอดภัยของ AI Agent ที่ยึดบริบทเป็นหลัก”, slug candidate `google-research-agentic-privacy-context-report`, category AI News `26694707`, using only existing vetted Gutenberg output and no featured image. Confirm slug availability and category immediately before writing. Must obtain owner approval and a separately configured secure, restricted Contributor-equivalent credential: no publishing or editing others' posts. Register/query immutable job-owner metadata, enforce remote read-before-retry, post revision/content hash conditional check and independent WordPress readback. If privileges/metadata cannot be enforced: HOLD. Do not send keys via chat.

Draft creation/WordPress Preview/real Android QA: **NOT ATTEMPTED**. Recurrence, Typhoon paid API and Auto Publish remain OFF. Do not touch #57 or pages #67–#70. Rollback for this R2: revert additive GitHub commits; no Production rollback needed. Future test Draft rollback only by owner-approved trash of the newly verified test-owned post ID.

**R2 means local Node CLI plus mock adapter validated, NOT deployed automation.**
