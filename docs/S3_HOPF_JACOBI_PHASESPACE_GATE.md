# HCC × OpenAI Math — Hopf–Jacobi / projective spectral gate

**Status:** native HCC typed reference lab; experimental research branch, not a new HTML atlas.
**Source baseline:** HCC main SHA be29b50f70b2aea50ea7a99654a40b28e74497b5.
**Catalog:** openai/math fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb (verified identical to latest main on 2026-10-10).

## Scientific scope and prior work

OpenAI Math family [350](https://github.com/openai/math/blob/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb/lean/docs/350.md) includes smooth-metric nodal-set counterexamples in dimension three. Those counterexamples do not turn into a classification for the **exact round** S³; conversely a round-S³ Hopf fibre theorem is not automatically stable under perturbing the metric.

Family [376](https://github.com/openai/math/blob/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb/lean/docs/376.md) constructs **forced**, incompressible computations on a flat torus and Euclidean space. Its force, geometry and scope cannot be silently transferred to an **unforced** curved S³ Navier–Stokes problem.

The HCC already includes the much more extensive core/atlas/extracted.mjs, the Null Beltrami verifier and the integrated S³ Navier–Stokes verifier. This addition is a **spectral and theorem-transfer certificate**, not a replacement of those solvers, the 20+ MiB index.html, its native stereo renderer or mobile/XR user interface.

## Selection rule: what is really proved by this kernel?

On exactly round S³ of radius R, orient and normalize curl once. Assume **independently verified** solenoidal eigenfields of the following two types:

~~~text
R λ_H = m+2,                m≥0 integer
R λ_J = σ·2(n+1),           n≥0 integer, σ=±1
~~~

Then equality of signed eigenvalues holds iff σ=+1 and m=2n. For odd m and σ=+1, any n gives detuning |λ_H−λ_J|≥1/R. For σ=−1, detuning ≥(m+4)/R.

This is integer arithmetic **conditional on the assumed eigenfield constructions and their sign conventions**, not an independent Jacobi curl calculation. A negative sign must not be erased by applying the positive Hodge eigenvalue λ².

## Spectral invariant (not necessarily conserved)

Let the real divergence-free curl eigenfields u_i be L²-orthogonal, with squared norms A_i≥0 and signed curl eigenvalues λ_i. Different eigenvalues imply orthogonality because curl is self-adjoint on a closed oriented Riemannian three-manifold. Within a repeated eigenspace, use an orthogonal basis or combine the modes first.

~~~text
W=Σ A_i=2E
H=Σ λ_i A_i
Z=Σ λ_i² A_i
V=Z−H²/W=(1/W) Σ_{i<j} A_i A_j(λ_i−λ_j)² ≥0
~~~

This familiar weighted-variance identity is exact. If both components are nonzero, V=0 iff their signed curl eigenvalues agree. With two modes it reduces to AB(λ_H−λ_J)²/(A+B). For odd m, positive chirality and A,B>0 it follows that V≥AB/((A+B)R²). No novel global PDE theorem is claimed.

### Mandatory Gram correction in a resonant eigenspace

When the two input eigenvalues are equal, their eigenfields need **not** be orthogonal. Let A=||u_H||², B=||u_J||² and G=〈u_H,u_J〉 real. The actual sum has W=||u_H+u_J||²=A+B+2G, with |G|≤√(AB). When W=0, the sum is zero and no projective state exists. The typed laboratory therefore accepts an explicit **overlap** input, defaulting to 0 as an *assumption*, not a measurement. For distinct signed eigenvalues curl self-adjointness forces G=0; any nonzero overlap is rejected. For a common eigenvalue the Gram-adjusted packet is one spectral shell and has V=0 regardless of G. This is necessary to compute physical energy honestly from mode norms.

## Bridge to projective phase geometry (auxiliary, not viscous time)

In the complexification of the curl Hilbert space consider the unitary **auxiliary** flow
[ψ(s)] = [exp(−is curl)ψ(0)].
For the FS metric convention d_FS([ψ],[φ])=arccos|〈ψ̂,φ̂〉|, the exact squared projective speed and pure-state quantum Fisher information are

~~~text
|d[ψ]/ds|²_FS = V/W
F_Q = 4V/W.
~~~

Both equalities are instances of the **known** Hilbert-space spectral-variance / quantum-geometric relation. The parameter s is not Navier–Stokes time; these observables are not experimental data or claims of quantum nature of the fluid.

## Viscosity convention and nonlinear firewall

For solenoidal curl eigenfields on fixed round S³:

~~~text
γ_Hodge = ν λ²
γ_Ebin–Marsden = ν(λ²−4/R²)
~~~

Those modewise rates must not be promoted to an arbitrary nonlinear transformation between viscous flows. When all **actually verified** fields belong to one common signed curl eigenspace, the sum is Beltrami and its convection is a gradient; under appropriate pressure and viscosity convention it yields an exact unforced decaying flow. But **this module does not verify the input vector-field PDE, its pressure or its nonlinear forces**. Positive V does not rule out other solutions. The typed lab always returns nonlinear_pde_certified=false.

## Reproducibility and remaining gates

Run:

~~~sh
node --test test/s3-hopf-jacobi-certificate.test.mjs
npm run test:research
~~~

Checks include integer resonances, chirality, weighted multimode variance, sharp odd-degree obstruction, FS overlap finite differences, the distinct viscosity operators and explicit theorem-transfer refusals.

The native computational service registration is included in core/index.mjs, including its code hash. An atlas **3D scene is not included** and is not claimed. Future spatial integration must reuse the existing HCC geometry, shared runtime, quantity bus, mobile bottom sheet, stereo/XR and version/provenance contract; compare draft IPSE #437 and related Hopf / cap-observability branches first.

**No merge without independent review of the vector-field eigenmode definitions, normalizations, prior art and native UI/XR integration plan.**
