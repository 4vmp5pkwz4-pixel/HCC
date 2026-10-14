# Geometry of Light — canonical HCC research metasystem (October 10, 2026)

**Status: CONDITIONAL reference lab, NOT a new visual atlas, not peer-reviewed.**
Research program: Batenin--Preece, *Null Beltrami Geometry on the Round S³* (Zenodo 23214269); Hopf--Jacobi manuscript V8.
Catalog pinned: [openai/math at fd4aeeb](https://github.com/openai/math/tree/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb).

## Algebraic interface with strict physical separation

For an independently certified fixed-Hopf null Beltrami field on round S³:

    F_p = p(z1,z2)(X2+iX3),  curl F_p=(m+2)/R F_p, F_p·F_p=0.

With X2, X3 orthonormal and the specified orientation, the optical equal-time intensity is

    I_p = (|Re F_p|² + |Im F_p|²)/2 = |p|².

A *different* physical sector, the real Beltrami fluid field u=Re F_p, has a pressure-balanced unforced Hodge solution u(t)=exp[-nu(m+2)²t/R²]u(0), with P-P0=-|u|²/2. Ebin--Marsden has a different modewise damping exponent. These are distinct PDEs sharing a construction, not a Maxwell/Navier--Stokes unification.

## Finite algebraic tomography

For degree m, c_k binary coefficients, at each of m+1 distinct Hopf latitudes x in (0,1), acquire 2m+1 equispaced intensity values I(x,delta). The azimuthal Fourier coefficient is

    I_hat_d(x) = [x(1-x)]^(d/2)
      sum_(l=0)^(m-d) c_(l+d) conj(c_l) x^l(1-x)^(m-d-l).

Degree-(m-d) Bernstein interpolation recovers every Gram entry c_(l+d)conj(c_l). This matrix is Hermitian, positive rank one for pure p, and reconstructs c modulo global U(1) phase. Its root divisor, multiplicities and Hopf-fibre topology follow. The JS implementation is deliberately restricted to m<=6. It does not claim uniform numerical stability, accuracy on real data, or independent proof of the input null-Beltrami classification.

## Exact no-go gate

For m>=2, p=z1^m and q=sqrt(m) z1^(m-1)z2 have identical integrated intensity and signed curl eigenvalue. They generate identical single-shell fluid energy and helicity histories but distinct projective root partitions m and (m-1,1). Thus global energy/helicity spectroscopy alone cannot reconstruct the nodal divisor, even without noise.

## Prior art and OpenAI Math theorem transfer

- Null Maxwell polynomial knots are prior art: de Klerk et al., Phys. Rev. A 95, 053820 (2017), DOI 10.1103/PhysRevA.95.053820; Bode, Commun. Math. Phys. 387 (2021), DOI 10.1007/s00220-021-04219-3.
- Majorana stellar/Husimi roots and optical spin representation predate this program: Phys. Rev. A 110, 063716 (2024), DOI 10.1103/PhysRevA.110.063716.
- [OpenAI Math 350](https://github.com/openai/math/blob/main/lean/docs/350.md) gives nodal counterexamples for nonround smooth metrics; no general-round extrapolation.
- [OpenAI Math 365](https://github.com/openai/math/blob/main/lean/docs/365.md) concerns a boundary Dirichlet-to-Neumann problem; no physical boundary or DN operator is supplied by the Hopf-base sampling problem.
- [OpenAI Math 376](https://github.com/openai/math/blob/main/lean/docs/376.md) gives forced flat-domain flows; it is not an unforced S³ theorem.
- The actual HCC already has native signed-curl, Hopf, Maxwell, and Navier–Stokes science. This is an additive typed bridge, not a substitute.

## Integration scope

Canonical HCC has an approximately 20 MiB index.html and shared Three.js, WebGPU/XR and iPhone navigation. This research draft adds only a pure kernel, native typed lab, provenance coverage, tests and scientific contract. **No new HTML, cloned atlas, false world count, new camera or speculative cosmological parameters.** A native 3D scene is not implemented and not claimed.

Future native integration must reuse existing 3D fibre curves, time, quantity bus, camera, provenance, i18n and mobile bottom sheet. Compare draft IPSE #437 and other live PRs first.

## Tests

    node --test test/s3-light-geometry-meta.test.mjs
    node --test test/s3-hopf-jacobi-certificate.test.mjs
    npm run test:research

**Do not merge without independent math and source review and explicit author approval.** No world-priority assertion, no experimental confirmation, no universal unforced PDE closure, no cosmic S³ detection.
