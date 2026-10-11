# META–CAUSAL SCIENCE III: Observable Differential Signatures and Interventional Completion

**Independent mathematical working draft, 11 October 2026**  
**Status:** theorems proved within declared polynomial-ODE models; unreviewed; historical priority not established; no new universal physical law claimed.

## Purpose

Extend V2's non-projectability test to an explicit, testable **differential-algebraic observable law** with three distinct gates:

1. A polynomial differential signature exists.
2. It may or may not determine one causally unique future trajectory.
3. An intervention can break symmetries hidden from passive measurement.

## Theorem 1 — finite polynomial eliminants

Let \(\dot x=F(x)\), with \(F\in K[x_1,\ldots,x_n]^n\), and \(y=h(x)\) a polynomial observable over a characteristic-zero coefficient field \(K\). Write \(H_j=L_F^jh\).

The \(n+1\) polynomials \(H_0,\ldots,H_n\) are algebraically dependent in the rational-function field of transcendence degree \(n\). Therefore there is a nonzero polynomial \(P\in K[Y_0,\ldots,Y_n]\) such that
\[
P(y,\dot y,\ldots,y^{(n)})=0
\]
on every solution. Compute possible \(P\)'s by Gröbner elimination of \(x\) from \(Y_j-H_j(x)=0\).

**This is classical differential algebra, not a new general theorem.** An eliminant is necessary, not in general a sufficient description of all physically possible trajectories.

## Theorem 2 — jet-rank closure gate

If the map \(\mathcal J_{n-1}(x)=(h,L_Fh,\ldots,L_F^{n-1}h)\) has Jacobian rank \(n\) at \(x_0\), the inverse-function theorem locally identifies the microscopic state from that observable jet, and \(y^{(n)}=\Psi(y,\ldots,y^{(n-1)})\) is locally single valued. Failure of this sufficient test is **not** in itself a global nonidentifiability theorem.

## Theorem 3 — damped oscillator exact observable laws

Take \(\dot q=p\), \(\dot p=-\omega^2 q-\gamma p\), \(\omega,\gamma>0\), and \(E=(p^2+\omega^2 q^2)/2\).

Direct elimination proves:
\[
\boxed{(\ddot E+2\gamma\dot E)^2+4\omega^2\dot E(2\gamma E+\dot E)=0}
\]
with \(E\ge0\), \(-2\gamma E\le\dot E\le0\).

At generic states, this implicit relation has **two acceleration branches**
\[
\ddot E=-2\gamma\dot E\pm2\omega\sqrt{-\dot E(2\gamma E+\dot E)}.
\]
The missing sign is \(\mathrm{sgn}(pq)\). Thus an exact input-output algebraic equation is not automatically a deterministic autonomous law.

A distinct explicit consequence is
\[
\boxed{E^{(3)}+3\gamma\ddot E+(2\gamma^2+4\omega^2)\dot E+4\gamma\omega^2E=0}.
\]
Not every solution of this linear third-order equation is physically realizable, since initial jets must also satisfy the algebraic constraint.

## Theorem 4 — invariant semialgebraic quotient

Write \(D=p^2,\ S=pq\). Then
\[
\begin{pmatrix}E\\D\\S\end{pmatrix}'=
\begin{pmatrix}0&-\gamma&0\\0&-2\gamma&-2\omega^2\\-2&2&-\gamma\end{pmatrix}
\begin{pmatrix}E\\D\\S\end{pmatrix}.
\]
The quadratic constraint \(C=\omega^2 S^2-D(2E-D)\) satisfies \(\dot C=-2\gamma C\).
The physical cone \(C=0,D\ge0,2E\ge D\) is invariant. Away from zero, the quotient identifies precisely the symmetry \((q,p)\sim(-q,-p)\).

## Theorem 5 — controlled response separates hidden state

For a constant, known input \(u\) added to the momentum equation, keep the *same* initial state under interventions:
\[
\dot p=-\omega^2q-\gamma p+u.
\]
Define ideal experimental response derivatives \(R_1=\partial_u\dot E_u(0)|_{u=0}\),
\(R_2=\partial_u\ddot E_u(0)|_{u=0}\). Then
\[
\boxed{p_0=R_1,\qquad q_0=-\frac{R_2+3\gamma R_1}{\omega^2}}.
\]
Proof: \(\dot E=-\gamma p^2+up\), \(\ddot E=(-2\gamma p+u)(-\omega^2q-\gamma p+u)\); differentiate with respect to \(u\) at zero. **This requires repeatable initial conditions and ideal derivative access; noise calibration is open.**

## Scope and prior art

Differential algebra, polynomial elimination, nonlinear observability and structural identifiability pre-exist this series. Notable current work: [Jeronimo–Lanciano, arXiv:2609.03828](https://arxiv.org/abs/2609.03828) (September 2026); [Falkensteiner–Pavlov–Sendra (2025)](https://doi.org/10.1016/j.sysconle.2025.106059); [Villaverde (2019)](https://doi.org/10.1155/2019/8497093).

Relevant OpenAI/math formalized-scope warnings: [365](https://github.com/openai/math/blob/main/lean/docs/365.md) inverse nonuniqueness; [374](https://github.com/openai/math/blob/main/lean/docs/374.md) sharp but context-specific transport stability; [376](https://github.com/openai/math/blob/main/lean/docs/376.md) engineered forcing, not universal unforced NS.

**Explicitly not claimed:** first-in-history theoretical novelty, universal law of nature, general PDE solutions, quantum gravity, or Millennium Prize solutions.

For full LaTeX/PDF and reproducibility logs, see the separate META–CAUSAL SCIENCE III research artifact generated alongside this branch.
