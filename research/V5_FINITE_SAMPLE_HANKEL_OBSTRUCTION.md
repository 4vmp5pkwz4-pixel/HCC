# META–CAUSAL SCIENCE V: finite-sample falsification and parameter recovery

**Research manuscript, 11 October 2026.** Working theory for a declared oscillator model; all claims are conditional on stated hypotheses. Historical priority not established. This is not a Millennium Prize result.

## Exact measurable invariant from five samples

Let \(\dot q=p\), \(\dot p=-\omega^2q-\gamma p\), \(0<\gamma<2\omega\), \(E=(p^2+\omega^2q^2)/2\),
\(\Omega=(\omega^2-\gamma^2/4)^{1/2}\), and \(Q_0=p_0^2+\gamma p_0q_0+\omega^2q_0^2\).
From five calibrated samples \(e_j=E(t+jh)\) construct
\[
H_h(t)=\begin{pmatrix}e_0&e_1&e_2\\e_1&e_2&e_3\\e_2&e_3&e_4\end{pmatrix}.
\]
Then for every nonzero state,
\[
\boxed{\det H_h(t)=-\frac{\gamma^2\omega^4Q_0^3}{2\Omega^6}e^{-3\gamma(t+2h)}
\sin^4(\Omega h)\sin^2(2\Omega h).}
\]
Proof: write \(E(t)=e^{-\gamma t}[A+B\cos(2\Omega t)+C\sin(2\Omega t)]\) with
\(A=\omega^2Q_0/(2\Omega^2)>0\), \(B^2+C^2=\gamma^2A^2/(4\omega^2)\). The three complex spectral nodes of the sampled sequence are \(a,ae^{\pm i\theta}\), with \(a=e^{-\gamma h}\), \(\theta=2\Omega h\). Apply the exact Vandermonde factorization of the 3×3 Hankel determinant. Its squared Vandermonde factor is \(-64a^6\sin^4(\theta/2)\sin^2\theta\).

**Aliasing:** if \(\sin(2\Omega h)=0\), the determinant vanishes even for a nonzero oscillator. This is an experimental obstruction, not a mathematical paradox.

## Positive relaxation spectra have the opposite sign

For any positive measure \(\mu\) on real rates, \(W(t)=\int e^{-\lambda t}d\mu(\lambda)\), the five-sample Hankel satisfies
\[
H_h(W;t)=\int e^{-\lambda t}v_\lambda v_\lambda^\top d\mu(\lambda)\succeq0,
\quad v_\lambda=(1,e^{-\lambda h},e^{-2\lambda h})^\top.
\]
Thus a certified negative Hankel eigenvalue falsifies *all* positive real-exponential mixtures, not just a finite r-mode fit. A nonnegative determinant does not suffice to prove a positive mixture.

## Exactly six samples recover two dynamical parameters (given the model)

Two adjacent determinants obey \(\det H_h(t+h)=e^{-3\gamma h}\det H_h(t)\), so
\[
\gamma=-\log[\det H_h(t+h)/\det H_h(t)]/(3h).
\]
Solve \(H_h(t)(u_0,u_1,u_2)^T=(e_3,e_4,e_5)^T\). The exact sampled recurrence has
\[
u_0=a^3,\quad u_1=-a^2(1+2\cos\theta),\quad u_2=a(1+2\cos\theta).
\]
Hence \(u_1+a u_2=0\) is a falsifiable model predicate.
On the known Nyquist branch \(0<\theta<\pi\), recover
\[
a=u_0^{1/3},\quad \gamma=-\log a/h,\quad
\Omega=\arccos[(u_2/a-1)/2]/(2h),\quad \omega=(\Omega^2+\gamma^2/4)^{1/2}.
\]
The additional physical energy amplitude relation \(B^2+C^2=(\gamma^2/4\omega^2)A^2\) is required for realizability, rather than merely fitting an arbitrary three-exponential sequence.

## Unknown affine calibration: seven samples still suffice

Suppose the detector observes \(Y(t)=\alpha E(t)+\beta\), with **unknown** \(\alpha>0\) and **constant** \(\beta\). Take differences \(s_j=Y(t+jh)-Y(t+(j+1)h)\), form \(K_h(t)=[s_{i+j}]_{0\le i,j\le2}\). Then
\[
\boxed{\det K_h(t)=\alpha^3(1-a)(1+a^2-2a\cos\theta)\det H_h(t)<0.}
\]
Seven raw samples give two adjacent \(K_h\) matrices, allowing the same determinant ratio and recurrence reconstruction of \(\gamma,\omega\) without knowing \(\alpha\) or \(\beta\). This requires a nonaliasing h and the oscillator model; offset drift is not covered.

If \(s_j/a^j=A_s+B_s\cos(j\theta)+C_s\sin(j\theta)\), a gain-invariant physical constraint is
\[
(B_s^2+C_s^2)/A_s^2=(\gamma^2/4\omega^2)
(1+a^2-2a\cos\theta)/(1-a)^2,\quad A_s>0.
\]

## Exact deterministic noise gates

If all raw readings are known within absolute \(\epsilon\), then
\(\|\widetilde H_h-H_h\|_2\le3\epsilon\) and
\(\|\widetilde K_h-K_h\|_2\le6\epsilon\).
Therefore:
- \(\lambda_{\min}(\widetilde H_h)<-3\epsilon\) rules out every positive real-exponential mixture.
- \(\lambda_{\min}(\widetilde K_h)<-6\epsilon\) rules out every \(\alpha W+\beta\) with positive gain, constant offset, positive relaxation measure and nonnegative rates.

The determinant error for either Hankel window obeys
\(|\widetilde D-D|\le9\epsilon(\|\widetilde H\|_2+3\epsilon)^2\), with \(\epsilon\) replaced by \(2\epsilon\) when applied to differences. If both determinant intervals avoid zero, an explicit interval for \(\gamma\) follows by bounding the shifted determinant ratio. See the complete PDF/TeX in the research archive for proof and exact endpoints.

## Optimal first-lobe timing and recovery of the prior IV theorem

The unique maximizer of \(|\det H_h|\) on \(0<h<\pi/(2\Omega)\) satisfies
\[
4\Omega[\cot(\Omega h_*)+\cot(2\Omega h_*)]=6\gamma.
\]
This optimizes absolute determinant, **not necessarily** statistical detection power. The singular small-step limit is
\[
\lim_{h\downarrow0}\det H_h(t)/h^6
=-2\gamma^2\omega^4 Q_0^3e^{-3\gamma t},
\]
exactly the derivative-Hankel invariant of our IV paper.

## Reproducibility and priority gate

The separate Python verifier has 1,100 independent trials of the finite determinant, damping, frequency, physical amplitude, unknown gain/offset, and noise gate; 900 positive mixtures; 100 alias cases; and more than 1,000 nonempty deterministic parameter intervals. All implemented tests passed. These are not experimental results or a formal machine-checked proof.

**Prior art:** Hankel positivity, Bernstein–Widder relaxation spectra, Prony sampling, and MUSIC/subspace methods are classical or long-established. The exact model-specific formulas are proved in our mathematical programme; historical novelty is unverified.

Literature:
- [Positive Hankel Matrices, Eigenvalues and Total Positivity, Peña 2025](https://doi.org/10.3390/math13142278).
- [Total positivity and high relative accuracy for several classes of Hankel matrices, 2024](https://doi.org/10.1002/nla.2550).
- [OpenAI Mathematics research catalogue](https://github.com/openai/math) for explicitly scoped proof artifacts, **not** automatic transfer to this model.

**No claims:** universal new force; full physical causality from one statistic; nonlinear Navier–Stokes global regularity; Yang–Mills gap; a Millennium Prize solution.
