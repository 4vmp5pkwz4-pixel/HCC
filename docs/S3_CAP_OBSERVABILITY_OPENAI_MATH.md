# S³ cap observability — reference model admitted to the HCC computational core

**Research integration, 2026-10-08.** The lab `s3.cap_observability` is an
agent-callable computational reference model, NOT a new physical law or an
observational confirmation of compact cosmic spatial topology.

## Mathematical object

Let `H_<=L` be the scalar harmonic band on the *round* S³ of degree <= L,
and `C_chi` a geodesic cap around a fixed center. For a radial band, the
restriction Gram entries are

```
G_lm(chi) = (2/pi) integral_0^chi sin((l+1)t) sin((m+1)t) dt.
```

The witness `f_L(t)=(1-cos t)^L` belongs to this band. Its observed normalized
energy `r_L` satisfies the rigorously derived obstruction:

```
lambda_min(G_radial(chi)) <= r_L(chi) <= C_w(L) chi^(4L+3).
||inverse restriction|| >= r_L(chi)^(-1/2).
```

The smallest radial eigenvalue has *fixed L* small-cap asymptotic
`lambda_min ~ C_sharp(L) chi^(4L+3)`, with
`C_sharp = C_w / binomial(2L+1/2,L)^2`.
**Neither this asymptotic nor radial eigenvalues provide a lower bound on
the smallest eigenvalue of the FULL nonradial harmonic band.**

## Technical gates

- `node docs/verify-s3-cap-observability.cjs`
- `node --test test/s3-cap-observability.test.mjs`
- Inputs are refused rather than clamped. Positive Simpson quadrature stabilizes
  witness evaluation but is not interval-certified; no ill-conditioned
  eigenvalue diagonalization is used for scientific outputs.
- This module is registered in `core/index.mjs` and its code is included in
  the core provenance hash. It is NOT a visual station: `index.html`,
  `api/manifest.json`, and atlas instrument counts are unchanged.
- The math is independent of the radius R when the angular aperture is fixed.
  If `R_N=R_0 b^N` is additionally **assumed** and a fixed physical cap
  radius d is used, `chi=d/R_N`; every b>1 behaves analogously. This does
  **not** derive the golden ratio or a cosmic information-capacity law.

## Where the research technique came from

We examined OpenAI's mathematics catalogue as **methodological inspiration**,
especially families [122](https://github.com/openai/math/blob/main/lean/docs/122.md)
(trace reconstruction), [229](https://github.com/openai/math/blob/main/lean/docs/229.md)
(reconstruction on trees), and
[365](https://github.com/openai/math/blob/main/lean/docs/365.md)
(inverse boundary geometry). None of these results directly proves this cap
lemma: S³ has no boundary and the stochastic channels in 122/229 are different.
The mathematical antecedents include the Slepian concentration problem
(https://doi.org/10.1137/S0036144504445765).
The exact origin/priority of the sharp Jacobi coefficient still needs an
independent literature audit.

## Next non-automatic bridge

Derive a **physical** observation operator (causal propagation, radiation
transfer, detector response, noise) and compare its singular values to the
restriction model. Only then can a DRD or FBS3R capacity claim be made.
