# META–CAUSAL FOUNDATIONS — extended independent research manuscript

**11 October 2026.** An extended **19-page Russian scientific working paper** plus English abstract and mathematical verification. This file records its new-to-our-programme central theorem and exact provenance; the full compiled PDF, XeLaTeX source, Russian audit and test code are available in the associated ChatGPT artifact.

**Status:** analytical theorems under explicit finite-dimensional hypotheses; no independently established historical priority, no empirical evidence of a new fundamental interaction, and no Millennium Prize claim. This branch is separate from the original HCC publication and must not be merged without explicit permission.

## Foundational proposal

Define a physical experimental signature as allowed preparations, operations and effects with their conditional probabilities, typed causal compositions and legitimate descriptive gauge transformations. Two preparations count as **operationally equivalent** relative to a declared experiment set if all available experiments assign the same outcome probabilities. Such quotient spaces need not be manifolds or Hilbert spaces.

An experimental history series \(f(w)\) leads to the operational matrix \(\mathcal H_{u,v}=f(uv)\). Its rank is the **minimal real linear prediction dimension**, but not necessarily the dimension of a *positive classical* or *completely-positive quantum* realization. This distinction is nonnegotiable.

## Central theorem — arbitrary-dimensional intervention synergy

For every integer \(n\ge2\) and any fixed \(0<a<1\), let \(P_n,Q_n\) be column-stochastic matrices on the probability simplex on basis \(e_1,\ldots,e_n\):

- \(P_ne_1=ae_1+(1-a)e_2\); on hidden labels \(e_2,\ldots,e_n\), \(P_n\) cycles \(2\to3\to\cdots\to n\to2\);
- \(Q_ne_1=e_1,\quad Q_ne_2=e_1,\quad Q_ne_j=e_j\) for \(j\ge3\);
- prepare \(\beta=e_1\) and measure \(\alpha=e_1^\top\).

For execution in left-to-right word order, \(f(w)=\alpha M_w\beta\) with \(M_{uv}=M_vM_u\).

Then \(f(P^k)=a^k\) and \(f(Q^k)=1\); therefore the predictive Hankel rank of **each operation alone equals 1**.

When both operations are permitted, take prefixes \(\{P^0,\ldots,P^{n-1}\}\) and suffixes \(\{\emptyset,Q,PQ,\ldots,P^{n-2}Q\}\). The associated \(n\times n\) submatrix is \(H_n=OV\), where
\[
V=[e_1,P_ne_1,\ldots,P_n^{n-1}e_1],\quad
O=[\alpha;\alpha Q_n;\alpha Q_nP_n;\ldots;\alpha Q_nP_n^{n-2}].
\]
Its determinant satisfies
\[
\boxed{|\det H_n|=(1-a)^{n-1}>0}.
\]

**Proof:** \((P_n-aI)P_n^ke_1=(1-a)P_n^ke_2\) for \(k=0,\ldots,n-2\), so \(\det V=(1-a)^{n-1}\). The hidden restrictions of the rows \(\alpha Q_nP_n^k\) are cyclic coordinate projections, so \(|\det O|=1\). Hence the joint predictive dimension is \(n\) and the *increment \(n-1\) is unbounded in n*, despite zero individual increments.

**Consequences:**
1. Predictive rank as a set function of available operations is generally **not submodular**: even for \(n=2\), separately adding \(P\) or \(Q\) yields rank 1, but adding both yields 2.
2. Greedy scientific instrument selection based only on the individual gain of each experiment can miss an arbitrarily large joint effect.
3. For the two-state partial-reset case with \(P=\begin{psmallmatrix}a&0\\1-a&1\end{psmallmatrix}\) and \(Q=\begin{psmallmatrix}1&b\\0&1-b\end{psmallmatrix}\), the 2×2 witness has \(\det K=b(1-a)\) and equals the **order-sensitive observable commutator** \(f(PQ)-f(QP)=\alpha(QP-PQ)\beta\). This is **classical** order sensitivity, **not** a witness of quantum indefinite causal order.

Analytical proof is included; 12 exact-rational symbolic examples check \(n=2,\ldots,13\) at \(a=2/3\). Symbolic or numerical examples do not substitute for the general proof.

## Other source-specific gates

- The four tetrahedral qubit preparation/effect overlaps form \(K=\tfrac23 I+\tfrac13\mathbf1\mathbf1^\top\) with \(\det K=16/27\) and operational rank 4. This is a dimension witness against any 2-hidden-state classical linear realization of that specific *full* table, **not** an exclusive quantum-realism or Bell witness.
- Nonlinear causal closure requires projecting vector fields consistently across a coarse map, not merely fitting the energy time series.
- In a leading two-heavy-neutrino type-I seesaw with \(m_1=0\), the CP-even quantities \(a=v^2h_{11}/M_1\), \(b=v^2h_{22}/M_2\) constrain \(J_N=\operatorname{Im}(h_{12}^2)\) via
  \[
  J_N^2=(M_1M_2/2v^4)^2\{(m_3-m_2)^2-(a-b)^2\}\{(a+b)^2-(m_2+m_3)^2\}.
  \]
  The chosen CP-even observation algebra does **not** fix the sign. No observed cosmic baryon asymmetry is deduced.
- A noncommutative process or indefinite quantum causal order cannot simply be assumed to fit an ordinary total-time word model; use typed quantum instruments or general process-matrix frameworks with their own positivity and composition conditions.
- The public OpenAI Mathematics catalogue is a **research source with explicit verification boundaries**, not an oracle certifying general physical laws. Compare families 095, 144, 229, 269, 350, 365, 374, 376 only under matched hypotheses.

## Reproducibility and status

The separate extended research archive provides the XeLaTeX manuscript, PDF, two exact SymPy scripts, JSON verification log, Russian audit and scientific claims registry. Each executable theorem test is labelled with scope and does not imply empirical priority.

## Primary sources

- [OpenAI Mathematics](https://github.com/openai/math) and [retraction history](https://github.com/openai/math/blob/main/history.md).
- [Rubenstein et al., causal consistency across scales (2017)](https://proceedings.mlr.press/r15/rubenstein-17a.html).
- [Chiribella et al., quantum networks (2009)](https://doi.org/10.1103/PhysRevA.80.022339).
- [Oreshkov, Costa and Brukner, no predefined causal order (2012)](https://doi.org/10.1038/ncomms2076).
- [Costa et al., review of indefinite quantum causality (2026)](https://arxiv.org/abs/2606.19438).
- [Particle Data Group neutrino review (2026)](https://pdg.lbl.gov/2026/reviews/standard_model_and_related.html).

**No merge or alteration of HCC main/Pages was performed.**
