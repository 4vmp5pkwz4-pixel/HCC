# OpenAI Math → META–CAUSAL: six cross-problem bridges and an exact spectral no-go theorem

**11 October 2026 | Independent Russian research paper: 11-page PDF and XeLaTeX, with executable SymPy certificates in the companion archive.**  
**Status:** mathematically checked programme; global scientific priority not established; **not** a solution of Yang–Mills, Hodge, unforced 3D Navier–Stokes, quantum gravity or baryogenesis.

## Source audit

[openai/math](https://github.com/openai/math) README, [overview](https://github.com/openai/math/blob/main/overview.tex), scoped [Lean docs](https://github.com/openai/math/tree/main/lean/docs) and [history](https://github.com/openai/math/blob/main/history.md) were inspected: **372 result families, 719 manuscripts, 300/719 selected main results formalized (~42%)** as recorded Oct 7, 2026. Three related Hodge manuscripts were withdrawn due to a sign error and 14 others received proof repairs. A catalogue abstract and a selected Lean theorem **must not be treated as the same mathematical statement**.

### Twenty-seven highest-leverage families, with proof transfer boundaries

| Cluster | Families | Inference that is *not* licensed without a new theorem |
|---|---|---|
| Quantum gaps, entropy, operator physics | **265, 268, 269, 267, 273, 280, 288, 289, 325, 095** | A special lattice gap or a functional-calculus bound does not construct continuum 4D Yang–Mills |
| Geometry and gravitation | **211, 260, 336, 348, 350, 356** | A Riemannian metric estimate or random planar map limit does not imply Lorentzian gravitational dynamics |
| Dynamics, fluids, computation | **144, 146, 227, 362, 363, 376, 206** | Forced flow computation is not an unforced-NS proof; conserved mass/energy need not ensure uniqueness |
| Inverse, reconstruction, regularity | **365, 372, 374, 229** | Uniqueness for smooth moduli does not imply uniqueness for rough coefficients or numerical stability |

**Especially important Lean-vs-manuscript mismatches, verified from source:**
- [260](https://github.com/openai/math/blob/main/lean/docs/260.md): Lean covers hyperboloidal-end replacement and conditional special steps, not the whole claimed general Penrose inequality.
- [267](https://github.com/openai/math/blob/main/lean/docs/267.md): Lean selected result concerns ground-state hard-sphere condensation, not the catalogue's positive-temperature extension.
- [269](https://github.com/openai/math/blob/main/lean/docs/269.md): selected Lean bounds concern a particular Laughlin \(V_1\) Hamiltonian; entire disorder story is broader.
- [280](https://github.com/openai/math/blob/main/lean/docs/280.md): formalized stage is locality and conformal net construction, not all claimed tensor category consequences.
- [363](https://github.com/openai/math/blob/main/lean/docs/363.md): Lean confirms a renormalized Boltzmann nonuniqueness construction; later strengthened exact local conservation is outside selected formalization.
- [365](https://github.com/openai/math/blob/main/lean/docs/365.md): Lean selected result is rough scalar conductivity nonuniqueness; not the separately described smooth metric/connection recovery.
- [376](https://github.com/openai/math/blob/main/lean/docs/376.md): Lean selected result proves specific sheet programs of **forced** Navier–Stokes; particle halting detector and unforced global smoothness are outside the selected statement.
- [348](https://github.com/openai/math/blob/main/lean/docs/348.md): Lean selected Einstein classification assumes strictly positive sectional curvature; the catalogue describes a broader nonnegative case.
- [229](https://github.com/openai/math/blob/main/lean/docs/229.md): selected proof covers *supercritical* three-state reconstruction, not the whole claimed if-and-only-if threshold.
- [095](https://github.com/openai/math/blob/main/lean/docs/095.md): counterexample to a finite semidefinite lifting principle demonstrates a limit of universal SDP-only approaches.
- [350](https://github.com/openai/math/blob/main/lean/docs/350.md): near-round \(S^3\) is not a sufficient blanket hypothesis for the suggested nodal bound.

## A precise new-to-our-programme mathematical barrier

Let \(C_\mu(t)=\int_0^\infty e^{-\lambda t}\,d\mu(\lambda)\), with a finite positive probability measure \(\mu\). Define its **observable** support gap \(\Delta(\mu)=\inf\operatorname{supp}\mu\).

**Theorem (arbitrarily many exact finite samples do not identify the gap).** For any \(m\ge1\), sampling interval \(h>0\), and any \(0\le\eta<\log 2/h\), there exist two finite positive probability measures \(\mu_+,\mu_\eta\) such that:
\[
C_{\mu_+}(jh)=C_{\mu_\eta}(jh)\ (j=0,\ldots,m),\quad
\Delta(\mu_+)\ge\log2/h,\quad\Delta(\mu_\eta)=\eta.
\]
One may require all atomic weights to be strictly positive.

**Proof.** Take \(r=m+1\), \(q_i=1/(i+2)\) for \(i=0,\ldots,m\), \(V_{ji}=q_i^j\), \(w_i=1/r\). The Vandermonde \(V\) is invertible. Set \(q_*=e^{-\eta h}>1/2\) and \(v_*=(q_*^j)_{j=0}^m\); put \(b=V^{-1}v_*\). For sufficiently small \(\epsilon>0\), every \(\tilde w_i=w_i-\epsilon b_i>0\). Thus \(V\tilde w+\epsilon v_*=Vw\), matching *all measured data exactly*. The base rates \(-\log q_i/h\) lie above \(\log2/h\), while the extra atom has rate \(\eta\). The \(j=0\) identity preserves total mass one. QED.

**Concrete exact rational pair with two samples \(t=0,1\):**
\[
C_+(t)=\frac12(1/2)^t+\frac12(1/3)^t,\qquad
C_0(t)=\frac14(1/2)^t+\frac{11}{16}(1/3)^t+\frac1{16}.
\]
Both give \(C(0)=1,C(1)=5/12\) but one has gap \(\log 2\) and the other gap zero.

**Constructive converse with a complexity prior.** If it is known *a priori* that there are exactly \(r\) distinct positive exponential nodes with positive weights, **\(2r\) exact samples uniquely reconstruct all nodes and weights** via positive Hankel/Prony inversion. The two theorems do not conflict: the bound on the number of modes is the missing input in the no-go case.

**Verification:** nine exact SymPy rational constructions for 2--10 samples and one additional almost-zero, positive-gap witness, all weights positive, all sampled moments exactly matching. Independent historical priority *not* asserted; this is a constructive instance of the [truncated moment problem](https://doi.org/10.1016/j.jmaa.2022.126066). Its empirical relevance is consistent with [Euclidean spectral inverse ill-conditioning](https://arxiv.org/abs/2605.15674).

## Six high-priority cross-problem programmes

| Priority | Bridges | Exact missing proof obligation |
|---|---|---|
| P0 | **265+268+269+325** → full spectral gap QFT | uniform infinite-volume + continuum operator lower bound, vacuum, positivity, physical limit |
| P0 | **365+372+374** → nonlinear inverse problem | regularity-class-specific uniqueness, gauge quotient and *sharp* stability with counterexamples |
| P0 | **362+363+376** → evolution selection | admissible uniqueness stable under approximation; do not confuse forced with unforced or collisionless with collisional models |
| P1 | **211+260+336+348+350+356** → emergent spacetime | rigorous transfer from metric/curvature to Lorentz causal structure, energy conditions and data |
| P1 | **095+273+280+288+325** → quantum operational positivity | complete positivity and physically realizable state/instrument maps; no universal exact finite-SDP assumption |
| P0 | **Neutrino CP VII (our programme)** → baryon asymmetry | no direct leptogenesis family identified in overview; need CP-odd experimental channel and full flavoured kinetic evolution |

### What is *not* solved

The claim that current Euclidean lattice data **alone** establish any uniform continuum mass gap is refuted by the theorem under unbounded spectral complexity. The theorem does **not** rule out proving a gap using stronger operator-theoretic, regularity, positivity or continuum assumptions. The Clay Institute still lists Yang--Mills & mass gap [unsolved](https://www.claymath.org/millennium/yang-mills-the-maths-gap/) and has described the September 2026 Navier--Stokes announcement as **under evaluation**, not a cross-domain theorem automatically transferable here.

### Immediate next decisive task

Find one **uniform, regulator-independent lower spectral bound** for an explicit physical Hamiltonian on the required continuum sector and certify its transfer through the physical limit. Alternative: prove a sharp obstruction that no such bound holds for the hypothesized class. The readout must include assumptions, dimensionality, positivity, symmetry and an independent error budget.

**Research provenance:** META–CAUSAL FOUNDATIONS V1–VIII; OpenAI mathematics sources; truncated moment literature. This is **not** the final answer to a Millennium Prize or to the origin of baryon asymmetry. No HCC main merge or Pages switch is authorized.
