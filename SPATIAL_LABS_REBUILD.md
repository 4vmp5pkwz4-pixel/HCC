# Scientific Optical Reconstruction — Eleven-Laboratory Audit

## Scope and repository attribution

The rebuild scope is quality-based, not author-based. `git log`, `git show` and
line attribution identify two historical groups:

| Laboratory | Introduction | Repository attribution | Optical reconstruction |
|---|---:|---|---|
| Invariant Nexus | `d0e1920` | Codex/neatpeak | Six restrained relation volumes, hairline typed paths, a sparse epistemic tensor and one readable path tracer. |
| Symmetry Discovery | `544f321` | Codex/neatpeak | Native group-action manifold, exact/broken orbits and a sharp finite-scan probe; no residual bars. |
| Holonomy Observatory | `2939984` | Codex/neatpeak | Transported frame, curvature surface and co-located return state; no detached dial. |
| Contact & Action | `c757fa9` | Codex/neatpeak | Contact planes, Reeb flow, return geometry, KS throat and Maslov caustic in their native space. |
| Spinor & Light Cone | `92a8748` | Codex/neatpeak | CP¹ sphere, null cone, tetrad and conformal geometry with a single phase carrier. |
| Chromodynamics | `22712e2` | Claude | Chromoelectric field congruence, baryonic Y junction, αs renormalisation tunnel and restrained instanton fibres; no rod. |
| DRD Info | `7d6d37e` | Claude | One carrier–modal–causal instrument; presentation chain, bars and stochastic histogram retired. |
| Neutron Star | `6fc6753` | Claude | Live TOV quarter-cutaway, density shells, profile filament and compactness field; no M–R slide. |
| Supernova | `2dc5cbe` | Claude | Homologous ejecta, isotope orbits, sharp expansion tracer and soft shock front; no light-curve slide. |
| Pulsar | `2dc5cbe` | Claude | Dipole congruence, open polar caustics, current sheet and physical observer sight-line; no opaque cones or P–Pdot chart. |
| Quasar | `2dc5cbe` | Claude | Black horizon, photon ring, GPU differential accretion and streamline jets; no overexposed plate or jet cylinders. |

The optional global cinematic stage is outside the scientific scene contract and
remains disabled by default.

## Optical contract

The benchmark is the project's Gravitational Lensing language: structure first,
light second. The reconstruction enforces six rules:

1. **Black is a scientific layer.** Negative space separates causes, paths and
   boundaries; every surface is forbidden from filling the frame by default.
2. **Paths are hairlines.** `THREE.Line` plus deterministic `BufferGeometry`
   replaces luminous `TubeGeometry`. The stored radius is compatibility metadata,
   not visible thickness.
3. **Motion has one owner.** A small white core is the primary moving datum. Its
   halo is compact, normal-blended and subordinate; background beads are sparse.
4. **Bloom cannot explain the model.** Scientific shells use restrained
   normal blending and Fresnel edges. They remain readable with optional bloom
   disabled and in WebXR, where the post-chain is absent.
5. **Geometry carries semantics.** Equations become native manifolds, field
   congruences, cutaways, causal fronts or spatial intersections — never a chart
   merely placed in a 3-D room.
6. **Adaptation changes density, not truth.** Mobile/XR budgets may lower visual
   particle or filament counts. Exact solvers, samples, tolerances, state,
   classifications and exports remain identical.

The implementation remains on the project's Three.js r160 WebGL2/WebXR renderer.
It uses custom shader materials, point/line `BufferGeometry`, parametric surfaces
and bounded instancing without adding a second rendering architecture.

## Scientific visual grammar

| Model quantity | Spatial encoding | Explicit limitation |
|---|---|---|
| trajectory / orbit / geodesic | one-pixel hairline plus one sharp moving carrier | line opacity and tracer speed are interface choices |
| phase / holonomy | braid or ribbon twist around the computed path | twist displays an already computed phase; it does not measure it |
| invariant residual | exact and perturbed filaments remain welded or separate | Euclidean separation is a monotonic display map, not physical distance |
| parallel/contact frame | sparse oriented plane field | plane size and sampling density are interface choices |
| integrated curvature / causal volume | restrained Fresnel surface bounded by an exact rim | opacity is not curvature, probability or density |
| graded capacity | representative interpenetrating modal populations plus exact numeric multiplicity | GPU dots are not one dot per mode and mode counts are not bits |
| field confinement | a family of chromoelectric integral curves | colour and line density are declared visualization encodings |
| stellar interior | live equation-driven cutaway shells and radial profile | shell hue is normalized density, not observed colour |
| explosive expansion | velocity-resolved particle volume and surface tracer | display radius is normalized; exact physical radius stays numeric |
| pulsed observation | beam/field intersection with a fixed sight-line | beam shape is schematic and spin is slowed |
| relativistic accretion | differential GPU particle orbits, photon ring and thin jet congruence | disk/jet morphology is schematic; luminosity formulas remain exact |
| typed laboratory relation | colored hairline through restrained domain volumes | graph distance remains non-metric and non-causal unless explicitly typed causal |

Every numerical invariant is evaluated before visual projection. Visual controls
never alter a solver step, sample count, epistemic status or exported quantity.

## Station-specific scene language

- **Invariant Nexus:** six translucent disciplinary volumes, restrained crystal
  nodes, hairline typed relations, a sparse eight-direction tensor and an
  unambiguous path tracer.
- **Symmetry:** SO(3), Lorentz, U(1), symplectic and Möbius action spaces with
  exact and perturbed orbit filaments.
- **Holonomy:** curvature cap, Berry sphere, SU(2) transport, Wigner disk and
  Möbius return; start and return states share one base point.
- **Contact & Action:** S³ contact shell, Poincaré section, Legendrian geometry,
  KS regularization throat and Maslov caustic.
- **Spinor & Light Cone:** CP¹ state sphere, finite null cone, celestial map,
  tetrad volume and conformal diamond.
- **DRD:** concentric S⁰→S³ carrier growth, three interpenetrating modal sectors
  and deterministic equal-probability S³ geodesics classified by θc=πτ.
- **Chromodynamics:** a fine flux bundle between quarks, a neutral baryonic Y
  junction, a logarithmic running-coupling tunnel and topological Hopf fibres.
- **Neutron Star:** equation-driven TOV layers with an open quarter, pressure
  profile, surface tracer, maximum-stable reference and sparse lapse circles.
- **Supernova:** homologous velocity cloud, radial filaments, Ni/Co/Fe orbital
  fractions and a soft shock boundary.
- **Pulsar:** dipole and open-field congruences, current sheet, detector and
  pulse intensity generated by the actual line-of-sight crossing.
- **Quasar:** black horizon and photon ring inside a sheared temperature field,
  with GPU orbital particles and narrow two-sided jet streamlines.

## Performance and lifecycle

The shared curve core sanitizes non-finite/repeated points and safely degrades
degenerate closed paths. Dynamic QCD lines update existing attributes in place.
DRD geodesic quantiles are solved once and only their material state changes.
Quasar orbital motion is one shader-time uniform. Supernova ejecta and modal
capacity use bounded point buffers. Station observatories dispose geometry,
materials, render-list references and CSS2D nodes after leaving the view outside
Multiview; their lightweight Atlas pick contract remains.

## Release gates

1. `npm test` passes syntax, formulas, controls and optical-contract guards.
2. All eleven laboratories open in a real browser with no console/shader error,
   stale HUD state, missing tracer, clipping or uncontrolled saturation.
3. Fresh-browser Premium visuals remains Off; every scientific scene is complete
   without the optional cinematic stage or bloom.
4. WebXR and Multiview use the same native geometry; no camera-facing decorative
   plane enters stereo space.
5. Mobile/Quest budgets remain bounded and interactive without changing exact
   calculations, classifications, evidence labels or exports.
