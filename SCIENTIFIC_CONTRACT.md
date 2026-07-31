# Scientific Contract

The atlas is an interactive scientific model, not an oracle. Every visual claim
must remain traceable, reproducible and falsifiable.

## Epistemic status

Every exported datum and every future laboratory plugin must declare one status:

- `measured` — directly reported by an observation or experiment;
- `inferred` — estimated from measured data under a stated model;
- `derived` — computed from declared inputs and equations;
- `simulated` — produced by a numerical model with disclosed boundaries;
- `hypothetical` — a testable model assumption or prediction;
- `illustrative` — a visual or pedagogical aid that is not evidence.

The UI must never promote a datum to a stronger status through animation,
precision formatting or visual proximity.

## Scientific datum

A load-bearing numerical value should be representable as:

```text
value
quantity kind
unit and physical dimension
reference frame and observer
epoch and time scale
uncertainty distribution and covariance reference
epistemic status
source identifier, version and licence
formula or solver identifier, parameters and code hash
validity domain
verification results
```

A scalar without its quantity kind is not a scientific identity. Consequently,
Inverse Atlas requires a quantity selection. Its explicit all-kinds mode is an
exploratory coincidence scan and does not assert equivalence.

## Relation types

Every future relation edge must use one declared type:

1. exact identity;
2. unit, coordinate or observer transformation;
3. isomorphism or equivalent representation;
4. limiting reduction;
5. shared symmetry;
6. shared invariant or conservation law;
7. scale transformation;
8. empirical correlation;
9. causal hypothesis;
10. analogy;
11. contradiction or competing explanation.

Each edge must state its transformation, domain, evidence, uncertainty and test.
Numerical equality alone is not a relation.

### Invariant Nexus operational classes

Invariant Nexus presents the canonical taxonomy through eight interface classes:

| Nexus class | Canonical relation types | Required interpretation |
|---|---|---|
| `exact` | 1 | A theorem or exact identity only inside the stated mathematical model. |
| `representation` | 2–3 | A coordinate, basis, isomorphism or equivalent-representation statement; physical systems may still differ. |
| `invariant` | 5–6 | The same typed symmetry, invariant or conservation law is measured or asserted under declared domains. |
| `limit` | 4 and, where explicit, 7 | A limiting/effective reduction with assumptions; never a universal identity. |
| `coupling` | 7–8 or a declared model input | One model can condition or feed another; this does not imply a unit-safe coupled solver. |
| `causal` | 9 | A directed, conditional physical succession. Comparison traversal may inspect it in either direction but may not reverse the causal claim. |
| `analogy` | 10 | Shared structure or morphology without physical identity. |
| `contrast` | 11 | A discriminating comparison, contradiction or competing explanation that must remain visibly distinct. |

Every Nexus node is an interface proxy for a laboratory, not a second physical
object. Its two exported positions are visualization coordinates. The
disciplinary embedding groups fields by human taxonomy; the invariant embedding
is a deterministic projection of relation-type counts. Neither coordinate is a
physical distance, similarity magnitude, probability, evidence score or causal
effect.

A Nexus path means only that consecutive laboratories share declared typed
edges. A mixed path is not a proof of equivalence or unification. It is not a
causal chain unless every edge is explicitly causal, correctly oriented and
valid under one compatible scenario. JSON exports must preserve the edge type,
claim, status, direction flag and this non-metric disclaimer.

## Validation obligations

Each laboratory must eventually provide:

- at least one analytic or published benchmark;
- dimensional and domain checks;
- deterministic replay parameters;
- numerical convergence or conservation checks where a solver is used;
- provenance and uncertainty for every load-bearing output;
- an explicit statement of what could falsify the represented claim.

The repository validator is a trust gate, not proof that a scientific hypothesis
is true. Passing checks means that the implementation satisfies its declared
contracts and benchmarks.

## Version discipline

Publication labels, application calculations and independent model extensions
must be stored separately when they do not numerically coincide. The FB(S³)R
`N_rec=266` publication label and the CoScale clock `t(N)=t_P phi^N` are the first
enforced example of this rule.
