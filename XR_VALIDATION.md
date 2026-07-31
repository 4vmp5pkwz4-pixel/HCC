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

## Manual XR checklist (Quest 3, Meta Quest Browser, HTTPS)

1. Header shows 🥽 VR (and ◈ MR) only on XR-capable browsers.
2. Enter VR: floor-level start, mode-appropriate rig position, CSS2D labels gone,
   wrist Control Observatory floats above the left hand/controller.
3. Ray hover over a panel button highlights it + tick haptic; trigger activates.
4. Point at a planet/screen/shell → cursor sticks; trigger → gold object card with
   rows, formulas (gold monospace), source tags; "Approach" moves the rig.
5. Mode switching via wrist panel keeps session; rig re-seats per mode.
6. FBS3R in VR: N ±1/±10, cycle, → N=266, → S³ R all work; shells clickable.
7. S³ in VR: Section χ ±, Hopf fibres ±/flow, Eigenmode β/m all live.
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
