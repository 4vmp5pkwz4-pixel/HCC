# HCC Parity-Odd Observatory — model and interface contract

Status: **model-derived / conditional scientific instrument**, not observed cosmic topology. Entry point: docs/parity-odd-lens.html (use a local HTTP server or GitHub Pages). It is intentionally isolated from the main Atlas boot sequence and from draft IPSE PR #437.

## Native parameter manifold, not dynamical phase space

Coordinates: a/m, e/m, r/m, mu=cos(theta) with m>0, a²+e²≤m², e≥0, r≥r+, r+/m=1+sqrt(1-(a/m)²-(e/m)²) and -1≤mu≤1. This is a **parameter slice of stationary solutions**, not a symplectic phase space; varying a slider does not simulate a physical trajectory.

In units m=1, with sigma=(a/m)*mu, z=r/m+i sigma, D=(r/m)²+sigma² and dimensionless c²=(e/m)², the adopted principal-tetrad scalar is:

psi2 = (-1 + c²/conj(z))/z³; I=3 psi2²; J=-psi2³; P=-48 Im(psi2²).

The signed radial-shell observable m Q_P is the exact polynomial

8 sigma / D^4 * [9 r^4 - 14 r² sigma² + sigma^4 + 12 c² r (sigma² - r²) + 2 c^4 (2 r² - sigma²)].

Here r denotes dimensionless r/m. It satisfies -dQ/dr = D P at fixed sigma. The orientation is fixed; reversing orientation flips parity-odd signs. An integral over the full angular sphere vanishes by north–south antisymmetry. No numerical result is presented as empirical observation.

## Visual and epistemic contract

- Curvature globe: orthographic **display projection** of the latitude-dependent shell; nonlinear color saturation is qualitative, numeric cards carry actual dimensionless outputs. Selecting a hemisphere samples mu.
- Horizon atlas: physically allowed (abs(a/m), e/m) disk and north-pole shell sign at r=r+; not evolution or conserved symplectic flow.
- Four number cards: radial shell, local Pontryagin density, quadratic I and cubic J. No reinterpretation of I/J as independent dynamical charges.
- Bridges: EXACT_WITHIN_MODEL, CONDITIONAL_INTERFACE, STRUCTURAL_ANALOGY, REFUSED are explicit. The round-S³ cosmological topology link is REFUSED absent a real derivation or observation.
- State export includes assumptions, values and statuses; interactive controls reject or clamp invalid parameters. e/m is charge magnitude, not Newman–Penrose q used in separate contact linearization.

## Tests and limits

node --test test/parity-odd-phase.test.mjs checks horizon/domain rejection, north/south parity, I/J relations, radial-shell derivative versus density (central difference), vacuum nodal threshold, leading far-field expansion and comparison semantics. These are regression checks; they do **not** prove priority, completeness of the Einstein–Maxwell contact-gauge complex, stability of Kerr–Newman or global cosmic topology.

Scientific provenance: Preece–Batenin ParityOdd revisions v20–v23, with the standard Kerr–Newman Weyl scalar. The phase-space engine in [PR #437](https://github.com/4vmp5pkwz4-pixel/HCC/pull/437) is separate and draft: a future typed adapter must not upgrade CONDITIONAL_INTERFACE silently.
