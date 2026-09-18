# Poinsot / Dzhanibekov visualization closure

Status: ACTIVE IMPLEMENTATION LEDGER

The reduced Euler-top kernel is exact; the renderer is not yet the full classical Poinsot construction. This ledger keeps that distinction explicit while closure proceeds in independently testable increments.

## Closed by this increment once the renderer patch is present
- The previously empty `polGrp` is populated from the same `poinSolve / poinOmega` Jacobi solution as the live reduced orbit.
- The family spans both sides of `L² = 2 E I₂` and includes near-separatrix curves.
- The visible title identifies exact **reduced ω-space**, not the complete classical rolling construction.
- The wingnut attitude is visibly labelled an illustrative first-order integration and is not assigned EXACT status.
- A permanent verifier checks both quadratic invariants, one-period closure, renderer/kernel coupling, and the epistemic labels.

## Still open
1. Classical Poinsot invariable plane, contact point, rolling ellipsoid and herpolhode.
2. Reconstruction about fixed spatial angular momentum `L`, with convergence/error verification before any EXACT attitude label.
3. Explicit local-time provenance or a declared mapping from canonical Atlas time to dimensionless Euler-top time; never identify this with J2000/cosmic time.
4. Typed/admissible controls for additional inertias or energy only if they preserve `2 E I₁ < L² < 2 E I₃`.
5. Synchronized multiview from one state authority: reduced ω-space | classical Poinsot | separatrix diagnostic.
6. Preserve `poin → psr` as structural analogy, not neutron-star dynamics.

## Acceptance boundary
- Reduced dynamics: exact Jacobi kernel, invariants verified numerically to machine-scale tolerance.
- Attitude: illustrative until reconstruction is upgraded and verified.
- Classical Poinsot: not claimed until invariable-plane/herpolhode geometry exists.
