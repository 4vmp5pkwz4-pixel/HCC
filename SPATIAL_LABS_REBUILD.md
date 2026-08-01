# Native Spatial Rebuild — Five Observatory Audit

## Scope and attribution

Repository history identifies exactly five late-added laboratories in this
rebuild scope:

| Laboratory | Introduction | Rebuild objective |
|---|---:|---|
| Invariant Nexus | PR #4, `d0e1920` | Turn a flat network diagram into a navigable six-volume relation universe with typed conduits and an eight-axis epistemic tensor. |
| Symmetry Discovery Chamber | PR #5, `544f321` | Replace residual bars with native group-action manifolds and candidate braids whose separation encodes drift. |
| Holonomy Observatory | PR #6, `2939984` | Put phase on the journey itself: transported frames, curvature-flux surfaces and co-located return vectors replace the detached dial. |
| Contact & Action Observatory | PR #7, `c757fa9` | Render contact planes, energy shells, Poincare sections, KS throats and Maslov caustics as the experiment's actual space. |
| Spinor & Light-Cone Observatory | PR #8, `92a8748` | Make the CP1 sphere, double light cone, celestial map, null tetrad and conformal diamond the primary visual objects. |

The optional global cinematic stage introduced later is not part of these
scientific scenes and remains disabled by default.

## Rendering architecture

The implementation stays on the project's Three.js r160 WebGL2 renderer. A
WebGPU rewrite would require simultaneous migration of custom shader materials,
post-processing and XR assumptions; the current Three.js WebGPU guidance still
describes that renderer as experimental and recommends WebGLRenderer for
WebGL2-only applications. The rebuild therefore upgrades the geometry and GPU
data path without destabilizing the single-file, WebXR-capable application.

Primary techniques:

- [`TubeGeometry`](https://threejs.org/docs/pages/TubeGeometry.html) gives paths
  true depth and stereo parallax instead of one-pixel line width.
- [`ShaderMaterial`](https://threejs.org/docs/pages/ShaderMaterial.html) renders
  Fresnel/filament surfaces for manifolds, cones, shells and curvature volumes.
- [`InstancedMesh`](https://threejs.org/docs/pages/InstancedMesh.html) carries
  flow particles and sampled plane fields with one draw-call family per field.
- custom [`BufferGeometry`](https://threejs.org/docs/pages/BufferGeometry.html)
  builds phase ribbons and parametric surfaces from deterministic model output.

The shared core sanitizes non-finite and repeated curve points, degrades a
degenerate closed curve safely to an open segment, supports instanced shader
transforms, respects logarithmic depth and bounds repeated-particle counts on
mobile hardware. Outside Multiview, station-based observatories release their
geometry, shader materials, render-list references and CSS2D labels as soon as
another laboratory becomes active; the lightweight persistent Atlas pick volume
is retained. This prevents a tour through all stations from accumulating every
high-density scene on the GPU.
At viewports 760 px wide or narrower, a station-specific camera envelope moves
the five scenes back without changing their model coordinates, keeping the full
manifold framed behind the mobile controls.

## Scientific visual grammar

| Model quantity | Spatial encoding | Explicit limitation |
|---|---|---|
| trajectory / orbit | volumetric tube plus directed instanced flow | thickness and particle speed are illustrative |
| phase / holonomy | braid or ribbon twist around the native path | twist visualizes an already computed phase; it does not measure it |
| invariant residual | candidate filament remains welded or peels away | separation is monotonic display mapping, not a physical distance |
| parallel/contact frame | sparse oriented plane field | plane size and sampling density are interface choices |
| integrated curvature / solid angle | translucent bounded parametric surface | opacity is not curvature magnitude |
| null/conformal structure | cone, celestial sphere, tetrad or nested diamond | Euclidean scene distance is not a Minkowski interval |
| typed laboratory relation | colored volumetric conduit through domain volumes | graph distance remains non-metric and non-causal unless typed causal |

Every numerical invariant, tolerance and export is evaluated before this visual
projection. Visual quality controls never alter solver steps, sample counts or
epistemic status.

## Station-specific scene language

- **Symmetry:** SO(3) sphere and axis; Lorentz hyperbolic sheet and asymptotes;
  U(1) torus/fibres; symplectic vortex and plane field; Riemann sphere and
  Möbius trajectories.
- **Holonomy:** round-sphere curvature cap; Berry sphere; SU(2) three-ball and
  non-Abelian knot; hyperbolic Wigner disk; Riemann-sphere monodromy. Start and
  returned directions share one base point so their difference cannot be
  mistaken for a remote dashboard gauge.
- **Contact & Action:** S3 contact shell, ellipsoid plus embedded Poincare
  section, Legendrian paths, KS regularization throat and two-sheet Maslov
  caustic. Dense return paths use a bounded exposure profile rather than
  saturating the frame.
- **Spinor & Light Cone:** CP1 sphere connected to a double future-null cone;
  original/transformed Lorentz cones; paired celestial spheres; tetrad sky
  volume; nested conformal diamonds.
- **Nexus:** six translucent disciplinary volumes, crystal node/cage pairs,
  volumetric typed conduits, path flow and a central eight-direction relation
  tensor. The invariant-layout morph remains a deterministic analytic
  projection, not an evidence ranking.

## Release gates

1. `npm run validate` must pass syntax, scientific contracts, control wiring and
   the spatial-core guards.
2. Every station is opened in a live browser and checked for shader errors,
   non-finite curves, overexposure, clipping and stale HUD state.
   A 25-transition stress tour must finish without WebGL context loss.
3. Fresh-browser Premium visuals remains Off; the native scientific scene must
   be complete without the optional stage.
4. Multiview and WebXR use the same native geometry. The camera-facing cinematic
   stage stays excluded from both.
5. Quest/mobile testing must confirm that bounded particle counts maintain input
   responsiveness without changing scientific samples or exports.
