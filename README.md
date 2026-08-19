# S³ LIGHT-TRISPHERE — Interactive 3D Universe Model

A rigorous, source-auditable, fully interactive 3D explorer for the **Solar System**,
the **compact S³ Light-Trisphere universe** (Preece & Batenin 2026, v38
"light sphere screens") and the **FB(S³)R golden-ratio fractal ladder**
(Preece & Batenin 2025). One self-contained `index.html`, desktop **and**
smartphone, localized in English/Russian/German, with per-object formula provenance.

> Discipline: everything here is a **conditional reconstruction** of the cited
> publications — never a claim of topology detection. Light-sphere screens are
> reconstruction boundaries, not cosmic edges (∂S³_R = ∅); the local patch
> U ⊂ S³_R stays quasi-Euclidean; FBS3R is rendered as published, distinct
> from ΛCDM.

## Run

```bash
python3 -m http.server 8000     # → http://localhost:8000
```
or just open `index.html` (Three.js r160 + Google Fonts load from CDN).

Two entry points share one origin:

| page | for | needs a GPU |
|---|---|---|
| `index.html` | the atlas — **85** laboratories across 7 worlds, **83** typed instruments, **113** φ-ladder objects, WebXR | yes |
| `agent.html` | the machine-readable catalogue, read from `api/manifest.json` | no |

The newest laboratories are the **seven CIVP stations** — the CP¹ evaluation lock, the
molecular cut, the Jones ladder, the A₄ transfer, the UV selector, the Berry carrier and the
conditional closure. Each is a laboratory in its own right, with its own route, camera and
card, and together they are the source of six computational kernels: the mathematics is
written where the atlas draws it and `scripts/extract-kernels.mjs` slices it into the core.

**Desktop:** drag = orbit · wheel = zoom · right-drag = pan · Esc = leave surface/deselect.
**Mobile:** 1 finger orbit · 2-finger pinch zoom (φ-ladder depth in FBS3R, FOV when landed) ·
⚙/ⓘ bottom-sheet panels · horizontal mode row · iOS safe-area aware · DPR capped for stable FPS.

## Quest 3 quick start & diagnostics

**Read `QUEST3_START_HERE.md` first.** WebXR needs HTTPS — never `file://`.
The header shows an **XR Launch Gate** (`XR: checking… / HTTPS required /
unsupported / 🥽 Enter VR / XR failed — open XR CHECK`) instead of an optimistic
button. The **XR CHECK** panel shows secure-context, `navigator.xr`,
`isSessionSupported`, reference space, `enabledFeatures`, target frame rate and
the exact last `requestSession` error, with **Export XR Diagnostics JSON** and a
*Fallback reference space* switch. A minimal sanity route **`?xrtest=1`**
renders only a cube + grid + controller rays to isolate environment problems
from app problems. Platform matrix: `COMPATIBILITY.md`.

## iPhone / Android motion control

📱 **Motion** (touch devices): after explicit permission
(`DeviceOrientationEvent/DeviceMotionEvent.requestPermission`, iOS 13+, HTTPS)
phone tilt drives the app — modes: Orbit Camera, Inside Sphere Look, Outside
Sphere Parallax, **FBS3R Ladder Tilt** (pitch = N, roll = shell opacity),
**S³ Chi Tilt** (pitch = χ, twist = center spin), Fractal Flight. Sensitivity,
dead-zone, smoothing, invert, absolute-compass, calibrate-neutral-pose and
reset included; velocity-based and clamped for comfort; touch always preserved.

## S³ Center Lab & FBS3R deep control

S³ mode gained a **Center Lab** sub-view: arbitrary observer centers as unit
quaternions (presets / w,x,y,z / Hopf η,ξ₁,ξ₂ / geodesic-polar χ,θ,φ), two
χ-screens with overlap diagnostic, geodesic arc, tangent frame, antipode —
rendered in stereographic projection where every χ-screen is a round sphere;
centers are labelled *mathematical basepoints in the conditional S³
reconstruction*. FBS3R gained: N step/velocity/range, density exponent k,
exact BigInt Fibonacci vs Binet, φ′/l_P′ exploration with explicit **Tier 2**
labelling (canonical anchors hide), a **Sensitivity Observatory** (H₀, |Ω_K| →
live R′, N′, Γ′_obs) and eight one-tap **Experiences** (φ-Ladder Walk,
Published N_rec Gate 266, Particle Horizon Gate, Light-Trisphere Closure,
Density Chamber, Fibonacci Energy Ladder, S³/FBS Bridge, Sensitivity).
Sky zodiac constellations and the Precession **Age Wheel** are now explicitly
separate labelled layers with deconflicted labels.

## Scientific optical reconstruction — laboratory and stellar audit

Invariant Nexus, Symmetry Discovery, Holonomy, Contact & Action, Spinor & Light
Cone, DRD, Chromodynamics, Neutron Star, Supernova, Pulsar and Quasar now follow
one code-native optical contract derived from the project's strongest scenes:
deep black negative space, hairline geometry, restrained normal-blended shells,
and one sharp white carrier of motion. A computed path is never inflated into a
glowing pipe; a scientific state is never reduced to an embedded bar chart.

Each laboratory now lets its native geometry carry the explanation. DRD is one
carrier–modal–causal instrument with exact geodesic quantiles; QCD uses a
chromoelectric congruence, Y junction and renormalisation tunnel; the neutron
star is a live TOV cutaway; the supernova is a homologous ejecta volume with an
isotope clock; the pulsar is a dipole magnetosphere intersecting a physical
sight-line; and the quasar combines a black horizon with GPU differential
accretion and streamline jets. The original five observatories retain their
exact solvers and exports while their linework, glow hierarchy and moving probes
use the same disciplined grammar.

The stellar/compact-object extension applies the same best-of-both audit to the
historical neutron-star, supernova, pulsar, quasar, black-hole and
gravitational-wave scenes. It restores useful spatial configuration families,
separates Kerr horizon thermodynamics from Schwarzschild evaporation and ray
imaging, adds Goldreich-Julian/RVM pulsar observables, and replaces the flat GW
strip with native null-wavefront, polarization and detector-response geometry.
The missing electron-degenerate rung is now a composition-dependent
white-dwarf mass-radius laboratory. A separate five-station Radiation-MHD &
Helicity Observatory supplies reduced frozen-flux, helicity, reconnection,
normal-shock and magnetized Rayleigh-Taylor benchmarks without claiming a full
radiation-GRMHD solver.

The core uses custom Fresnel/filament and particle shaders, deterministic
`BufferGeometry`, parametric surfaces, sharp crystal probes and bounded
instancing. Mobile budgets reduce only representative visual density; solver
resolution, residuals, tolerances, classifications and exports do not change.
Inactive high-density station geometry is released outside Multiview, and the
same native scene remains stereo-safe in XR. The separate cinematic stage is
still an explicit setting and remains disabled by default. Attribution, the
station-by-station mapping, visual firewall and release gates are recorded in
[`SPATIAL_LABS_REBUILD.md`](SPATIAL_LABS_REBUILD.md). Stellar lineage,
best-of-both decisions and model boundaries are recorded in
[`STELLAR_BLACK_HOLE_AUDIT.md`](STELLAR_BLACK_HOLE_AUDIT.md).

## Invariant Nexus — the atlas of relationships

The S³ mode includes **Invariant Nexus**, an immersive typed graph spanning all
69 scientific laboratory views around it through 144 declared relations. Its edges distinguish
eight operational classes: exact identity, representation, shared invariant,
limit/reduction, coupling/input, causal succession, structural analogy and
contrast/hypothesis test. Every edge carries a plain-language claim and model
status; color or proximity can never silently turn an analogy into an identity.

The same graph has two continuously morphable embeddings:

- **disciplinary geography** groups laboratories into geometry/topology,
  quantum/matter, waves/materials, dynamics/phase space, thermodynamics/dense
  matter and astrophysics/observation;
- **relational spectral geography** uses three non-trivial eigenvectors of the
  unweighted normalized-adjacency graph, computed by deterministic orthogonal
  iteration; it is a topology-of-the-registry view, not an evidence metric.

Click/tap/XR-select a luminous node to inspect its scientific contract,
double-activate to approach it, filter the graph by relation class, trace a
shortest typed path between any two laboratories, open up to four consecutive
path nodes in Multiview, or export the complete graph as
`fbs3r_invariant_nexus.json`. Graph distance and embedding coordinates are
explicitly non-metric: they are not physical distance, evidence strength,
similarity magnitude or causal effect size.

The default local lens shows only the focused neighbourhood and traced route.
Explicit path, structural-hypothesis and global lenses are available. Proposed
bridges are ranked by a leave-one-declared-edge-out resource-allocation audit;
they remain unadmitted curation prompts until a typed claim, source and review
are supplied.

## Spinor & Light-Cone Observatory — from S³ phase to null infinity

**Spinor & Light-Cone Observatory** exposes one exact representation chain
without collapsing its physically distinct meanings:

- a normalized two-spinor on S³ produces a future null ray through the Pauli
  bilinear, while common U(1) phase leaves that ray fixed;
- `X=x^μσ_μ → AXA†` realizes `SL(2,C) → SO⁺(1,3)`, preserving the Hermitian
  determinant/Minkowski interval and displaying the `A ↔ −A` double cover;
- the projective coordinate `ζ=ψ₁/ψ₀` undergoes the induced celestial Möbius
  map, agrees with the transformed null direction and preserves a complex
  four-point cross-ratio;
- an orthonormal spin dyad constructs a Newman–Penrose null tetrad and resolves
  spin-frame weights one and two;
- the radial `1+1`, `r≥0` section of flat Minkowski spacetime compactifies to a
  finite Penrose diamond while outgoing and ingoing null families remain null.

Each station has two live controls, a moving 3D construction, native-space
residuals, explicit tolerances and scope boundaries, exact-neighbour Multiview
composition, and a reproducible
`fbs3r_spinor_lightcone_observatory.json` export. All identities are evaluated
in C², Herm(2), Minkowski R^(1,3), or the declared radial conformal section
before visualization. The module is not observational data, a curved-spacetime
solver, a quantum-gravity theory, or evidence that qubits, photons and
gravitational waves are one physical system. Primary anchors include
[Newman & Penrose's null-tetrad formalism](https://doi.org/10.1063/1.1724257),
[Penrose's conformal treatment of null infinity](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.10.66),
[Penrose's conformal-spinor/twistor algebra](https://www.osti.gov/biblio/4433498),
and the explicit [Lorentz/celestial-sphere correspondence](https://arxiv.org/abs/1508.00920).

## Holonomy Observatory — what a closed journey remembers

**Holonomy Observatory** makes five manifestations of path-dependent return
directly comparable without collapsing their physical meanings:

- round-S² Levi-Civita transport, independently propagated along a 1,024-edge
  geodesic polygon and closed against `∫K dA = Ω`;
- spin-½ Berry phase, evaluated both as `γ_B = −Ω/2` and as a normalized
  257-vertex Pancharatnam/Wilson product, then repeated after a non-constant
  local U(1) gauge transformation;
- a genuinely non-Abelian SU(2) group commutator with unit-quaternion closure,
  conjugacy-invariant `½Tr C`, and an exactly commuting U(1) control;
- two orthogonal Lorentz boosts in both orders, preserving the Minkowski
  interval and determinant while producing the exact Thomas–Wigner angle;
- an SL(2,R) elliptic/hyperbolic Möbius commutator, with determinant-one and
  conjugacy-trace checks plus a visible complex probe orbit.

The 3D instrument combines the ordered path, moving transported crystal,
sampled frame field, curvature-flux surface and co-located start/return vectors;
the surviving phase is visible as braid twist on the path itself. Every station provides two live controls,
an analytic anchor, an independently computed closure residual, a declared
validity scope, one-click Multiview anchors and a reproducible
`fbs3r_holonomy_observatory.json` export. It is a mathematical observatory, not
a physical measurement or an exhaustive classification. Its primary anchors
are [Simon’s holonomy formulation of Berry phase](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.51.2167),
[Berry & Visser on boost composition](https://arxiv.org/abs/2101.05971),
[spherical spin holonomy](https://arxiv.org/abs/2408.01169), and
[non-Abelian Wilson-loop control](https://journals.aps.org/pra/accepted/10.1103/wk9v-xp4l).

## Contact & Action Observatory — dynamics written on an S³ shell

**Contact & Action Observatory** exposes the extra structure carried by a
three-dimensional energy hypersurface inside four-dimensional phase space. Its
five exact, deliberately bounded stations are:

- the standard contact form on unit S³, where the Reeb vector field is the
  common-phase Hopf flow; the native R⁴ contact equations, constant Hopf image,
  period/action and a finite Gauss linking check are shown together;
- the integrable ellipsoid Reeb flow, with exact frequencies, axis actions and
  a Poincaré-disk return rotation; rational and irrational frequency ratios are
  never conflated;
- a coprime family of Legendrian torus knots whose tangent satisfies
  `λ₀(γ̇)=0` around the full curve;
- the Kustaanheimo–Stiefel/Hopf spinor map, displaying its U(1) gauge fibre,
  `|X(u)|=|u|²`, collision blow-up and the regular-time law
  `dt=|u|² ds`;
- the harmonic-oscillator action loop, Maslov index `μ=2`, EBK half-quantum
  shift and metaplectic double return: a classical `2π` return lifts to `−1`,
  while `4π` returns to `+1`.

Every invariant is evaluated in its native dimension before stereographic or
phase-plane projection. Each station has live parameters, an analytic anchor,
an independently evaluated residual, an explicit validity boundary, exact
Multiview bridges and a reproducible `fbs3r_contact_action_observatory.json`
export. The module is grounded in
[finite-energy foliations and Reeb dynamics on S³](https://annals.math.princeton.edu/2003/157-1/p04),
[global disk-like sections on convex energy surfaces](https://annals.math.princeton.edu/articles/12987),
the [original KS transformation](https://www.degruyter.com/document/doi/10.1515/crll.1965.218.204/html),
[Moser’s regularization](https://onlinelibrary.wiley.com/doi/10.1002/cpa.3160230406),
and [Arnol’d’s Maslov-class formulation](https://www.mathnet.ru/eng/faa2802).

## Symmetry Discovery Chamber — invariants under stress

**Symmetry Discovery Chamber** turns five transformation spaces into one
inspectable experiment: SO(3) rotations, SO⁺(1,1) Lorentz boosts, global U(1)
phase, symplectic phase rotation and Möbius action on the Riemann sphere. Each
space sweeps a deterministic 65-sample orbit and tests four named observables,
for 20 candidates and nine exact benchmark invariants in total.

The exact cyan orbit can be compared with a coral, explicitly non-group
perturbation. Four candidate filaments remain welded to a stable orbit or peel
away by an amount driven by normalized drift; the tolerance
is selectable; all samples, candidate values, residuals and the perturbation
contract export to `fbs3r_symmetry_discovery.json`. One click composes each
space with its theorem or representation anchors in Multiview, and the chamber
is itself a first-class Atlas and Nexus node.

The instrument is deliberately **finite, deterministic and non-ML**. A stable
candidate is numerical evidence inside the displayed action, not a theorem or
an exhaustive discovery. Its invariant-first design is informed by recent work
on [symmetry discovery in classical mechanics](https://arxiv.org/abs/2412.14632)
and [equation discovery from symmetry invariants](https://arxiv.org/abs/2505.12083);
the implemented exact anchors follow the Lorentz-invariant kinematic contract
and Möbius cross-ratio invariance.

## Premium visual engine — one cinematic language, zero scientific drift

The premium layer is **optional and disabled by default**. A fresh browser keeps
the original laboratory presentation. To opt in, open **More → Interface →
Premium visuals: Off**; the explicit choice is saved locally and the same
control restores the classic view at any time.

When enabled, every mode and all 70 S³ laboratories share a restrained display system: an
explicit sRGB/ACES color pipeline, domain-directed accents, a camera-facing
precision stage, layered glass controls, cinematic view reveals and
priority-aware CSS2D label decluttering. The stage is deliberately named and
implemented as **non-metric**: it never enters picking, model coordinates,
diagnostics or exports, and color identifies a broad laboratory family rather
than a measured scalar.

Bloom uses its own capped render-buffer budget and a frame-pressure governor.
If a device cannot sustain the cinematic buffer, only post-processing
resolution steps down; simulations, geometry, sample counts and numerical
solvers remain untouched. Quality is restored gradually after sustained
headroom. WebGL context loss resumes from a conservative buffer instead of
leaving a white or frozen viewport. The single-camera stage is intentionally
disabled in XR and four-camera Multiview, where its facing-plane assumption
would be invalid.

## WebXR — Meta Quest 3 VR & MR

Serve over **HTTPS** and open in Meta Quest Browser: 🥽 VR and ◈ MR header
buttons appear only when `immersive-vr` / `immersive-ar` are genuinely supported
(feature-detected; flat experience untouched otherwise).

Inside XR: **wrist Control Observatory** (modes, time, χ/β/N navigation, quality,
snap-turn, recenter, exit), **controller rays** with models + haptics,
**hand tracking** (pinch select, index-ray, wrist-following menu),
**blink teleport** + smooth fly with comfort vignette + snap turn 15/30/45°,
**two-hand grab** to move/scale/rotate the whole universe (0.05–20×),
**in-world object cards** with rows + formula provenance + source tags
(grabbable, billboarded), **status panel** (UTC/sim clocks, FPS, frame time,
draw calls, triangles, foveation, target Hz, XR feature flags, discipline
disclaimer), and **MR passthrough** with hit-test reticle, tap-to-place tabletop
models and session anchors where granted. Quality presets (Quest Safe /
Balanced / Ultra / Desktop Cinematic) drive foveation, raymarch steps, star
draw-ranges and Hopf density, with an automatic downgrade guard below ~63 FPS.
Honesty rule: capabilities WebXR does not expose (raw camera pixels, multiview,
native SDK) are documented in `XR_VALIDATION.md`, never faked. The Fractal
Explorer's TRUE-GEOMETRY types (hydrogen orbitals, 4-polytopes, bifurcation 3D,
Mandelbrot⇄Julia fibers) are fully XR-enabled; only the fullscreen mono raymarch
types (Mandelbulb / 2D sets) remain excluded (not stereo-safe) — entering XR on
one of those switches to the orbitals instead of leaving the Fractal atlas.
The wrist menu stows/recalls with the Y button (small gold wrist dot while
stowed); every object card offers ◉ Ride (the object carries your exact
vantage) and, for planets, ⭑ Stand (surface viewpoint with the sky overhead).

XR docs: `XR_VALIDATION.md` (capability matrix + manual checklist) and
`QUEST3_TEST_PLAN.md` (device test plan). New exports: `xr_session_capabilities.json`,
`formula_registry.json`, `source_registry.json`, `validation_report.json`
(all stamped with timestamp, version, registry hashes and the model disclaimer).

**Universal interactivity:** every visible object — Sun, planets, the Moon,
light-sphere screens, S³ observer/antipode/cap/photon, Hopf fibres' base map,
φ-shells, epoch markers, constellations, cycle instruments — is click/tap
selectable and opens a live data card with **Focus** (fly-and-follow camera),
**formula provenance + source tags** (hover for full citation), and for
planets/Moon **Land** (first-person surface view with true-scale sky).

## The seven modes

### ☀ Solar System (1 unit = 1 AU)
Keplerian J2000 orbits (JPL approximate ephemerides; Kepler's equation by Newton
iteration), the Moon (Meeus principal-term theory), asteroid belt, Saturn's rings,
time control (days/s → millennia/s), **date picker**, true-scale toggle, gold
**syzygy line** when Sun–Moon–node align (eclipse window). Celestial sphere:
procedural **Milky Way** aligned to the true galactic plane, bright-star catalogue
with real colours, **12 zodiac constellations** (gold, with glyphs ♈…♓) + 8
principal figures, dashed gold ecliptic; all toggleable, all selectable.

### ✶ Cycles & Events
Three instruments on **one shared timeline** (speed up to Gyr/s, date picker):
- **Galactic clock** — Sun orbiting Sgr A*, T ≈ 230 Myr, live galactic-year counter;
- **Precession clock** — the 25,772-yr Great Year, axis cone 23.44°, the twelve
  zodiac Ages with live progress (Pisces → Aquarius ≈ 2150 AD);
- **Seasons dial** — true Earth orbit; **equinoxes & solstices computed by
  bisection on λ_sun = k·90°** with jump buttons;
- **Solar-eclipse catalogue 2024–2035** (NASA Canon dates/types/regions):
  one click jumps to greatest eclipse, pauses, switches to true scale and shows
  the alignment;
- **All-cycles dashboard** — synodic month, tropical year, Saros, Metonic,
  precession, galactic year, FBS3R re-quantization, S³ photon loop: period,
  live phase bar, 👁 one-click observation preset each.

### ◯ Observable Universe (1 unit = 1 Gly)
Invariant light-sphere screens: ct₀ = 13.788 Gly, S²_LSS, particle horizon
S²_ph = 46.125 Gly; clustered large-scale structure inside B³_χ(p).

### ⬡ S³ Carrier & Hopf (1 unit = 100 Gly)
- **Invariant Nexus** — 69 laboratory nodes, 144 typed relations, six disciplinary domains, eight
  epistemic edge classes, a disciplinary↔invariant layout morph, typed
  pathfinding, Multiview comparison and JSON export;
- **Spinor & Light-Cone Observatory** — five exact stations linking a normalized
  S³ spinor, future null rays, the `SL(2,C)` Lorentz double cover, celestial
  Möbius geometry, null-tetrad spin weights and radial conformal infinity, with
  native-space residuals, Multiview bridges and JSON export;
- **Holonomy Observatory** — five closed-path stations for spherical transport,
  Berry phase, SU(2) Wilson commutators, Thomas–Wigner rotation and SL(2,R)
  monodromy, each with an analytic anchor, numerical closure, Multiview and JSON;
- **Contact & Action Observatory** — five exact stations joining the standard
  Reeb–Hopf flow, ellipsoid return maps, Legendrian knots, KS collision
  regularization and Maslov/EBK phase, with native-dimensional residuals,
  Multiview bridges and JSON export;
- **Symmetry Discovery Chamber** — five transformation spaces, twenty candidate
  observables, nine exact benchmark invariants, finite-orbit residual braids,
  a controlled symmetry-break perturbation, Multiview anchors and JSON export;
- **Radiation-MHD & Helicity Observatory** — five reduced spatial benchmark
  stations for frozen flux, closed-domain magnetic helicity, Sweet-Parker
  reconnection, a normal-shock baseline and magnetized Rayleigh-Taylor growth,
  with typed stellar/plasma bridges and reproducible export;
- **White-dwarf degeneracy laboratory** — the composition-dependent
  Chandrasekhar endpoint and Nauenberg zero-temperature mass-radius family,
  rendered as a cutaway plus actual spatial stellar configurations and joined
  to the white-dwarf → supernova → neutron-star cycle;
- the foundational sub-laboratories include:
- **Section** — R = 548.3245 Gly great 2-sphere; observable cap θ = 4.82°
  (Γ_obs = 0.0126 %); interactive screen S²_χ with live A(χ), Γ(χ); photon on
  the great circle with Γ(T) and t_coh = πR/c = 1722.6 Gyr;
- **Hopf fibration** — fibre-density control, **Hopf-flow beads** (the S¹ action
  slides each fibre along itself), a draggable **linked pair** (linking number 1,
  the seed of π₃(S²) = ℤ), mini **base-S² map** (one dot = one fibre);
- **Eigenmodes** — the compact ladder λ_β = (β²−1)/R², g_β = β² painted as
  Y_ℓm sectors with live eigenvalue/wavenumber/wavelength readouts.

### φ FBS3R Levels
The published golden-ratio ladder with full navigation:
- slider over N **with epoch tick marks** + quick-access chips
  (Planck → proton → atom → human → Earth → N★207 → AU → ly → galaxy → recombination
  N=266 → particle horizon → S³ radius);
- **exact-N input** and **physical-length input** with units fm/nm/mm/cm/m/km/AU/ly/Gly
  via N(L) = ln(L/l_P)/ln φ;
- endless-zoom nested φ-shells (clickable), golden spiral, re-quantization wave,
  continuous-cyclicity animation, phase indicator (fractal φ-phase ≤ 266 <
  exponential H-phase), familiar-scale comparator;
- **live formula matrix** and **exports**: app-state **JSON** and the full
  313-row φ-ladder benchmark **CSV**.

The published recombination-level label `N_rec = 266` and the independent
CoScale clock are displayed separately. With `t(N)=t_P·φᴺ`, level 266 is
approximately 66.6 kyr; 380 kyr corresponds to `N≈269.62`. The interface does
not silently identify these two anchors.

### ∇ Field Lab
Eight reproducible reduced-unit solvers—heat, damped waves, Gray–Scott,
Poisson electrostatics/gravity, Schrödinger packets, FitzHugh–Nagumo and a 3D
Ising Monte Carlo—publish their live invariants onto the shared atlas bus. Grid,
boundary and calibration limits remain visible: these are reference models, not
unsupported material, engineering or clinical forecasts.

### ❄ Fractal Explorer
GPU distance-estimator raymarching of the Mandelbulb z → zⁿ + c (power,
iterations, palette) — self-similar detail at every zoom.

## Core formulas (all exposed in-app with provenance)

```
R   = (c/H₀)/√|Ω_K| = 548.324513026856 Gly   (|Ω_K| = 0.0007, H₀ = 67.4)
V   = 2π²R³            D_causal = πR           C = 2πR
A(χ) = 4πR²·sin²χ      Γ(χ) = (χ − ½sin 2χ)/π
λ_β = (β²−1)/R²        g_β = β²                k_β = √(β²−1)/R
R(N) = l_P·φᴺ          N(L) = ln(L/l_P)/ln φ
ρ(N)/ρ_P = φ⁻³ᴺ        F_N ≈ φᴺ/√5             published N_rec = 266
t(N) = t_P·φᴺ          R(N)/t(N) = c             [CoScale identity]
Δα = ∫K dA = Ω         γ_B = −Ω/2                 [closed-path holonomy]
W = ½Tr(UₓUᵧUₓ⁻¹Uᵧ⁻¹)  Ω_W = −2 atan[tanh(α/2)tanh(β/2)]
```

## Source / provenance policy

All constants live in tagged blocks (`S3`, `FBS`, `SOURCE_MAP`, planetary
elements, lunar theory, eclipse catalogue) and every selection card shows its
source tags — hover for the full citation: **S3-v38**, **FBS3R**, **JPL-approx**,
**Meeus**, **CODATA**, **IAU**, **NASA-Canon**, **astro-std**, **INV-NEXUS**, **derived**.
Accuracy envelopes are disclosed in `VALIDATION.md`. The app never presents the
S³ topology or the FBS3R ladder as detected facts.

`SCIENTIFIC_CONTRACT.md` defines the required epistemic statuses, typed-datum
metadata, relation taxonomy and validation obligations for future laboratories.

## Predictive foundations

The Smith laboratory can now ingest Touchstone S1P/S2P sweeps, fit and reject a
transparent series-RLC inverse on unseen samples, and render measurement,
forecast and uncertainty directly on the Riemann sphere. Invariant Nexus uses
an uncluttered local lens and deterministic spectral geometry; its proposed
bridges are held-edge-calibrated curation hypotheses, never automatic laws.
Symmetry, Holonomy, Contact and Spinor laboratories share sensitivity,
uncertainty, exact-holdout and inverse-target instruments. Black-hole
thermodynamics includes a restored, non-random Schwarzschild radiation field
alongside the Kerr and evaporation stations.

The implementation decisions and scientific rejection gates are recorded in
[PREDICTIVE_FOUNDATIONS_AUDIT.md](PREDICTIVE_FOUNDATIONS_AUDIT.md).

## Validation

```bash
npm test                      # or: node scripts/validate.mjs
```

## FBS3R web sources

[figshare 28631525](https://figshare.com/articles/preprint/_sup_strong_Fractal_Bindu_S3_of_Reality_The_Golden_Ratio_as_the_Principle_of_Perfection_and_Harmony_in_Interdependent_Existence_strong_sup_/28631525) ·
[PhilArchive PREFBS](https://philarchive.org/archive/PREFBS) ·
[PhilArchive PREFAC-3](https://philarchive.org/rec/PREFAC-3) ·
[OSF vdfwh](https://osf.io/preprints/osf/vdfwh_v2)

## Technology

Three.js r160 (WebGL2, OrbitControls, CSS2DRenderer, logarithmic depth, GLSL
raymarching), Cinzel + Manrope, a single-file browser runtime plus dependency-free
Node validation. No application bundler is required.
