# Reviewed evidence interactives

This set contains six local, deterministic simulations copied as literal reviewed implementations from the public WordPress REST export captured 2026-10-26. They do not fetch data, execute imported script text, or access browser storage. The source scripts are listed under `reference/source-exports/public-rest-2026-10-26` (posts 1740, 1755 and 1770, script variants 0 and 1). The modules preserve their authored toy fixtures and rule-based calculations; they are not model evaluations or evidence about a live system.

| Export root | Local kind / mount | What it demonstrates | Main scientific boundary |
|---|---|---|---|
| `hm-retrieval-explorer` | `retrievalExplorer` / `mountRetrievalExplorer` | Static ranks, retrieved set versus effective context, correctness, citation support, and Recall/Precision/coverage metrics | Authored ranks and complete/incomplete gold labels are toy data; no universal `k` or causal claim |
| `hm-retrieval-game` | `retrievalGame` / `mountRetrievalGame` | Diagnose two prepared retrieval traces, make budgeted pipeline changes, provide answer and source, then grade | Fixed deterministic challenge fixtures, not a trained retriever or generated answer |
| `hm-sufficiency-explorer` | `sufficiencyExplorer` / `mountSufficiencyExplorer` | Join evidence paths, metadata eligibility, query scope, duplicate records and unknown status | Sufficiency is only relative to the selected context and authored graph; world truth/model ability remain unknown |
| `hm-sufficiency-game` | `sufficiencyGame` / `mountSufficiencyGame` | Budgeted evidence collection, proof selection and answer checks | Costs are authored units, not monetary/token costs; only supplied proof options are graded |
| `hm-claims-explorer` | `claimsExplorer` / `mountClaimsExplorer` | Original-claim preservation, external support, unique versus raw records, qualifiers and atomicity | Entailment/support labels are authored catalog judgments, not NLI or verified world truth; `NOT_IN_REFERENCE` is not falsity |
| `hm-claims-game` | `claimsGame` / `mountClaimsGame` | Select and annotate claim records under capacity, then separately grade preservation and reference status | Seven slots are a toy capacity; support labels do not replace preserving every original claim |

## Integration contract

Each mount takes `(root, savedState)` and returns `{getState(), dispose()}`. Listener cleanup is bound to an `AbortController`; interactions query and mutate only within the supplied root. The source snapshots are exposed through the root `hmSnapshot()` hook for compatibility. The reader should preserve each root's `data-state`, `data-input`, `data-config`, `data-action`, `data-diagnosis`, `data-answer`, `data-source`, `data-candidate`, `data-fact`, and `data-support` hooks, along with `id`/source-anchor identity. Dynamic candidate/fact/annotation controls are created inside the root. Load `evidence.css` alongside the existing lab styles and assign the six exact `data-lab-kind` values in the registry.

The modules are fixed local implementations: no `eval`, runtime import of exported scripts, network request, persistent storage, or listeners on `window`/`document`. Text rendering uses DOM text APIs from the authored source implementations. Class and source data remain subject to review alongside each article's source hash and revision.
