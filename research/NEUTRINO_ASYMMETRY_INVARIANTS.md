# NEUTRINO ASYMMETRY INVARIANTS — research gate (11 October 2026)

**Status:** established Lorentz/field theory + independently checked algebraic seesaw identity; **not** a discovery of matter–antimatter asymmetry's origin. Author priority is not claimed. Observational confirmation of high-scale leptogenesis is absent.

## I. Overtaking massive neutrino does not change species

Let the observed mass eigenstate have timelike 4-momentum \(p^\mu\), \(p^2=m^2c^2>0\). For a proper collinear boost exceeding particle speed, spatial momentum changes sign. Its longitudinal spin remains oriented as before; helicity \(\mathfrak h=\mathbf S\cdot\mathbf p/(|\mathbf S||\mathbf p|)\) reverses: \(-\to+\). At rest helicity is undefined. **Neither the invariant mass nor the field's particle/antiparticle identity changes merely because an observer overtakes it**.

Under proper orthochronous Lorentz transformations of spinors, \(S(\Lambda)^{-1}\gamma^5S(\Lambda)=\gamma^5\); hence \(P_{L,R}=(1\mp\gamma^5)/2\) retain their chiral identities. With massive fermions, do **not** conflate chirality with helicity: massive positive-energy spinors need not be chirality eigenstates. Weak charged-current terms select the left-chiral neutrino component.

In a Dirac model, neutrino and antineutrino are distinct and differ by the conserved \(U(1)_L\) label when imposed; a right-helicity Dirac neutrino remains a neutrino and may be weakly coupled rather than exactly sterile at finite mass. For a Majorana model the field is self-conjugate from the outset; a boost does not *cause* that property. Whether nature realizes Dirac or Majorana masses is unresolved.

## II. Operational asymmetry is a symmetry-odd observable, not a frame effect

Define a decay-rate CP asymmetry of a heavy neutrino in its rest frame:
\[
\varepsilon_i=\frac{\Gamma(N_i\to\ell H)-\Gamma(N_i\to\bar\ell H^\dagger)}{\Gamma(N_i\to\ell H)+\Gamma(N_i\to\bar\ell H^\dagger)}.
\]
Its physical content is invariant under a change of inertial observer. A helicity flip induced by a Lorentz boost is **not** dynamical CP violation. CP breaking does not imply Lorentz breaking or a failure of CPT. Sakharov conditions, or their appropriate out-of-equilibrium generalizations, must be checked before inferring baryon generation. The particle asymmetry of the Universe is not derived by relabeling a state after a boost.

## III. Exact two-heavy-neutrino algebraic underdetermination in a minimal seesaw

Take a normal-ordering two-heavy-neutrino type-I seesaw, with complex Casas–Ibarra angle \(z=x+i y\), orthogonal rectangular matrix
\[
R=\begin{pmatrix}0&0\\ \cos z&\sin z\\-\sin z&\cos z\end{pmatrix},\quad R^TR=I_2.
\]
Put \(Y=(i/v)\,U\operatorname{diag}(0,\sqrt{m_2},\sqrt{m_3})R\,\operatorname{diag}(\sqrt{M_1},\sqrt{M_2})\).
Then \(m_\nu=-v^2YM^{-1}Y^T=U\,\operatorname{diag}(0,m_2,m_3)\,U^T\) is **independent of z**. The Hermitian heavy-sector coupling \(h=Y^\dagger Y\) satisfies
\[
h_{12}=\frac{\sqrt{M_1M_2}}{2v^2}\big[(m_2-m_3)\sin(2x)+i(m_2+m_3)\sinh(2y)\big],
\]
hence the CP-odd rephasing-invariant in the real diagonal Majorana-mass basis is
\[
J_N=\operatorname{Im}(h_{12}^2)
=\frac{M_1M_2(m_2^2-m_3^2)}{2v^4}\sin(2x)\sinh(2y).
\]
Under \(x\mapsto -x\) with fixed nonzero \(y\), all low-energy masses/mixing and the CP-even \(h_{11},h_{22},|h_{12}|^2\) are unchanged, while \(J_N\mapsto -J_N\). This proves that those observables **alone** do not determine this heavy-sector CP-odd source. The precise final baryon asymmetry can depend on flavors, washout, initial populations, and cosmological dynamics; its sign is **not universally equal** to the sign of \(J_N\).

Checks: \`check_neutrino_seesaw.py\` passes SymPy identities for \(R^TR=I\), the exact expression for \(h_{12}\), invariance of CP-even quantities and reversal of \(J_N\).

## IV. Research predicates

- **Verified Lorentz-invariant mass:** \(p_\mu p^\mu=m^2c^2>0\) for massive neutrino eigenstates.
- **Frame-dependent helicity:** reversible by an admissible boost along the momentum, undefined at rest.
- **Chiral weak coupling:** the left-chiral field projector remains the one entering Standard Model charged currents.
- **Unknown particle nature:** Dirac/Majorana alternatives require new data (e.g., \(0\nu\beta\beta\) under model assumptions).
- **Independent CP-odd invariant:** \(J_N\) as above is an explicit seesaw example, not proof of the cosmic baryon asymmetry.
- **Unproven:** any historical first-priority claim, universal origin of the baryon asymmetry, or proof that measured low-energy CP violation uniquely fixes high-scale leptogenesis.

## Evidence and primary literature

- Fermilab, ["Are all neutrinos left-handed?"](https://neutrinos.fnal.gov/mysteries/handedness/)
- Jentschura and Wundt, ["Neutrino Helicity Reversal and Fundamental Symmetries"](https://arxiv.org/abs/1206.6342).
- *Physics Today*, ["The neutrino's elusive helicity reversal"](https://physicstoday.aip.org/features/the-neutrinos-elusive-helicity-reversal).
- *Physical Review D* 67, 073025 (2003), ["Minimal scenarios for leptogenesis and CP violation"](https://doi.org/10.1103/PhysRevD.67.073025).
- *Physical Review Letters* 136, 022701 (2026), ["LEGEND-200 first results"](https://doi.org/10.1103/25tk-nctn): no observed neutrinoless double-beta signal, so no experimental determination of Dirac vs Majorana from this search.
- Particle Data Group, [2026 reviews](https://pdg.lbl.gov/2026/reviews/standard_model_and_related.html).

**Connection to META–CAUSAL SCIENCE:** Lorentz-frame labels must be quotiented out as descriptions; CP-odd interaction invariants must not. Two high-energy theories can match the currently available CP-even and low-energy neutrino data while differing on a CP-odd source. This constitutes a rigorously bounded, falsifiable identifiability obstruction, not a uniquely identified cosmic history.
