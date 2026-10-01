# Visual kernel audit and implementation

Base: HCC 4.351.0, build the-merger-finds-you-2026.10.01.68,
commit 05264229fc972113fae998755000ed83a3681f61. Audit dated 2026-10-01.

## Findings in the supplied proposal

| Item | Finding |
| --- | --- |
| Asteroid uniforms | The WGSL structure occupies 64 bytes, not 48. `particleCount` is at byte 48, Uint32 index 12. Writing index 6 overwrites Jupiter z. |
| Asteroid integrator | `v += a dt; x += v dt` is first-order symplectic Euler. Velocity Verlet needs a second acceleration evaluation at the new position. |
| N-body description | These are massless test particles in prescribed Sun/Jupiter/Saturn fields, with no mutual particle gravity. |
| Final mesh reduction | One group reading one partial per lane includes only the first 64 blocks. A 100k-triangle mesh needs 1563 blocks. |
| Mesh capacity | `arrayLength` describes bound capacity, not the live count. Reusing buffers requires explicit counts to exclude old tails. |
| Automatic bind layout | Stage 2 does not use `triangles`; an automatically derived layout need not include binding 0. Passing that unused binding can invalidate the bind group. |
| Readback | `mapAsync` is asynchronous. Awaiting it delays the caller's result, not the JavaScript main thread. The supplied engine has one staging buffer, not a readback ring. |
| Resource claims | Buffer reuse removes steady-state GPUBuffer creation. Command encoders, command buffers, promises and result objects still have lifetimes; total zero JavaScript allocation is not established. |
| S³ display | Compact tanh compression is not conformal. The existing core already has a strict native chart and round metric. Display coordinates must not be used as metric coordinates. |
| S³ normal | Normalizing a normal multiplied by a positive scalar leaves its direction unchanged. Transform two ambient 4D surface tangents through the rotation and projection differential, then cross them. |
| Spin(4) | A general left/right pair is an SO(4) rotation; purely left or purely right multiplication is isoclinic. Quaternions in the new public math helpers use xyzw, scalar last. |
| Ray masking | Multiplication by a zero disk mask does not repair NaN from singular intermediate expressions. `step(0,-y_old*y_new)` also counts coplanar segments as crossings. The proposed shader retains several divergent exits. |
| Lensing cutoff | A bounding sphere is a finite-domain approximation. Schwarzschild deflection does not vanish identically outside 35 Rs. |
| Timing/occupancy | The supplied 0.06/0.18 ms, 82 FPS, exact 50% XR gain and register/occupancy figures have no attached measurements or device/compiler evidence. |

For dimensional chart coordinates X=R q_xyz/(1-q_w), the metric is
`ds²=[2/(1+|X|²/R²)]² |dX|²`. For dimensionless x=X/R it is
`ds²=[2R/(1+|x|²)]² |dx|²`. The excluded north pole is a chart property.

## Implemented behavior

`hadwigerGpuCompare` now uses a persistent 131072-triangle capacity, two compute
stages, a separate final output and three 16-byte staging slots. The final
workgroup loops over all partials. Bounds/capacity and ring saturation fail
explicitly and keep the CPU fallback. V0/V1 remain on the CPU.
Pending engine creation is tied to its device owner. A lost-device result is
destroyed without repopulating either diagnostic cache; fresh requests can recover.

The reusable asteroid engine uses two state buffers, 64-byte uniforms and
velocity Verlet. A step submits its own parameter write and dispatch, preventing
several pending dispatches from reading the last uniform snapshot. Perturbers
are frozen within each step; softening squared is explicitly 1e-8 in position
units squared. `FBS3R_QA.asteroidsGpu({count,steps,dt})` compares actual execution
against a float64 reference using AU and years. The diagnostic is bounded to
count 1..65536, steps 0..1024 and |dt|<=0.01 yr.

At 65536 particles, state/uniform storage is 4194368 bytes (4 MiB + 64 bytes).
An explicit snapshot adds 2097152 bytes; no snapshot is forced into the animation
loop. The existing live WebGL asteroid swarm retains its declared semi-implicit
Euler texture backend. WebGPU storage cannot directly become a WebGL texture;
native WebGPU rendering is a separate migration, as is diffusion rendering.

The trisphere offers Compact display and Stereographic chart in EN/RU/DE. Vertex
projection, picking and labels use the selected map. Exact display clips
1-q_w<=1e-6; the native mathematical chart keeps its pole refusal. An optional
OVR multiview shader uses projected 4D tangents for normals, and capability
inspection explicitly reports rendererIntegrated=false. The Three.js/XR
compositor still uses its existing path.

Both existing Schwarzschild shaders now capture a horizon crossing on the last
permitted step before evaluating another force. Their descending smoothsteps
were replaced with defined ascending-edge complements. They retain their
existing quality bounds, background, disk gates, alpha and output encoding.
Variable step lengths are no longer described as globally symplectic.

## Verification

- `npm run test:source`: all 155 source/verifier jobs passed, including agent tests.
- Pure geometry/layout/orbit tests: 9 passed; two device-loss integration
  regressions passed after reproducing the stale-cache failures; agent suite: 30 passed.
- Actual WGSL: native Dawn, Google SwiftShader driver 5.0.0; reduction tested at
  100000, 8193, 65, 1 and 0 triangles, concurrent requests, saturation and destroy.
  Steady reductions keep GPUBuffer creation at 7 total; orbital steps create no
  new GPUBuffer. Mesh packing is tested against a closed cube.
- Actual WebGL2: both black-hole horizon regressions were observed failing before
  the fix and passed afterwards. The S³ OVR shader rendered the correct tangent
  normal into both array layers in one multiview draw. All six shader checks pass.
- Headless atlas: projection change handlers and CPU/no-device diagnostics tested
  at 390x844. This is not a rendered scene or headset validation.
- Extracted kernel drift guard passes after regeneration.

The Chromium test browser supplies no WebGPU adapter. Native software dispatch
is evidence of shader execution and arithmetic, not target-device speed or VRAM
behavior. No hardware FPS, GPU timestamp benchmark or headset compositor gain
was measured. The original performance figures remain unverified.

Commands: `npm run test:visual`, `npm run test:shaders`,
`npm run test:visual:browser`, `npm run test:gpu`, `npm run test:gpu:native`.
The native harness accepts HCC_DAWN_MODULE and Vulkan VK_ICD_FILENAMES for a local
Dawn installation. HCC_REQUIRE_GPU=1 makes absence/failure fatal in either GPU
harness. Pure checks run through the ordinary CI verifier router.

References: [WGSL layout](https://www.w3.org/TR/WGSL/#alignment-and-size),
[WebGPU mapping](https://www.w3.org/TR/webgpu/#dom-gpubuffer-mapasync),
[OVR multiview](https://registry.khronos.org/webgl/extensions/OVR_multiview2/),
[smoothstep](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml).
