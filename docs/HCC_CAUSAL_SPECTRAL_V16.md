# HCC V16 · Conditional causal–spectral bridge

**Status:** Draft research gate, not a production model, official likelihood, validated Einstein–Boltzmann solver, cosmic topology detection, or a solution of any Millennium Prize Problem.

## Verified background → observation

Closed FLRW present-day radius R and background H(z), with a=1 today:
```
OmegaK = -(c/H0/R)^2;
chi(z) = (c/R) * integral_0^z dz'/H(z');
DM(z) = R*sin(chi(z));
DH(z) = c/H(z);
DV(z) = (z * DH * DM^2)^(1/3);
```
The programme's R=548.3245 Gly with H0=67.4 km/s/Mpc yields **OmegaK≈−0.0007000**. This is derived from an **assumed HCC model radius**, not a measurement.

A companion independent Python run compared 13 published DESI DR2 BAO entries. With fixed reference H0=67.4, Omega_m=.315, Omega_r=.00009, rd=147.09 Mpc, a simplified within-tracer-only residual diagnostic yields 31.7855 (near-flat 31.2397). Fitting H0 and Omega_m gives 10.6249 (near-flat 10.6052). These numbers are **not the official DESI likelihood**, and no statistical detection is claimed. Original DESI materials: https://www.desi.lbl.gov/2025/03/19/desi-dr2-results-march-19-guide/ and https://data.desi.lbl.gov/doc/papers/dr2/.

## Sourced test scalar → angular observability

A minimally coupled scalar on an assumed conformal FLRW background has action S=∫√(-g)[−(∇φ)²/2−M²φ²/2+Jφ] and exact mode equation
```
q_nA''+2(a'/a)q_nA'+[n(n+2)/R²+a²M²]q_nA=a² J_nA.
```
For the massless field, set x=η/R and E_n=[q_x²+n(n+2)q²]/2. Then
```
E_n(x) + integral(2a_x/a * q_x²) - integral(a² Jhat q_x) = E_n(initial).
```
Under isotropy, the normalized positive-definite SU(2) kernel is
```
k_n(gamma)=sin[(n+1)gamma]/[(n+1)sin(gamma)]
```
and for a scalar sky shell the angular coefficients are nonnegative and exactly zero for ell>n. These statements do not identify q with the gauge-invariant gravitational potential or the sky with observed CMB TT.

**No-go:** finitely many angular moments cannot uniquely reconstruct an unconstrained, sufficiently wide nonnegative primordial source spectrum. The missing Einstein–Boltzmann line-of-sight transfer and full-data likelihood cannot be silently filled in by the scalar model.

## Compatibility & safety

The new module is side-effect-free. Existing HCC constants, 138 labs, 150 instruments, release routes, first-principles Fibonacci braid conventions, manifest and production UI are unchanged. The complete offline visualization and mathematical paper are separate, reproducible artifacts in the conversation archive; they are not automatically hosted by HCC.

Tests: `node --test test/hcc-causal-spectral-v16.test.mjs`. Neither CI nor release QA has been invoked in this branch.

## Transfer gates from openai/math

- Family 350: near-round nodal counterexamples obstruct automatic transfer to non-round metrics.
- Family 376: smooth **forced** Navier–Stokes computation on flat domains is not a proof for unforced round S3.
- Family 130: exact-arithmetic DFT speedups do not establish floating precision or curved harmonic complexity.
- Family 269: Laughlin lattice/Fock gaps are not continuum quantum Yang–Mills mass gaps.
- Family 365: boundary inverse theorem does not directly apply to a closed sphere.

Repository https://github.com/openai/math README itself warns that some not-yet-formalized manuscripts may contain gaps, and history contains withdrawals. Hypothesis transfer takes precedence over apparent similarity.

## P0 review gate

1. Reproduce the PDF derivations and tests; check units and source action independently.
2. Replace the approximate BAO residuals by an official likelihood and survey covariance.
3. Implement gauge-invariant Einstein–Boltzmann perturbations for closed FLRW and validate against CLASS.
4. Add typed provenance edges to HCC manifest only after review.
5. Do not merge this draft or assert a new physical detection without author approval.
