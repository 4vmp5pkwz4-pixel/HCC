# Hopf Frame Relative Dynamics — experimental research gate (2026-10-10)

**Status:** proven classical algebraic identities for the explicitly stated equivariant ansatz, plus automated numerical/unit tests. Not a physical topology detection, not full coupled Einstein–matter stability, not quantum Yang–Mills mass gap, not a Clay Navier–Stokes solution.

## Model
On prescribed round FLRW spatial slices S³, take three independent maps n_a(t,q)=q v_a(t) q^{-1}, |v_a|=1, the quadratic sigma coefficient α>0, quartic Faddeev coefficient β>0, and alignment potential V=(κ/2)Σ_(a<b)(n_a·n_b)² with κ≥0. Define

- A(a)=α+β/(4π²a²); C(a)=4α/a²+β/(π²a⁴).
- Static Gram tensor S_ij=Σ_a v_ai v_aj, trace S=3.
- Static tracefree stress Π_ij=−C(S_ij−δ_ij).
- Exact static penalty V=κ‖S−I‖_F²/4=κ‖Π‖_F²/(4C²). A misaligned static triple with κ>0 need not solve its matter equations.
- For solutions of equivariant matter equations: Noether charge J=a³A Σ_a(v_a×v̇_a) is constant and T_(0i)=2J_i/a⁴. Exact comoving FLRW gravity requires J=0, but anisotropic stress adds constraints.
- Three homogeneous relative Gram modes have test-background frequency² 2κ/A. Full metric perturbation spectrum not computed.
- Nonlinear invariant two-angle-pair ansatz v1=(cos x,sin x,0), v2=(sin x,cos x,0), v3=(0,0,1) gives ẍ+(3H+Ȧ/A)ẋ+κ sin(4x)/(2A)=0 and E_x=A ẋ²+κ sin²(2x)/2, dE_x/dt=−H(4A+2α)ẋ². This is prescribed-background matter physics, not a shear-free Einstein solution for arbitrary x.

## Prior art and novelty restrictions
The orthonormal locked sector maps to the known SU(2) Skyrme density. See Canfora et al., *Phys. Rev. D* 99, 044035 (2019), https://doi.org/10.1103/PhysRevD.99.044035 and Endlich et al., *JCAP* 10, 011 (2013), https://doi.org/10.1088/1475-7516/2013/10/011 .

The candidate contribution is the exact Gram/Noether/dynamical analysis of **independent** S² maps, not the discovery of the Skyrme cosmological branch. Independent priority evaluation remains open.

## Operational safety and next gate
The kernel is a pure numerical calculator and may be imported by research pages; no existing observed parameters, cosmological constraints, or scene physics are changed by this PR. Before PRD or observational integration: solve constrained coupled Einstein–matter scalar/vector/tensor perturbations, including Bianchi IX shear; analyze PDE hyperbolicity and kinetic ghosts; perform systematic literature priority review.

Verification: `node --test test/hopf-frame-relative.test.mjs`; separately, the LaTeX derivation and 1500-case Python+SymPy tensor audit are included in the linked conversation research archive, not asserted as Lean formalization.
