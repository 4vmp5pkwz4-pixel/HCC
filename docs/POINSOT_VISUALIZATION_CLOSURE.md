# Poinsot / Dzhanibekov visualization closure

Status: ACTIVE IMPLEMENTATION LEDGER

The reduced Euler-top kernel is exact; this increment does not claim the full classical Poinsot construction.

## Closed in this increment
- The previously empty `polGrp` is populated from the same `poinSolve / poinOmega` Jacobi solution as the live reduced orbit.
- The rendered family spans both sides of `L² = 2 E I₂`, including near-separatrix trajectories.
- The visible title now identifies the scene as **reduced Euler-top ω-space** rather than the complete classical Poinsot rolling construction.
- The body attitude remains explicitly documented as illustrative first-order reconstruction, not exact attitude reconstruction.
- A permanent verifier independently checks both quadratic invariants and one-period closure for every rendered family ratio, and checks that the renderer uses the canonical exact kernel.

## Still open
1. Classical Poinsot invariable plane, contact point, rolling ellipsoid and herpolhode.
2. Reconstruction about fixed spatial angular momentum `L`, with convergence/error verification before any EXACT attitude label.
3. Explicit local-time provenance or a declared mapping from canonical Atlas time to dimensionless Euler-top time; never identify this with J2000/cosmic time.
4. Typed/admissible controls for additional inertias or energy only if they preserve `2 E I₁ < L² < 2 E I₃`.
5. Synchronized multiview from one state authority: reduced ω-space | classical Poinsot | separatrix diagnostic.
6. Preserve `poin → psr` as structural analogy, not neutron-star dynamics.
