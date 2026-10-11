# META–CAUSAL SCIENCE VII — Neutrino CP-odd causal discriminant

*11 October 2026 — AI-assisted mathematical working paper. Historical novelty unestablished. No baryogenesis mechanism has been experimentally confirmed.*

## Exact framework

Take the leading tree-level type-I seesaw with two nondegenerate heavy Majorana masses \(M_1<M_2\), normal light hierarchy \(m_1=0<m_2<m_3\), and

\[
Y=\frac{i}{v}U^\ast \sqrt{\operatorname{diag}(0,m_2,m_3)}R(z)\sqrt{\operatorname{diag}(M_1,M_2)},
\quad
R(z)=\begin{pmatrix}0&0\\\cos z&-\sin z\\\sin z&\cos z\end{pmatrix},
\quad z=x+iy.
\]
Then \(R^TR=I_2\) and \(-v^2YM^{-1}Y^T=U^*\operatorname{diag}(0,m_2,m_3)U^\dagger\). Define the heavy Gram matrix \(h=Y^\dagger Y\).

## Theorem A — exact CP-even realization domain and CP-odd discriminant

Let \(a=v^2 h_{11}/M_1\), \(b=v^2 h_{22}/M_2\), \(A=a+b\), \(B=a-b\), \(\Sigma=m_2+m_3\), \(\Delta=m_3-m_2>0\). The CP-even pair \((a,b)\) can be realized with some \(z\in\mathbb C\) **if and only if**
\[
\boxed{A\ge\Sigma,\quad |B|\le\Delta.}
\]
Moreover, with \(J=\mathrm{Im}(h_{12}^2)\),
\[
\boxed{J^2=\frac{M_1^2M_2^2}{4v^8}(\Delta^2-B^2)(A^2-\Sigma^2), \qquad
\det(h)=\frac{M_1M_2m_2m_3}{v^4}.}
\]
**Proof.** The complex trigonometric identities yield \(A=\Sigma\cosh 2y\), \(B=-\Delta\cos 2x\), and
\(h_{12}=\sqrt{M_1M_2}\,[\Delta\sin 2x-i\Sigma\sinh 2y]/(2v^2)\).
Eliminating \(x,y\) proves the squared CP-source identity and shows the indicated inequalities are both necessary and sufficient. The determinant is the squared determinant of the complex-orthogonal massive-row block of \(R\), times \(M_1M_2m_2m_3/v^4\).

## Theorem B — physical weak-basis-invariant orientation

For general complex symmetric heavy Majorana mass matrix \(M\), let \(H_M=M^\dagger M\). Define
\[
I_{\rm WB}=\mathrm{Im}\,\mathrm{Tr}[h H_M M^* h^* M].
\]
It is invariant under heavy weak-basis changes \(Y\mapsto YW\), \(M\mapsto W^TMW\) for unitary \(W\). In positive diagonal mass basis,
\[
\boxed{I_{\rm WB}=M_1M_2(M_2^2-M_1^2)\,J.}
\]
The sign difference is not a mere Majorana ±1 rephasing effect. Heavy mass degeneracy invalidates inference from this particular trace invariant.

## Theorem C — CP-even no-go on the selected observation algebra

In the strict interior \(A>\Sigma, |B|<\Delta\), the map \(x\mapsto-x\) preserves \(m_2,m_3,U,M_1,M_2,h_{11},h_{22},|h_{12}|\), but reverses \(J\). Thus **exactly two values** \(J=\pm\sqrt{\mathcal D}\) are possible (there may be more than two underlying Yukawa matrices). Any statistical channel whose conditional law depends **only on this stated observation set** cannot distinguish the two equal-prior branches better than 50% sign error at any sample size. This no-go does not apply to arbitrary flavour-resolved measurements.

## Theorem D — optimal regularity of CP-source magnitude

On compact subsets of \(A\ge\Sigma,|B|\le\Delta\), the map \((A,B)\mapsto |J|\) has a uniform 1/2-Hölder estimate. At \(B=0, A=\Sigma+\epsilon\), \(|J|\asymp \sqrt\epsilon\), so the exponent cannot be improved to any value greater than 1/2 at that boundary. **J=0 is only vanishing of the particular unflavoured CP source, not necessarily conservation of CP for the full theory.**

## Recursive proof-audit outcomes

1. The conjecture that low-energy neutrino data determine heavy CP-source orientation is **refuted** by an explicit involution.
2. Its strict quantitative replacement (CP-even data determine \(J^2\)) is **proved**.
3. Physical weak-basis changes are **checked independently** to eliminate coordinate artifacts.
4. A global Lipschitz claim is **rejected**; 1/2-Hölder is sharp near \(J=0\).
5. The sign of the **observed baryon asymmetry remains open**: flavoured kinetic evolution, washout, initial conditions and other mechanisms are not calculated.

This is classical type-I seesaw/Casas–Ibarra algebra developed as a new-to-this-programme causal-identifiability statement. It is **not claimed to be historically world-first**.

## Independent verification

Standalone proof code and full 7-page LaTeX/PDF research artifact generated in the associated scientific work. Recorded local checks: **12 exact SymPy identities, 2,400 randomly sampled models, 400 unitary heavy-basis transformations**, all passed.

Prior work: Casas–Ibarra (2001); Davidson–Ibarra (2002); Xing (2010); Dutta arXiv:2609.20033 (2026); OpenAI Mathematics catalogue (different mathematical claims; no direct proof of leptogenesis).

**No merge without explicit user approval.** This branch does not alter HCC main or publish Pages.