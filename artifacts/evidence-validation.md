# Evidence path validation — pre-commit working tree

Base revision: 30caf8d412ccf7e5ed71bb9afd83b871fb16a96f. These local results validate the proposed working tree; they are not a claim that the base release already contains these changes. Exact-head CI and deployed release verification follow the commit.

- Lint: 49 JavaScript files plus schema/reference validation PASS.
- Full suite: 45/45, zero skips; evidence-full-tests.txt.
- GitHub Pages prefix: 4/4 browser suites, zero skips; evidence-prefix-tests.txt.
- New source integrity and interactive acceptance after final mobile adjustment: 7/7, zero skips; evidence-final-targeted.txt.
- Keyword evaluation: evidence-search-evaluation.txt. Historical five-source benchmark scope is unchanged; expanded eight-source metrics and the H04 heading reorder are documented in docs/evidence-learning-path.md.
- Pages build and artifact verification PASS; evidence-build.txt. Its stamp is the pre-commit base and must not be reported as a deployment of this working tree.
- Independent read-only review found no actionable source-publicity, hash-gating or sanitizer issue; a reported encoding problem was disproved by UTF-8 byte inspection and corrected by the reviewer.
- Local high-confidence secret scan: 251 text blobs, zero findings before commit.
- Screenshots: evidence-path/ for six new labs on desktop/mobile plus book overview. Original six lab regression proofs are generated separately.

Final receipt will record the actual PR head, merged release SHA, successful CI and live checks.
