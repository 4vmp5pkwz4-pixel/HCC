# Predictive Foundations Transfer Audit

Date: 2026-08-02

Source reviewed in full:

- UPRS_Mobius_Hopf_OmniAtlas_v5.1.0_unified_3d_observatory.html
- 10,888 lines; 1,832,571 bytes
- SHA-256 af5eee338e086563cb2d405fcf25550462da31a8839510e3f57eecea814effb8
- 78 script blocks, 55 style blocks and 736 element IDs

The source is an append-only stack of runtime patches rather than one coherent
version. The implementation therefore transfers its strongest scientific
contracts, not its overlapping handlers or version-authority debt.

## Transfer principle

Every upgraded station follows one operational sequence:

1. evaluate the declared exact or numerical model at a controlled state;
2. perturb one typed input without mutating the active state;
3. estimate first and second local sensitivity;
4. propagate a declared input uncertainty;
5. reserve a displaced exact evaluation as an unseen holdout;
6. compare the local forecast with the holdout under a numerical gate;
7. find every bracketed inverse-control solution for a requested target;
8. export the result with its validity domain and rejection semantics.

The pale future curves are native paths on each station's own manifold. They
are not flat charts placed in 3D and do not acquire physical metric meaning.
The expensive inverse and holdout audits are memoized by their complete typed
control state, so the animation loop reuses a verified result until a relevant
control actually changes.

## Smith measurement assimilation

The Smith laboratory now accepts Touchstone S1P and S2P text using RI, MA or DB
complex formats and Hz, kHz, MHz or GHz frequency units. The parser retains the
declared reference impedance and reads S11 from either one- or two-port files.
The supported subset is aligned with the
[IBIS Touchstone 2.1 specification](https://www.ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf),
and unsupported features are rejected explicitly rather than silently
reinterpreted. Triangular matrix encodings, mixed-mode data,
non-S parameters, non-uniform reference impedances, malformed records and
dangling numeric continuations are rejected explicitly; v2 noise data are not
misread as network samples.

The inverse model is intentionally small and falsifiable:

- invert S11 through Z = Z0(1+Gamma)/(1-Gamma);
- infer R from Re Z;
- solve Im Z = omega L - 1/(omega C) by linear least squares;
- scale omega and 1/omega around the geometric band centre before solving and
  report the resulting design condition number;
- require positive, finite R, L and C;
- hide every fifth sample from the fit;
- report train and holdout complex-Gamma RMSE separately;
- derive f0, Q, covariance-based sigma(f0) and a robust residual envelope;
- reject the series-RLC hypothesis when its holdout gate fails, the scaled
  basis is ill-conditioned, the inferred resonance lies outside the measured
  band or the samples violate the passive one-port envelope.

Mint samples are training points, coral samples are holdouts, gold is the
out-of-sample RLC path and violet is the complex-residual envelope, all lifted
onto the existing Riemann sphere. A deterministic synthetic sweep provides a
reproducible end-to-end benchmark. This is not VNA calibration, fixture
de-embedding or automatic multi-pole causal identification.

## Symmetry Discovery

The original finite candidate scan remains, but its decision is now split into
48 training locations and 16 interleaved holdouts. The station reports
train/holdout agreement, local break-amplitude susceptibility and the first
break amplitude at which the named invariant crosses the selected tolerance.
The predictive workbench can switch among every declared candidate, including
negative controls, and exports the chosen candidate ID and whether it is an
expected invariant.
Recent symmetry-discovery research motivates the falsifiable, data-separated
workflow, but this browser implementation does not claim to run the learning
systems described in [Machine Learning Symmetry Discovery for Classical Mechanics](https://arxiv.org/abs/2412.14632).

## Holonomy, Contact and Spinor stations

Holonomy, Contact & Action, and Spinor & Light Cone now expose:

- a station-native forecast observable;
- local sensitivity and curvature;
- propagated control uncertainty;
- an exact displaced holdout;
- a pass/reject result for the local surrogate;
- every bracketed inverse target in the normalized control domain;
- an optional native future path and uncertainty corridor;
- a reproducible JSON payload and prepared Multi-View quartet.

Each station also publishes its exact holdout forecast, surrogate error and
propagated envelope on the shared live bus. Semantic Multi-View sets therefore
show operational forecast values simultaneously instead of falling back to an
unrelated first readout.

Exact model identities remain exact. The predictive layer measures the
usefulness and limits of a local surrogate; it does not convert a mathematical
identity into calibrated experimental forecasting.

## Invariant Nexus

The previous hash-jittered relation-signature layout is replaced by three
non-trivial eigenvectors of the unweighted normalized adjacency matrix. A
deterministic shifted orthogonal iteration runs for 96 iterations. The
coordinates remain non-metric interface coordinates.

The fresh-browser lens is local, so unrelated conduits do not obscure the
laboratory constellations. Other explicit lenses are:

- traced path only;
- structural candidate bridges;
- full global topology.

Candidate bridges use a resource-allocation score over common neighbours. The
score is calibrated by removing each declared edge in turn and measuring
recall@1, recall@5 and mean reciprocal rank. A candidate is never inserted into
the scientific registry automatically: it needs a typed claim, a source and
review. The score predicts graph reconstruction, not a law, evidence strength,
equivalence, similarity magnitude or causation.

## Restored black-hole radiation

Repository history identified the earlier luminous implementation and its
useful halo, outgoing emission and mass-family ideas. Those features are
restored without its random particle respawn and without removing the newer
exact Kerr horizon station.

The new station is a Schwarzschild radiation reference:

- deterministic instanced outgoing tracers;
- nested non-random wavefronts;
- restored gold/blue halo;
- a spatial mass-temperature-lifetime constellation;
- the energy-spectrum peak x = h nu/(k_B T) = 2.821439372...;
- independent doubled-mass checks of T proportional to M^-1,
  L proportional to M^-2 and t_evap proportional to M^3.

Freezing the radiation station performs one deterministic priming frame and
then stops flux-buffer uploads, wavefront transforms and halo rotation. The
radial glow texture is shared across laboratory rebuilds instead of allocating
an identical GPU texture for every halo.

It is deliberately not advertised as a precision Hawking spectrum. Modern
codes such as [BlackHawk v3](https://arxiv.org/abs/2606.06355) compute
frequency-, spin- and species-dependent greybody factors numerically. Those
factors, particle thresholds, accretion, back-reaction and the endpoint remain
outside this browser reference and are named in every export.

## Verification gates

Automated checks cover:

- JavaScript syntax;
- Touchstone parsing and unit/reference-impedance preservation;
- exact recovery of a synthetic series RLC and unseen holdout closure;
- inverse-root recovery;
- finite Holonomy holdout/sensitivity/uncertainty;
- separated Symmetry train and holdout decisions;
- finite deterministic Nexus spectral coordinates;
- bounded held-edge reconstruction metrics;
- Hawking spectral-peak closure and three independent mass scalings;
- UI IDs, exports, Multi-View hooks, predictive-cache guards, shared glow
  allocation and deterministic BHT rendering.

Live browser QA additionally checks console errors, view isolation, visual
occlusion, controls, exports and renderer resource stability.
