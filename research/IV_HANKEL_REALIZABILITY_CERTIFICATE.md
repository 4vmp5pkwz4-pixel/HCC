# CONFIRMED INVARIANTS IV: Realizability and Hankel Observability

**11 October 2026 • mathematical working addendum • unreviewed**  
Part of META–CAUSAL SCIENCE II–III. Historical novelty unestablished. No claim to a new physical interaction or Millennium Prize solution.

## The model

For \(\gamma,\omega>0\), let \(q'=p,\ p'=-\omega^2 q-\gamma p\), and \(E=(p^2+\omega^2 q^2)/2\).

Prior work V3 proved the necessary equations
\[
(E''+2\gamma E')^2+4\omega^2E'(2\gamma E+E')=0,
\quad
E'''+3\gamma E''+(2\gamma^2+4\omega^2)E'+4\gamma\omega^2 E=0.
\]

## New-to-this-programme Theorem A: exact real realizability

If \(E\in C^3(I)\) solves the third-order linear equation, it is exactly the energy history of a real oscillator on \(I\) **if and only if** at one time \(t_0\)
\[
E_0\ge0,\quad -2\gamma E_0\le E'_0\le0,\quad
(E''_0+2\gamma E'_0)^2+4\omega^2E'_0(2\gamma E_0+E'_0)=0.
\]
Proof: reconstruct \(D=-E'_0/\gamma\), \(U=(2E_0-D)/\omega^2\), \(S=(E''_0+2\gamma E'_0)/(2\gamma\omega^2)\). These satisfy \(U,D\ge0,\ S^2=UD\), so \(\begin{pmatrix}U&S\\S&D\end{pmatrix}\) is PSD rank at most one, equal to \((q_0,p_0)(q_0,p_0)^T\). The energy of the true oscillator from \((q_0,p_0)\) matches the first three energy derivatives, and uniqueness of the third-order linear IVP implies identical histories. The state is unique up to simultaneous sign outside zero.

## New-to-this-programme Theorem B: exact observed Hankel invariant

Let \(H_3(t)=[E^{(i+j)}(t)]_{0\le i,j\le2}\) and \(Q=p^2+\gamma pq+\omega^2 q^2\). Direct symbolic factorization gives
\[
\det H_3=-2\gamma^2\omega^4 Q^3,\qquad Q'=-\gamma Q.
\]
Thus \(e^{3\gamma t}\det H_3(t)\) is constant. For \(0<\gamma<2\omega\) and nonzero state, \(Q>0\), so \(\det H_3(t)<0\) always. For critical/overdamped cases, determinant zero corresponds to a modal eigendirection \(p=\lambda q\), \(\lambda^2+\gamma\lambda+\omega^2=0\), or zero state.

## New-to-this-programme Theorem C: damping and natural frequency from energy alone

If \(\det H_3(t_0)\ne0\), solve
\[
H_3(t_0)(c,b,a)^T=-(E^{(3)},E^{(4)},E^{(5)})^T_{t=t_0}.
\]
Then \(\gamma=a/3,\ \omega^2=(b-2a^2/9)/4\) and the observational consistency identity
\[
27c-9ab+2a^3=0
\]
must hold. Additionally \(\gamma=-\frac13 \frac{d}{dt}\log|\det H_3|\). These are exact-identifiability statements, not robust-noise guarantees.

## New-to-this-programme Theorem D: distinguishable dynamical model classes

Every positive exponential mixture \(W(t)=\int_{\mathbb R} e^{-\lambda t}\,d\mu(\lambda)\), \(d\mu\ge0\), with finite fourth weighted moment, has a PSD temporal derivative Hankel \(H_3(W)\) since for all \(v\in\mathbb R^3\)
\[
v^TH_3(W)v=\int e^{-\lambda t}(v_0-v_1\lambda+v_2\lambda^2)^2\,d\mu(\lambda)\ge0.
\]
An underdamped nonzero oscillator instead has \(\det H_3(E)<0\). It cannot equal a positive exponential mixture on an open time interval. This directly connects the earlier positive moment--Hankel line of Hopf–Jacobi V7 to the causal realization theory.

## Verification and status

Independent symbolic proof checks: six identities. Exact rational parameter reconstruction: 3 cases. Floating checks: 990 parameter inversions, 800 realization trajectories, 160 rejected invalid initial cones, 800 positive exponential moment cases. Maximum model parameter residual in the verified numerical regime: \(1.23\times10^{-14}\). The complete local LaTeX/PDF and Python verifier are held in the associated ChatGPT research artifact.

**Scientific limits:** This is a theorem in one known linear microscopic model. The mathematical tools build on established realization theory, Hankel system identification and differential algebra; no independent priority review has shown that the exact combination is unknown to existing literature. High-order derivatives require verified error budgets in physical experiments. No claim about full nonlinear PDE regularity, Yang–Mills, or cosmic S³ topology follows.
