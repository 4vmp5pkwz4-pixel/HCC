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
