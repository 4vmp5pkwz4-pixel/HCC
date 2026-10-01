# Visual kernel modernization

The user supplied a four-part modernization profile for HCC 4.351.0 at
05264229fc972113fae998755000ed83a3681f61 and selected audit and implementation.
The goal is correct, reusable compute and projection code integrated into the
existing atlas, with evidence distinguishing arithmetic, GPU execution and timing.

## Architecture

- Keep Three.js 0.160 WebGL rendering and its existing XR fallback. A WebGPU
  storage buffer cannot be consumed as a WebGL texture or vertex buffer.
- Replace `hadwigerGpuCompare` allocations with a bounded persistent reducer:
  triangle stage, one strided final workgroup covering every partial, separate
  result storage and three asynchronous staging slots. Reject saturation
  explicitly. The CPU result remains authoritative; GPU covers V2/V3 only.
- Add a reusable restricted test-particle WebGPU engine: interleaved 32-byte
  states, two persistent state buffers, 64-byte uniforms, count at byte 48,
  kick-drift-kick velocity Verlet with frozen perturbers per step. Submit each
  parameter write with its own dispatch to preserve queue ordering. AU/yr is
  used by atlas diagnostics; no mutual gravity or ephemeris improvement claimed.
- Expose an explicit QA operation that executes and compares this engine.
  Do not force per-frame GPU-to-CPU-to-WebGL copies into the live swarm.
- Offer compact and stereographic trisphere display modes. Exact mode uses
  x=R q_xyz/(1-q_w), excludes the display cap 1-q_w<=1e-6, and uses the same
  rotation/projection for labels, picking and vertices. Native metric functions
  retain their existing pole refusal and remain separate from scene coordinates.
- Add pure Spin(4) rotation and stereographic tangent differential, plus an
  optional OVR multiview shader using two ambient 4D surface tangents for normals.
  Capability detection is not a completed XR multiview renderer or a speed claim.
- Keep Schwarzschild ray limits/quality and physical units. Guard horizon crossing
  before the second acceleration, use defined ascending smoothstep edges and
  remove misleading global symplectic claims for variable step lengths. Do not
  replace conditional emission with singular computations masked by zero.

## Acceptance

Mesh sizes above 4096 triangles and shrinking counts produce complete results;
concurrent requests preserve parameter snapshots; exhaustion, device loss and
destroy release resources. Verlet has second-order convergence and reverses a
fixed-step frozen-potential trajectory. Spin(4) preserves distances; the tangent
differential agrees with finite differences and the round conformal metric.
Headless/GPU-unavailable boot still works. Real shader execution is exercised
when an adapter exists and its backend is identified. No target-GPU timings,
register counts, occupancy or headset gains are inferred from software execution.
