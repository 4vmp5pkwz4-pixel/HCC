# V5 research gate: commuting Hopf–Beltrami eigenfields beyond spectral resonance

**Date:** 2026-10-10. **Status:** mathematical working result in the Batenin–Preece research programme; priority and external review pending. **Canonical software:** HCC. **No changes to \`index.html\` or cosmological claims.**

## Signed-curl/Leray criterion

Let \(u,v\) be real divergence-free signed curl eigenfields on closed oriented \(M^3\), with \(\mathrm{curl}\,u=\lambda u\), \(\mathrm{curl}\,v=\kappa v\), and \(H^1_{\mathrm{dR}}(M)=0\). The standard Riemannian cross-product identity gives
\[
\nabla_uv+\nabla_vu=\nabla\langle u,v\rangle+(\lambda-\kappa)u\times v,\qquad
\mathrm{curl}(u\times v)=-[u,v].
\]
For \(\lambda\ne\kappa\), the Leray-projected mixed convection vanishes **iff** \([u,v]=0\). For \(\lambda=\kappa\), it vanishes regardless of the bracket. The forward implication for unequal eigenvalues is local; the converse uses \(H^1=0\) so that a curl-free cross-product is a gradient.

**Do not confuse zero interaction with zero spectral variance.** The projector erases gradient terms, not spectrally distinct eigenfields.

## Explicit Hopf symmetry on exact round \(S^3_R\)

In real quaternion coordinates \(q=(a,b,c,d)\), \(z_1=a+ib,\ z_2=c+id\), take the fixed-Hopf frame \(X_2,X_3\) of the Null Beltrami preprint and \(Z=X_2+iX_3\). For the two global Killing fields \(K_\pm=\partial_\phi\pm\partial_\psi\):
\[
[K_+,Z]=2iZ,\quad [K_-,Z]=0,\quad
\mathrm{curl}K_\pm=\pm 2K_\pm/R.
\]
For a nonzero degree-\(m\) homogeneous polynomial \(p\), \([K_-,\operatorname{Re}(pZ)]=0\) holds precisely if \(m=2k\) and \(p=c(z_1z_2)^k\). This follows termwise because \(K_-\) weights the monomial \(z_1^{m-j}z_2^j\) by \(i(m-2j)\).

Set \(w_k=\operatorname{Re}\bigl(c(z_1z_2)^k Z\bigr)\) with the radius-\(R\) orthonormal frame and \(k\ge1\). Then
\[
[K_-,w_k]=0,\quad \mathrm{curl} w_k=(2k+2)w_k/R,\quad
\mathrm{curl} K_-=-2K_-/R.
\]
**The eigenvalues are different** but the fields commute.

## Exact force-free two-rate flow and explicit pressure

Let \(\nu>0\), \(a_t=a e^{-4\nu t/R^2}\), \(b_t=b e^{-(2k+2)^2\nu t/R^2}\). Then
\[
U_k(t)=a_t K_-+b_t w_k
\]
solves the **unforced** incompressible Navier–Stokes equation with positive Hodge viscosity on the fixed round sphere. Importantly, no inverse Laplacian is needed for pressure, because
\[
K_-\times_{g_R}w_k=\frac{R^2}{k+1}\nabla_{g_R}\operatorname{Im}[c(z_1z_2)^{k+1}].
\]
A globally smooth explicit pressure is
\[
P_k=-\frac12|U_k|_{g_R}^2+
 \frac{(2k+4)R}{k+1}a_t b_t\operatorname{Im}[c(z_1z_2)^{k+1}].
\]
This follows from the base identities \(K_-\times X_2=R^2\nabla\operatorname{Im}(z_1z_2)\) and \(K_-\times X_3=-R^2\nabla\operatorname{Re}(z_1z_2)\), followed by the chain rule. For the Ebin–Marsden convention, the Killing mode is time-independent while \(w_k\) damps at \(\nu[(2k+2)^2-4]/R^2\); the same pressure structure applies with those amplitudes.

Write \(A=a_t^2\|K_-\|^2\), \(B=b_t^2\|w_k\|^2\), with
\[
\|K_-\|^2=2\pi^2R^5,\qquad
\|w_k\|^2=2\pi^2R^3|c|^2\frac{(k!)^2}{(2k+1)!}.
\]
For \(A,B>0\), the exact spectral helicity deficit is
\[
\mathcal V(U_k)=\frac{AB}{A+B}\frac{(2k+4)^2}{R^2}>0,
\qquad
\mathbb P(\nabla_{U_k}U_k)=0.
\]
Thus **positive helicity variance does not imply nonzero nonlinear force**. Any HCC interface or agent must preserve that refusal.

## Verification and limits

Companion V5 manuscript (18-page LaTeX/PDF) and runnable \`verify_commuting_hopf.py\` are retained in the research conversation artifact. The independent SymPy verifier checks the exact outward-orientation curls, \(K_-\) and \(K_+\) weights, all monomial weights through degree five, the non-toroidal witness, Beta norms, positive spectral deficits, and full unit-sphere nonlinear acceleration plus explicit pressure modulo \(|q|^2-1\) for k=0,1,2.

This is an **explicit subclass**, not a classification of all commuting curl eigenspaces on round \(S^3\). The base identities and weighted-variance algebra are prior art; this exact specialization still requires full historical novelty review. OpenAI Math family 376 concerns **forced** flat flows and 350 concerns other smooth metrics; neither implies this construction or any Clay closure. No cosmic topology measurement is claimed.

**PR gate:** do not merge without examining orientation, normalization, independent vector-field derivation and consistency with the existing unforced Jacobi sector. Visual integration, if later authorized, must be through the canonical HCC 3D/XR architecture and not a new HTML atlas.
