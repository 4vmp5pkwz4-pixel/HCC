# META–CAUSAL FOUNDATIONS VIII

## Constant-Conditioned Unbounded Intervention Synergy: Sharp Entrywise Robustness and a Finite-Shot Causal-Dimension Certificate

**Date:** 11 October 2026  
**Scientific status:** conditional mathematical working theorem, no historical priority established, no new experimentally confirmed interaction. A five-page PDF, editable LaTeX and executable verifier are available in the companion downloadable research artifact.

### 1. Deterministic sequential intervention model

For each \(n\ge2\), let \(P,Q\) act on column probability vectors by

\[
Pe_1=e_2,\quad Pe_j=e_{j+1}\ (2\le j<n),\quad Pe_n=e_2,
\qquad Qe_1=Qe_2=e_1,\quad Qe_j=e_j\ (j\ge3).
\]

Prepare \(e_1\), read the scalar effect \(e_1^\top\). Words are executed **left-to-right**, so \(f(uv)=e_1^\top M_v M_u e_1\).

Each intervention alone produces Hankel rank one: \(f(P^k)=\mathbf 1_{k=0}\) and \(f(Q^k)=1\) for \(k\ge0\). Use prefixes \(1,P,\ldots,P^{n-1}\), and suffixes \(1,Q,PQ,\ldots,P^{n-2}Q\) to build the \(n\times n\) table \(H_n=[f(uv)]\). Each probability equals 0 or 1. Maximum full word length \(2n-2\).

### Theorem A — Dimension-independent condition number

For \(n\ge3\), row and column permutations reduce \(H_n\) to

\[
B_3\oplus I_{n-3},\qquad
B_3=\begin{pmatrix}1&0&0\\1&1&0\\1&0&1\end{pmatrix}.
\]

The spectrum of \(B_3^\top B_3\) is \(2+\sqrt3,1,2-\sqrt3\), hence

\[
\sigma(H_n)=\{\sqrt{2+\sqrt3},1^{(n-2)},\sqrt{2-\sqrt3}\},
\qquad\boxed{\kappa_2(H_n)=2+\sqrt3}
\]

**for every \(n\ge3\)**, despite each action alone having predictive rank one. The joint process has rank exactly \(n\). For \(n=2\), the squared singular values are \((3\pm\sqrt5)/2\).

**Proof:** the columns from \(P^ke_1\) are \(e_{k+1}\), giving identity reachability. The observing rows are \(e_1^\top\), \(e_1^\top+e_2^\top\), \(e_1^\top+e_n^\top\), followed by a permutation of the remaining standard coordinate effects. The block matrix follows.

### Lemma — Sharp maximum-entry perturbation radius

For any invertible real square matrix \(A\),

\[
\inf_{\det(A+E)=0}\|E\|_{\max}
=\frac{1}{\|A^{-1}\|_{\infty\to1}},
\quad
\|E\|_{\max}=\max_{ij}|E_{ij}|.
\]

*Proof:* if \((A+E)x=0\), \(y=Ax=-Ex\), then
\(\|x\|_1\le\|A^{-1}\|_{\infty\to1}\|y\|_\infty
\le\|A^{-1}\|_{\infty\to1}\|E\|_{\max}\|x\|_1\).
Conversely take \(\|y\|_\infty=1\) maximizing \(\|A^{-1}y\|_1\), let \(x=A^{-1}y\), and define the rank-one perturbation \(E=-y\,\mathrm{sgn}(x)^\top/\|x\|_1\). Then \((A+E)x=0\), proving sharpness.

### Theorem B — Exact noise margin

For our deterministic witness,

\[
\boxed{d_n=\inf_{\det(H_n+E)=0}\|E\|_{\max}
=\begin{cases}
1/3,&n=2,\\
1/(n+2),&n\ge3.
\end{cases}}
\]

For \(n\ge3\), the block \(B_3^{-1}\) has induced \(\ell_\infty\to\ell_1\) norm five; adding \(I_{n-3}\) contributes \(n-3\), giving \(n+2\). The extremal signed perturbation is explicit. The margin is sharp **among unrestricted real table errors**. The extremal table need not obey physical probability constraints; the formula is still a rigorous sufficient physical measurement-noise gate.

This improves the previous 40-law manuscript's crude \(\varepsilon<1/(2n^n)\) sufficient gate to an exact \(\varepsilon<1/(n+2)\) criterion for the deterministic witness.

### Theorem C — A finite-shot, composite-null rejection theorem

Run all \(n^2\) declared binary-outcome histories, \(N\) independent times each, starting from the **same resettable preparation**. Define \(\mathcal E_n\) to mean that all \(n^2N\) outcomes match the ideal 0/1 table \(H_n\).

Let \(\mathcal N_{n-1}\) consist of **all** stationary sequential operational processes of real-linear Hankel rank at most \(n-1\), defined on the same interface. Then

\[
\boxed{\sup_{K\in\mathcal N_{n-1}}\Pr_K(\mathcal E_n)\le(1-d_n)^N.}
\]

*Proof:* each lower-rank probability table is singular, so at least one cell differs from the corresponding ideal bit by \(d_n\) or more. The probability that \(N\) independent binary results in that cell all equal the ideal bit is at most \((1-d_n)^N\). The event of a globally perfect record is a subset. The offending cell may depend on the competing model, but the same bound applies uniformly: **no \(n^2\) union penalty is necessary**.

For significance \(\delta\), choose

\[
\boxed{N\ge\left\lceil\frac{\log(1/\delta)}{-\log(1-d_n)}\right\rceil}.
\]

At \(\delta=0.01\), sufficient total binary shots are 189 (n=3), 750 (n=5), 5,300 (n=10), 39,600 (n=20), and 4,680,000 (n=100). Resource scaling \(O(n^3\log(1/\delta))\) shots, max word length \(2n-2\).

### Essential physical-interpretation correction

The certificate lower-bounds **real-linear predictive realization dimension** by \(n\); any classical stochastic hidden-state realization therefore needs \(\ge n\) states. A quantum Hilbert-space realization of dimension \(d\) has a real Hermitian operator space of dimension \(d^2\); therefore **only \(d\ge\lceil\sqrt n\rceil\)** follows. Do not confuse quantum Hilbert dimension and observable real-linear dimension.

The theorem does not infer a new neutrino sector, causally forbidden operation, novel physical particle, or cosmic asymmetry. The ideal all-bits protocol is fragile to detector noise, state drift and correlations across repeats; failures do not prove a low-dimensional model.

### Reproducibility

Local independent checks: 14 exact rational family instances (n=2..15); six exhaustive \(\infty\to1\) norm checks; 14 explicit rank-destroying perturbations at the sharp margin; 1,225 bounded random perturbations through n=50; complete finite-shot budget calculations.

**Prior art:** Fliess (1974) on Hankel realization; Berstel and Reutenauer (2010); Balle and Mohri (2012); Denis et al. (2014) on spectral learning. The synthesis is new *to this programme*. World-historical originality **has not been established**.

**Independent scientific priority and formal proof auditing remain necessary. Main branch and HCC Pages must not be changed without explicit approval.**
