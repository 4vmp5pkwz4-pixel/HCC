# XR_VALIDATION — WebXR layer (Meta Quest 3)

Companion to `VALIDATION.md`. Automated XR checks live in `scripts/validate.mjs`
(§10; the exact PASS count is emitted by the current validator). This file is the **manual** XR checklist plus the
honest capability matrix.

## Capability matrix (what is real vs. not exposed)

| Capability | Status in this app | Mechanism |
|---|---|---|
| Immersive VR (6DoF) | ✅ implemented | `immersive-vr`, `local-floor` (fallback `local`) |
| Immersive MR / passthrough | ✅ implemented | `immersive-ar`, transparent clear, `scene.background = null` |
| Touch controller rays/select/squeeze | ✅ | `getController(0/1)`, `selectstart`, `squeezestart` |
| Controller models | ✅ | `XRControllerModelFactory` on grips |
| Haptics | ✅ feature-detected | `gamepad.hapticActuators[0].pulse` |
| Smooth fly + vertical + snap turn 15/30/45° | ✅ | thumbstick axes, head-relative |
| Blink teleport | ✅ | trigger in open space → cursor point |
| Two-hand grab: move/scale/rotate universe | ✅ | both squeezes; scales active mode group 0.05–20× |
| Hand tracking + pinch select | ✅ feature-detected | `XRHandModelFactory`, `pinchstart`, index-ray |
| Wrist menu (Control Observatory) | ✅ | canvas panel lerping to left grip/wrist joint |
| In-world data cards/formulas/provenance | ✅ | `XRPanel` CanvasTexture panels, grabbable (squeeze), billboard |
| MR hit-test reticle + tap-to-place | ✅ feature-detected | viewer-space `requestHitTestSource` |
| MR anchors | ✅ feature-detected | `XRHitTestResult.createAnchor`, per-frame anchor pose |
| Plane detection | ⚠ requested, used only via hit-test | `plane-detection` in optionalFeatures; no plane mesh rendering |
| Fixed foveated rendering | ✅ | `renderer.xr.setFoveation(0–1)` per quality preset |
| Target frame rate 72/90 | ✅ feature-detected | `session.updateTargetFrameRate` + `supportedFrameRates` |
| Framebuffer scale | ✅ (next session) | `setFramebufferScaleFactor` — WebXR cannot change it mid-session |
| WebXR Layers | ⚠ requested, not used | granted flag exported; three.js r160 has no stable layers path |
| Multiview rendering | ❌ not exposed by three.js | documented limitation |
| Raw camera pixels | ❌ not exposed by WebXR | **never faked** — passthrough is compositor-only |
| System keyboard | ⚠ DOM overlay only (AR) | `dom-overlay` requested; VR text entry uses panel buttons |
| KTX2/Basis textures | n/a | app has zero asset textures (all procedural canvases) |
| Fractal Explorer in XR | ❌ excluded by design | fullscreen mono raymarch is not stereo-safe; auto-switches to Solar |
| Flat-screen cinematic precision stage | ✅ intentionally excluded | one camera-facing plane is invalid for stereo eyes; native laboratory geometry remains |

## Emulated-headset audit (v4.315)

`node scripts/xr-audit.mjs` drives the atlas in IWER's emulated **Meta Quest 3** (IWER 2.5,
MIT; looked for in `vendor/iwer/`, `node_modules/iwer/build/` or `HCC_IWER`) through every
world, opens the object card, Status, Controls, Measure and Debug windows at once, and writes
every visible panel as an angular rectangle about the head to `docs/xr-audit.json`.
`docs/verify-the-headset-is-usable.cjs` recomputes the overlaps from those rectangles.

What the audit found, and what changed:

| Defect | Measured | Now |
|---|---|---|
| Ghost panels ("panels stick together") | a canvas that changed height kept its first GPU texture; the old layout showed under the new one | a new size is a new texture |
| Overlapping windows | card × status, controls × debug overlapped in the arc | one content window, the others on a tab strip — 0 overlaps in every world |
| Illegible text | body text ≈ 0.5° (0.5 m panels at 1.27 m) | ≈ 1.1–1.2° (0.9–1.0 m windows at 1.1 m) |
| Solar System | reader 40 m from the Sun (1 AU = 1 m), Earth a 2.6-cm ball | an orrery: 1 AU = 2 m (Inner), 0.22 m (Outer), 0.1 m (Kuiper); Sun 3.4 m ahead at waist height; guides larger than the room hidden; planets named |
| Mode switching | the old world's card and selection stayed; the orrery leaked | card closes, Controls/Status re-read, orrery restored on leaving Solar and on session end |
| Field Lab in VR | Controls offered the soliton labs | its own deck: eight equations, presets, run, structure, slice, SOR, T_c |
| Wrist menu | ragged rows, an unrenderable ⏸ glyph | a four-cell grid with section headers (Worlds · Time · Orrery · Tools · Session) |

The emulator measures geometry in the reader's frame; it has no lenses, comfort or real
hands, so the manual checklist below still applies on a device.

## Manual XR checklist (Quest 3, Meta Quest Browser, HTTPS)

1. Header shows 🥽 VR (and ◈ MR) only on XR-capable browsers.
2. Enter VR: floor-level start, mode-appropriate rig position, CSS2D labels and
   flat-screen cinematic stage gone; wrist Control Observatory floats above the
   left hand/controller.
3. Ray hover over a panel button highlights it + tick haptic; trigger activates.
4. Point at a planet/screen/shell → cursor sticks; trigger → gold object card with
   rows, formulas (gold monospace), source tags; "Approach" moves the rig.
5. Mode switching via wrist panel keeps session; rig re-seats per mode.
6. FBS3R in VR: N ±1/±10, cycle, → N=266, → S³ R all work; shells clickable.
7. S³ in VR: Section χ ±, Hopf fibres ±/flow, Eigenmode β/m all live.
   Invariant Nexus renders as a stereo 3D relation universe; controller ray or
   hand pinch selects individual laboratory nodes and opens their typed,
   non-metric contract. Spinor & Light-Cone Observatory renders its spinor
   sphere, null cone, Lorentz/celestial frames, null tetrad and radial conformal
   diamond in stereo; its persistent volume opens the five-station native-space
   contract, while station switching continues through the ordinary S³
   controls. Holonomy Observatory renders its ordered closed path,
   transported crystal, sampled frame field, curvature-flux surface and
   co-located return vectors in stereo; its persistent laboratory volume opens
   the five-station scope contract. Contact & Action renders its
   Reeb/return/Legendrian/KS/Maslov paths, moving crystal, contact-plane field
   and S³/ellipsoid/KS/caustic volumes in stereo; the persistent laboratory
   volume opens the five-station native-dimension contract. Symmetry Discovery
   renders its five native manifolds, exact/broken orbits and four finite
   residual braids; the laboratory volume is ray/pinch selectable and
   its card states the non-theorem, non-exhaustive contract. Multiview comparison,
   including the Spinor & Light-Cone exact-neighbour preset, remains flat-screen
   only.
8. Left stick flies (vignette appears), right stick X snap-turns (angle cycles
   15/30/45), right stick Y ascends/descends; trigger in empty space blink-teleports.
9. Both grips squeezed: universe follows hands — move/scale/rotate; release keeps.
10. Drop controllers, raise hands: hand meshes appear, index-ray points, pinch
    selects, wrist menu follows the wrist joint.
11. Status panel: live FPS/frame-time/draw-calls/tris, quality, foveation, target Hz,
    XR flags, discipline disclaimer; "Export capabilities JSON" downloads.
12. Enter MR: passthrough visible (sky/starfields hidden), active model tabletop-
    scaled at ~1.2 m; reticle rides real surfaces; trigger places; with anchors
    granted the model sticks to the room across head motion.
13. Exit XR (panel ✕ or header button): flat app restored exactly (camera framing,
    sky, scales, labels).
14. Performance guard: hold a heavy view; if FPS dips below ~63 for 3 s quality
    steps down one preset automatically (status panel shows it).

## Known limitations (honest)

- Logarithmic depth buffer costs some Quest GPU headroom (disables early-Z);
  mitigated by foveation + presets + dynamic guard.
- Landing (first-person surface) remains a flat-screen feature; in VR use
  Approach + grab-scale (avoids vection sickness from planet rotation).
- Lunar ephemeris ~0.1–0.3°: MR/VR syzygy line is approximate geometry;
  eclipse instants come from the NASA Canon catalogue.
- Anchors persistence across sessions is not implemented (session-scoped only).
