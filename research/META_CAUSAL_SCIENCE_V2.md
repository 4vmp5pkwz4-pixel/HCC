# META–CAUSAL SCIENCE II

## Nonlinear Quotient Obstructions and Optimal Autonomous Laws

**Working paper — 11 October 2026.** This file records the mathematics published for review on the research branch. Full REVTeX/LaTeX and PDF are maintained as separate downloadable working artifacts.

### Theorem A: Vertical-bracket projectability

Let \(\pi:M\to Z\) be a smooth surjective submersion with connected fibers and \(F\) a smooth vector field. The following are equivalent:

1. There is a smooth \(f\) on \(Z\) such that \(d\pi_xF(x)=f(\pi(x))\).
2. For every vertical vector field \(V\), the Lie bracket \([F,V]\) is vertical.
3. For every smooth \(g:Z\to\mathbb R\), the function \(F(g\circ\pi)\) is constant on every fiber.

*Proof.* If \(F\) is projectable, \(F(g\circ\pi)=(fg)\circ\pi\) is basic, so all its vertical derivatives vanish; the bracket identity gives (2). Conversely, if \([F,V]\) is vertical, \(0=[F,V](g\circ\pi)=-V(F(g\circ\pi))\). Therefore \(d\pi F\) is locally independent of fiber coordinates, and connectedness identifies one smooth global field \(f\).

### Theorem B: Sharp scalar closure defect

Assume \(M=Z\times H\), with \(Z\subset\mathbb R\) and \(H\) compact. Set \(v(z,h)=d\pi F(z,h)\) and \(v_\pm(z)=\max/\min_h v(z,h)\). Then

\[
\inf_{b\in C(Z)}\sup_{z,h}|v(z,h)-b(z)|
=\frac12\sup_z[v_+(z)-v_-(z)],
\]

and the infimum is attained by \(b_*(z)=[v_+(z)+v_-(z)]/2\).

*Proof.* For each \(z\) the maximum error at the two endpoints of the interval of velocities is at least half its range. Their midpoint attains this lower bound. Continuity of extrema follows from compactness of \(H\) and continuity of \(v\).

For a vector-valued macrostate the corresponding pointwise invariant is the Chebyshev radius of projected fiber velocities. Smooth global selections require additional hypotheses.

### Theorem C: Intervention gate

For \(F_u=F_0+\sum_j u_jF_j\), if the admissible constant controls contain an open subset, closure for every admissible \(u\) is equivalent to projectability of all \(F_j\). This follows from the vertical Lie-bracket obstruction and its affine dependence on \(u\).

### Theorem D: Finite-horizon guarantee

Suppose a candidate macro drift \(b\) is \(L\)-Lipschitz and the true projected instantaneous velocity differs by at most \(\epsilon\) on all trajectories of interest. With common initial macrostate,

\[
|z(t)-\bar z(t)|\le \begin{cases}
\epsilon(e^{Lt}-1)/L,&L>0,\\ \epsilon t,&L=0.
\end{cases}
\]

*Proof.* Gronwall applied to \(e'=v(z,h)-b(\bar z)\).

### Oscillator falsification

For the oscillator \(q'=p,\ p'=-\omega^2 q-\gamma p\), the energy \(E=(p^2+\omega^2q^2)/2\) satisfies \(E'=-\gamma p^2\). All phases on a fixed energy ellipse have the same \(E\), but their energy derivatives range from \(0\) to \(-2\gamma E\). The exact minimax macro drift is \(-\gamma E\), with unavoidable instantaneous error \(\gamma E\).

The midpoint prediction \(E_0e^{-\gamma t}\) satisfies the proven bound \(|E(t)-E_0e^{-\gamma t}|\le E_0(1-e^{-\gamma t})\).

### Scientifically important boundaries

- This is a proof about declared smooth dynamical systems and coarse maps; **not** a new interaction law of nature.
- Projection of unforced dynamics **does not** imply closure under arbitrary interventions.
- Matching invariants is **not** proof of causality or identifiability.
- A finite numerical test **does not** establish a theorem beyond the proven hypotheses.
- This work does **not** solve Navier–Stokes global regularity, Yang–Mills mass gap, general relativity/quantum gravity, or other Millennium problems.

## OpenAI Mathematics transfer map

- [Family 365](https://github.com/openai/math/blob/main/lean/docs/365.md): nonuniqueness of a rough conductivity inverse problem; do not assume observations identify microphysics.
- [Family 374](https://github.com/openai/math/blob/main/lean/docs/374.md): sharp one-third Hölder stability of Brenier maps; stability exponents depend on the actual inverse channel.
- [Family 350](https://github.com/openai/math/blob/main/lean/docs/350.md): counterexamples to smooth near-round nodal bounds; geometric transfer needs additional hypotheses.
- [Family 229](https://github.com/openai/math/blob/main/lean/docs/229.md): selected proof scope is the supercritical reconstruction direction; not a universal reconstruction threshold.
- [Family 376](https://github.com/openai/math/blob/main/lean/docs/376.md): forced fluids that encode computations in specified settings; not universal solutions to unforced Navier–Stokes.

OpenAI's repository warns that unformalized results may contain errors and records revisions and withdrawals. It is a source of results to evaluate, not an automatic oracle proving cross-domain transfer.
