# HCC × OpenAI Math — Hopf–Jacobi V6 physical-time projective proof gate

**Status:** conditional finite spectral reference calculation, not a new atlas.
**Source:** openai/math pinned to fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb, 372 catalog families / 719 manuscripts. The catalog itself cautions that not all results are formally verified. Local Lean verification of all families was not performed.

## Physical-time bridge

For a finite L2-orthonormal real divergence-free curl eigensystem on exact round S3 of radius R, consider the heat orbit

    U(t) = Σ_j c_j exp[-ν (λ_j²−c_R)t] e_j
    c_R=0 (Hodge), 4/R² (Ebin–Marsden).

This is an unforced nonlinear Navier–Stokes solution ONLY if its Leray projected convection vanishes for every t. The previous V5 supplies separate vector-field identities for a commuting Hopf–Killing family; spectral assumptions alone do NOT certify that PDE.

Let W=||U||²=2E, M2=||curl U||², M4=||Δ_H U||². For W>0,

    v_FS² = ν² (M4/W−M2²/W²)
          = (1/4) d²/dt² log W
          = ν²/W² Σ_{i<j} A_i A_j(λ_i²−λ_j²)².

Also, d(M2/W)/dt = −2 v_FS²/ν for ν>0. For mode-energy proportions q_j=A_j/W, classical time Fisher information equals 4 v_FS². These are exact known spectral-variance / normalized heat-flow identities, specialized to this reducing HCC fluid sector. Prior art: https://doi.org/10.1103/ht2m-1j91 and https://arxiv.org/abs/1012.1337 . No quantum fluid physics is asserted.

**Chirality blind spot:** the signed curl variance Z−H²/W may be positive for two modes with eigenvalues λ and −λ, while their physical-time projective speed is zero. Rates depend on λ², not on λ. The reference kernel detects the blind spot algebraically from exact integer curl shell labels, not by testing approximate zero floating-point data.

## Fixed-Hopf nonlinear commuting sector (V5 inputs)

For K_- of signed curl −2/R and w_k=Re[c(z1 z2)^k(X2+iX3)] with curl 2(k+1)/R, the Lie bracket vanishes in the V5 mathematical setup and its mixed nonlinear Leray projection is zero. The result is CONDITIONAL on the previously checked frame/orientation and PDE hypotheses; this new spectral kernel does not reprove that vector-field statement.

With A(t),B(t) their squared modal L2 energies and δγ=4νk(k+2)/R², the exact mixture is

    q=B/(A+B), q/(1−q)=(B0/A0) exp(−2δγ t);
    v_FS²=ν²(λ+μ)² [Z−H²/W]/W;
    projective path length 0..∞ = arctan sqrt(B0/A0), ν>0.

The paths are FS meridians. The p_k constituent has two Hopf-linked nodal fibres (z1=0,z2=0) of multiplicity k; they are NOT necessarily nodal zeros of the full velocity K_-+w_k.

For exact two-mode measured W=2E and H=λA+μB, one has A=(μW−H)/(μ−λ), B=(H−λW)/(μ−λ). The rate invariant exp(2δγ t) B/A is constant in the exact family. Energy/helicity inversion is numerically ill-conditioned when either modal weight tends to zero; do not advertise pressure-only or noise-stable tomography.

Energy-only FS-speed estimation from centered second differences of log W has deterministic error

    |estimated v_FS² − true v_FS²|
    ≤ ε/h² + (h²/48) sup |(log W)''''|

for additive bounded log-energy measurement error ε and bounded fourth derivative.

## Transfer audit of selected OpenAI Math families

| Family | Mathematical hypothesis | Verdict for HCC S3 |
|---|---|---|
| 350 | Nodal counterexamples with smooth perturbed metrics near round S3 | HIGH PRIORITY NEGATIVE CONTROL; does not destabilize exact-round identities by itself |
| 376 | Forced smooth incompressible computation on flat torus / Euclidean space | REFUSED for unforced S3 nonlinear regularity |
| 130 | Exact discrete Fourier circuits | REDUCTION REQUIRED to any concrete S3 pressure tomography algorithm |
| 144 | Volume-preserving smooth diffeomorphism of flat T3 with simple Lebesgue spectrum | KOOPMAN COMPARISON ONLY |
| 087 | Mahler inequalities and symplectic width of convex polar products | CONDITIONAL on a genuine symplectic embedding, not automatic for CPm |
| 347 | Counterexamples to strong Arnold fixed-point bounds | NEGATIVE CONTROL for overgeneralized Berry/control claims |
| 374 | Stability of Brenier maps for Euclidean convex bodies | ANALOGY only: not stability of energy/pressure recovery |
| 365 | Inverse boundary Dirichlet-to-Neumann problem | REFUSED without a physical boundary operator |
| 362 | Relativistic Vlasov–Maxwell on R3 | REFUSED unless S3 global charge constraint satisfied |
| 290 | Modular spectral recovery with operator-algebra hypotheses | REFUSED: classical FS is not a modular flow |
| 269 | Laughlin gap on S2 | REFUSED: not S3 curl and not a classical fluid spectral gap |
| 062 | Positive quaternionic-Kähler / contact Fano | REFUSED without a real-CR/Hopf functor |
| 306 | Knot Dehn surgery on S3 | Conditional topological surgery only, not moving Hopf fibres |
| 344 | Blaschke metric rigidity | Conditional background metric theory; not cosmic topology detection |
| 345 | Closed geodesics | No eigenfield or nonlinear Navier–Stokes closure |
| 349 | Minimal hypersurfaces on round spheres | Hopf fibres are dimension one, not hypersurfaces |
| 260 | Penrose spacetime inequality with asymptotic ends | Hypotheses absent in standalone compact-S3 field |

Source scope pages: https://github.com/openai/math/blob/main/lean/docs/350.md and https://github.com/openai/math/blob/main/lean/docs/376.md . Related links for families 130, 144, 087, 347, 374, 365, 362, 290, 269 appear under the same lean/docs/ID.md path when extant; consult the actual counterpart before citing its formal proof. Lack of a family-level Lean file is not proof of a particular result.

## Closed locally vs still open

CLOSED in the specific finite-mode mathematical model: signed integer resonance; Gram-aware spectral variance; two-rate energy/helicity identities; viscous-time FS/Fisher/log-energy identity; explicit finite-difference noise bound. These are mathematics, not claims of independent historical novelty.

OPEN: full nonlinear off-family stability; all commuting signed-curl eigenpair classification; noisy pressure-only tomography for general fields; covariant Kerr–Newman / CR closure; physical cosmological topology; any unrestricted Navier–Stokes Millennium result; publication-level prior art and peer review.

### Integration

The kernel and outputs live in the native HCC typed laboratory s3.hopf_jacobi_certificate. This draft PR does NOT alter the main 20+ MiB index.html or its WebXR/mobile scene. Future visualization must route through the actual HCC shared runtime, 3D quantity bus, provenance and epistemic contract. Do not merge draft #500 without author review.
