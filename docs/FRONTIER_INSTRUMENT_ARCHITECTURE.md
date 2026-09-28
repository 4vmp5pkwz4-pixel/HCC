# Frontier Instrument: S³ geometry, agent bridge, and WebGPU path

**Status:** implementation plan; first increment is limited to a pure geometry module and an adapter to the existing Atlas interfaces. Reviewed against `main` at `9dd951c` (2026-09-28).

## Existing system and design choice

The visual application is one large `index.html` using Three.js 0.160, `WebGLRenderer`, many GLSL `ShaderMaterial` instances, a single camera, and headless `?render=0`. `core/atlas/extracted.mjs` is generated from the visual source; `core/` contains independent computational contracts. `HCC_API` owns instrument evaluation, units, domains, provenance, and refusals. `HCC_NAV` owns world/lab navigation and semantic scale layers. `api/agent-client.mjs` already serves a static ESM client, while the self-hosted server has HTTP/MCP tools. A gated WebGPU compute path already exists for selected tasks; its adapter/shader execution remains unmeasured in the repository's headless environment.

Extend these authorities. First add an independent, tested geometry primitive in `core/math/`; export a conditional measurement from the existing static client; wrap `HCC_API` and `HCC_NAV` for a live same-page agent. Do not create a competing scene graph, simulator, or unauthenticated mutation endpoint.

## Geometry and scientific contract

- A spatial round sphere is `S³_R = {q in R⁴: |q|=R}` at a declared epoch. Its R⁴ embedding is **spatial geometry**, not a coordinate chart for four-dimensional spacetime. A cosmological light ray requires a declared spacetime metric and time dependence in addition to this geometry.
- In a dimensionless native frame `q=(a,b,c,d)` with `|q|=1`, the north-pole stereographic chart is `x=(a,b,c)/(1-d)` and its inverse is `q=(2x/(1+|x|²), (|x|²-1)/(1+|x|²))`. The north pole is absent from this chart. The induced metric is `ds²=[2R/(1+|x|²)]² |dx|²` when `x` is dimensionless; physical chart coordinates are `Rx`.
- The native short geodesic is `R · 2 atan2(|p-q|, |p+q|)`. At antipodes its length is well defined but the shortest path is not unique. The Hopf base map for `z₁=a+ib, z₂=c+id` is `(2(ac+bd), 2(bc-ad), a²+b²-c²-d²)`. These formulae do not identify Hopf fibres with physical light trajectories.
- `triProject` currently adds a pole guard and a `tanh` compression to draw the sphere. Those **display** coordinates cannot be fed to the native metric; the first module takes native points and refuses invalid coordinates instead.
- Radius, unit, coordinate frame, source data, model assumptions, and time domain accompany every physical interpretation. Native geometry identities can be exact within the model; numerical residuals and render similarities cannot turn them into empirical confirmation.
- The uploaded `Ω_K=+0.0007 ± 0.0019` is an input estimate compatible with zero. In the standard FLRW convention its central sign denotes negative spatial curvature. `R_c=c/(H₀√|Ω_K|) ≈ 548.3 Gly` describes a *conditional magnitude*; using it for a closed S³ changes the sign assumption. It is neither a detection of closure nor a determination of global topology. The declared `R_n=R_*φ^n` ladder stays a model ansatz until a physical operator and independent observations support it. In one supplied manuscript, `R(t)=ℓ₀φ^{log_φ(ct/ℓ₀)}=ct` algebraically: φ cancels in that expression.

## Entity and component boundary

Use an entity index over the existing lab/object registries. The index stores *identity and typed links*; Three objects are view projections and remain owned by the renderer. Proposed TypeScript interfaces:

```ts
type Evidence = 'OBSERVED' | 'DERIVED' | 'MODEL' | 'HYPOTHESIS';
interface Entity { id: string; worldId: string; labId?: string; kind: string }
interface NativePosition { frame: string; coordinates: readonly number[]; unit: string; epochDomain?: string }
interface MetricBinding { metricId: string; parameters: Readonly<Record<string, number>>; status: Evidence }
interface ClockBinding { domainId: string; adapterId?: string }
interface SourceBinding { datasetId?: string; equationIds: readonly string[]; provenance: readonly string[] }
interface ViewProjection { sceneObjectId?: string; projectionId: string; displayOnly: boolean }
interface KernelBinding { instrumentId: string; inputMap: Readonly<Record<string, string>> }
interface EntitySnapshot { entity: Entity; position?: NativePosition; metric?: MetricBinding;
  clock?: ClockBinding; source?: SourceBinding; view?: ViewProjection; kernel?: KernelBinding }
```

An `EntityStore` reads existing registries into immutable snapshots and rejects duplicate IDs. A `FrameAdapter` resolves explicit coordinate transformations; a `ClockAdapter` uses `core/time/registry.mjs` and refuses undeclared exchanges. A `SceneAdapter` updates Three instances from snapshots but does not supply scientific distances. Migrate one world at a time after proving the new snapshots reproduce its current navigation and selection results.

## Agent API contract

1. **Static:** `connectAtlas()` keeps reading `version.json` and release-matched manifest/reach artifacts. Its pure geometry method receives two native S³ points, an explicit radius and unit, and returns a labelled conditional result. It never needs DOM, WebGL, or server writes.
2. **Live same page:** a small ESM bridge calls `HCC_API.ready`, `HCC_API.report`, `HCC_NAV.find/open/go/layer`, and reads `HCC_NAV.scene()` for the displayed world, laboratory, selection, and scale layer. In Multiview it names the active tile and all visible tiles; `worldId` and `labId` refer to the active tile, while a geometry-fractal tile has no world or lab ID. A global selection is not attributed to a particular tile. The router's `HCC_CTX` may lag direct object/scale operations, so it is not used as a scene snapshot. The bridge checks world/lab IDs before navigation to prevent the existing router's permissive fallback from silently changing a request. Programmatic navigation is a *view change*, not a cosmological computation.
3. **Remote:** the existing self-hosted server remains the only HTTP/MCP computation transport. Any future remote scene mutation needs an authenticated, scoped session with explicit capability discovery and a bounded command budget; the public static site does not advertise one.
4. **Hypothesis records:** candidate ratio comparisons specify quantity kind, units, uncertainty, selection rule, baseline/null, training versus held-out data, multiplicity correction, model dependencies, and a reproducible input digest. The ledger marks mathematical identity, simulation result, and observational fit separately. It never auto-promotes a visual resemblance.

## WebGPU migration gates

| Gate | Work | Acceptance evidence |
| --- | --- | --- |
| 0. Characterize | Inventory GLSL materials, postprocessing, GPU buffers, mobile/XR/headless paths, and current frame time; record device and `requestAdapter()` outcome. | Reproducible baseline and renderer/camera state report on desktop and mobile. |
| 1. GPU compute | For one heavy flow/particle kernel, preserve the current CPU float64 implementation as reference, add a bounded WGSL compute backend behind feature detection, and compare several deterministic seeds. | GPU/CPU residuals and throughput reported separately; device loss returns to CPU; no claimed speedup without real device measurements. |
| 2. Precision and camera | Use a native unit/frame registry, local camera-relative coordinates, split high/low positions if needed, and one owner for near/far planes. Optional WASM multiprecision supports *CPU calculations*, not WGSL f64. | Native geometry checks at tiny angles and antipodes; no visual seams or Z-fighting across Earth → Solar → Galactic → S³, including portrait and XR. |
| 3. Rendering | Upgrade Three in a separate compatibility branch, port one GLSL material to TSL/node materials, compare WebGPU and WebGL2 images, and retain headless mode. Migrate remaining materials incrementally. | Representative scenes, overlays, and picking pass visual and interaction review on both backends. |
| 4. Physical optics | Introduce a specific FLRW/perturbed spacetime, initial conditions, propagation equation, redshift and source/observer frames before implementing lensing or horizon claims. | Reproduces specified analytic/null-geodesic benchmarks and states neglected physics; topological drawings remain labelled schematic. |

WebGPU uses WGSL compute on devices that provide it; shaders do not inherit arbitrary precision from Python/WASM. Three.js documents that `WebGPURenderer` requires migration of existing `ShaderMaterial`/`RawShaderMaterial` and postprocessing. References: [WebGPU specification](https://www.w3.org/TR/webgpu/), [WGSL specification](https://www.w3.org/TR/WGSL/), [Three.js WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer), [Planck 2018 cosmological parameters](https://arxiv.org/abs/1807.06209).

## First increment and follow-through

The first code change adds pure stereographic/Hopf/geodesic operations, labelled `measureS3` access through the static SDK, a live adapter to the existing `HCC_API`/`HCC_NAV`, and TypeScript declarations. Its tests exercise chart round trips, small angles, antipodes, invalid inputs, conditional provenance, and strict navigation. Next increments: registry-backed entity snapshots; typed frames/clocks and cross-scale ratio protocol; one measured GPU compute kernel; a separate renderer migration; physically specified spacetime optics. Each increment has a CPU/reference comparison and a distinct numerical, visual, and scientific acceptance gate.
