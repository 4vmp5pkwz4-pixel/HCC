# META–CAUSAL SCIENCE VI — Three Energy Readings Expose Nonnormal Dynamics

**Research working paper • 11 October 2026**  
**Scientific status:** mathematical theorem under stated hypotheses, independently unreviewed, world priority unestablished. This research branch does not modify HCC main or Pages.

## General theorem: metric-aware normality

Fix \(B\in\mathbb R^{n\times n}\), \(n<\infty\), and a known positive-definite physical energy metric \(M\). Work in whitened coordinates \(A=M^{1/2}BM^{-1/2}\) and put \(f_x(t)=\|e^{At}x\|_2^2\).

The following are equivalent:

1. \(A\) is normal: \(AA^\top=A^\top A\).
2. Every nonzero \(f_x\) is log-convex for \(t\ge0\).
3. For **all** states \(x\) and **all** \(h>0\),
   \[
   \boxed{\Delta_h(x)=f_x(0)f_x(2h)-f_x(h)^2\ge0.}
   \]

**Constructive converse.** Let \(S=(A+A^\top)/2\), \(K=(A-A^\top)/2\). If \([S,K]\ne0\), form the graph of \(S\)-eigenspaces connected by nonzero cross-eigenspace blocks of \(K\). Take the maximal eigenvalue in any connected component with an edge, and choose a unit \(x\) from its eigenspace with nonzero lower-mode coupling. Then \(Sx=sx\), \(\Lambda=\langle Kx,(sI-S)Kx\rangle>0\), and

\[
\boxed{\lim_{h\to0^+}\frac{\Delta_h(x)}{h^3}=-4\Lambda=-2\langle x,[K,[S,K]]x\rangle<0.}
\]

The proof differentiates \(f_x\) through third order:
\(f(0)=1,f'(0)=2s,f''(0)=4s^2,f'''(0)=8s^3-4\Lambda\).
The constant, linear and quadratic coefficients of the determinant cancel, leaving \(-4\Lambda h^3\).
Conversely, if \([S,K]=0\), \(f_x(t)=\sum_j a_j e^{2s_j t}\) with \(a_j\ge0\), so the log-convexity and Hankel positivity follow from Cauchy–Schwarz.

**Explicit step guarantee.** With \(\beta=\|A\|_2>0\),
\[
0<h\le \min\{1/(4\beta),3\Lambda/(32e\beta^4)\}
\Longrightarrow
\Delta_h(x)\le-2\Lambda h^3.
\]
This follows from \(|f_x^{(r)}(t)|\le(2\beta)^r e^{2\beta t}\) and \(|D^{(4)}(h)|\le512\beta^4e^{4\beta h}\).

## Monotone decay does not imply normality

With \(\lambda>0\) and \(0<\kappa<2\lambda\), set
\(A=\bigl[\begin{smallmatrix}-\lambda&\kappa\\0&-\lambda\end{smallmatrix}\bigr]\),
\(x_0=(1,1)/\sqrt2\).
The symmetric part is negative definite; every nonzero state has **strictly decreasing energy** and the only spectral eigenvalue is \(-\lambda\). Nevertheless,

\[
\boxed{\Delta_h(x_0)=-\tfrac14(\kappa h)^3(\kappa h+4)e^{-4\lambda h}<0}
\]
for all \(h>0\). Therefore a negative Hankel determinant rules out *normal positive-exponential energy dynamics*, **not** necessarily a non-real/oscillatory spectrum. This corrects an overbroad possible reading of the preceding V5 result.

## Noise gate

For measured \(\tilde f_0,\tilde f_1,\tilde f_2\), with rigorously justified absolute error at most \(\varepsilon\) each, put
\(\tilde H=\bigl[\begin{smallmatrix}\tilde f_0&\tilde f_1\\\tilde f_1&\tilde f_2\end{smallmatrix}\bigr]\).
If \(\lambda_{\min}(\tilde H)<-2\varepsilon\), **every normal autonomous linear model in the known metric is falsified**. Equivalently, a sufficient determinant-only rejection is
\[
\tilde f_0\tilde f_2-\tilde f_1^2<
-\varepsilon(|\tilde f_0|+|\tilde f_2|+2|\tilde f_1|)-2\varepsilon^2.
\]

A positive observation for a *single state* cannot establish normality. Incorrect model class, time-varying parameters, uncalibrated energy, unknown additive offset or underestimated noise invalidate the physical inference.

## Metric is essential

\(B=[[-1,1],[0,-2]]\) is nonnormal in Euclidean energy yet self-adjoint in the metric \(M=[[1,1],[1,2]]>0\), as \(MB=B^\top M\). Normality without a declared physical energy metric is not a coordinate-independent observational statement.

## A provable blind spot from the OpenAI Math catalogue

Every measure-preserving map has a unitary Koopman operator, and therefore \(\|U^jg\|^2\) is constant in \(j\): all energy Hankel determinants vanish. Family **144** in the [OpenAI Mathematics repository](https://github.com/openai/math/blob/main/lean/docs/144.md) describes a smooth torus transformation with simple Lebesgue Koopman spectrum, yet this norm-only diagnostic sees no complexity. This precludes any assertion that our witness is a universal chaos or causal-inference detector.

Families [376](https://github.com/openai/math/blob/main/lean/docs/376.md) (engineered forced Navier–Stokes computation), [365](https://github.com/openai/math/blob/main/lean/docs/365.md) (inverse conductivity nonuniqueness), [374](https://github.com/openai/math/blob/main/lean/docs/374.md) (sharp stability for certain transport maps), and [269](https://github.com/openai/math/blob/main/lean/docs/269.md) (a specific Laughlin gap) are relevant methodological counterpoints, **not transferable solutions** to the present result or Millennium problems.

## Prior art, actual novelty gate

- Jon E. Johnsen, [Characterisation of Log-Convex Decay in Non-Selfadjoint Dynamics](https://doi.org/10.3934/era.2018.25.008), 2018; already studies log-convexity of dynamical norm histories.
- Trefethen et al., [Hydrodynamic Stability Without Eigenvalues](https://doi.org/10.1126/science.261.5121.578), 1993; nonnormality and nonmodal hydrodynamics.
- Reddy–Henningson, [Energy Growth in Viscous Channel Flows](https://doi.org/10.1017/S0022112093003738), 1993.
- [OpenAI Mathematics](https://github.com/openai/math) (2026), with its per-family formalization boundaries and errata/withdrawals.

**The three-point, double-commutator, constructive small-step and metric-aware noise synthesis is derived in this research programme. Its world-historical originality has not been established.** No claim is made to solve full Navier–Stokes regularity or any Millennium Prize problem.

The complete 6-page PDF, editable LaTeX, Python verifier, figures and Russian audit are in the companion downloadable scientific artifact.
