# Poinsot / Dzhanibekov visualization closure

Status: ACTIVE IMPLEMENTATION LEDGER

The reduced Euler-top kernel is exact; the renderer is not yet the full classical Poinsot construction. This ledger keeps that distinction explicit while closure proceeds in independently testable increments.

## Current verified boundary
- `poinSolve / poinOmega / jacobiSCD` implement the two Jacobi-elliptic reduced branches around `L² = 2 E I₂`.
- The current body-frame scene still needs the computed phase-family render applied.
- The wingnut attitude is first-order quaternion stepping and must remain non-EXACT.
- Local `poinT / poinSpeed` is not yet canonical Atlas time.
- `poin → psr` remains structural analogy, not neutron-star dynamics.

## Closure sequence
1. Populate the reduced phase family from the exact kernel and verify both invariants.
2. Add classical invariable-plane/contact/herpolhode geometry before calling the full view Poinsot.
3. Upgrade attitude reconstruction about fixed spatial `L`, with convergence/error verification.
4. Declare the lab-time mapping without conflating it with J2000/cosmic time.
5. Build synchronized multiview from one state authority.
