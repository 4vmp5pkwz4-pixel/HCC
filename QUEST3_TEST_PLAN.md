# QUEST3_TEST_PLAN — S³ LIGHT-TRISPHERE / FBS3R WebXR

Device: Meta Quest 3 · Meta Quest Browser (Horizon OS current) · app served over
**HTTPS** (WebXR requirement; `python3 -m http.server` is fine only via a TLS
tunnel or local cert). Companion docs: `XR_VALIDATION.md`, `VALIDATION.md`.

## 0 · Regression first (flat targets)

- [ ] Desktop Chrome/Firefox: all seven modes, selection, landing, exports, themes.
- [ ] Android/iOS phone: bottom sheets, pinch, safe-area, ⚙/ⓘ toggles, clock.
- [ ] `node scripts/validate.mjs` → ALL CHECKS PASSED.

## 1 · Session lifecycle

| # | Step | Expected |
|---|---|---|
| 1.1 | Load page in Quest Browser | 🥽 VR visible; ◈ MR visible (Quest 3 supports immersive-ar) |
| 1.2 | Tap 🥽 VR | Headset prompt → session starts at floor level, 90 Hz requested (status panel shows target Hz) |
| 1.3 | Remove headset 10 s, put back | Session resumes, no crash, clocks correct |
| 1.4 | Tap wrist ✕ Exit XR | Flat app restored, header buttons read 🥽 VR / ◈ MR |
| 1.5 | Tap ◈ MR | Passthrough, no skydome, tabletop model, reticle on floor/desk |
| 1.6 | Deny MR permission | Graceful message, app stays flat — no hard fail |

## 2 · Controllers

- [ ] Models render for both Touch Plus controllers; rays gold; cursors visible.
- [ ] Trigger on panel button → action + 40 ms haptic tick.
- [ ] Trigger on Mercury…Pluto, Moon, Sun, screens, S³ items, φ-shells, instruments → card.
- [ ] Squeeze on a panel → panel rides the controller; release → stays in place.
- [ ] Both squeezes in space → universe grab (move/scale 0.05–20×/yaw).
- [ ] Left stick fly (vignette on), right stick X snap (15/30/45 from panel), right stick Y vertical.
- [ ] Trigger in empty space → blink teleport to cursor; no smooth auto-motion ever.

## 3 · Hands

- [ ] Set controllers down → hand meshes appear (feature flag hands=yes).
- [ ] Index-ray points; pinch = select on panels and objects.
- [ ] Wrist menu follows left wrist; readable at arm's length.
- [ ] Pinch-drag a grabbed panel; release stable.
- [ ] System palm-pinch (Meta reserved) still opens OS menu — we do not intercept it.
- [ ] Pick controllers back up → instant fallback to controller rays.

## 4 · Science interactions in VR

- [ ] Solar: time ±, pause, today, true scale, "Next eclipse" jump → syzygy line visible at human scale after two-hand zoom-in.
- [ ] Cycles: instruments readable; grab-scale the trio; cards show live galactic year/age.
- [ ] Observable: stand inside the 46 Gly ball (rig at centre); screens selectable.
- [ ] S³: χ ± live A(χ)/Γ(χ) on the card; Hopf flow beads at 72+ FPS at default density; eigenmode β/m repaint <150 ms.
- [ ] S³ Spinor & Light Cone: all five stations render in stereo; ray/pinch selection opens the native-space scope contract; sphere/cone/frame/diamond geometry, hairline null paths, sharp moving crystal and phase-fibre braid remain finite; station changes through the flat control sheet persist into XR; no Multiview button is offered inside XR.
- [ ] Optical reconstruction smoke route: open Nexus → DRD → Chromodynamics → Neutron Star → Supernova → Pulsar → Quasar. Hairlines remain stereo-stable, one motion tracer stays readable per active process, translucent shells never saturate either eye, and no presentation chart or camera-facing panel enters world space.
- [ ] Quasar GPU accretion and Supernova ejecta stay within the mobile point budgets; switching repeatedly among the eleven reconstructed laboratories does not accumulate geometry or lose the WebGL context.
- [ ] S³ Holonomy: all five stations render in stereo; ray/pinch selection opens the scope contract; moving crystal, path braid, sampled transported frames, flux surface and co-located return vectors remain finite; no Multiview button is offered inside XR.
- [ ] S³ Contact & Action: all five stations render in stereo; ray/pinch selection opens the native-dimension scope contract; both projected paths, moving crystal, contact-plane field and S³/ellipsoid/KS/caustic volumes remain finite; no Multiview button is offered inside XR.
- [ ] S³ Symmetry Discovery: all five native manifolds and four residual braids render in stereo; symmetry breaking separates the coral orbit without changing the finite-scan contract.
- [ ] S³ Invariant Nexus: crystal nodes, six translucent domain volumes, typed tube conduits, instanced relation flow and the eight-axis tensor remain depth-readable and selectable in both eyes.
- [ ] FBS3R: walk the ladder with N ±1 (each step ×φ — "φ-Ladder Walk"); N=266 chip = Recombination Gate; S³ R chip = Light-Trisphere Closure (N≈299.1); re-quantization wave visible; shells selectable with density/Fibonacci rows.
- [ ] Fractal Explorer: hidden from XR menu; entering VR while in fractal auto-switches to Solar with a clear reason in docs.

## 5 · MR specifics

- [ ] Reticle tracks floor & desk planes (hit-test granted).
- [ ] Trigger places active model at reticle; model is tabletop-sized.
- [ ] With anchors granted: walk around — model pinned to room (anchor pose each frame).
- [ ] Without anchors (older OS): placement still works statically; capabilities JSON reports anchors:false.
- [ ] Exit MR → sky restored, original scales restored exactly.

## 6 · Performance & comfort

Budget: ≥72 FPS sustained, 90 preferred; no frame-time spikes >20 ms during mode switch.

- [ ] Status panel FPS ≥ 72 in: Solar default, S³ Hopf default, FBS3R mid-ladder, Cycles.
- [ ] Status panel FPS ≥ 72 while sweeping Nexus, dense ellipsoid return, SU(2) holonomy and conformal diamond; mobile/Quest particle budgets reduce repeated marks without changing solver samples or exports.
- [ ] Force heavy state (Hopf ×3 density + Ultra): auto-downgrade fires within ~3–6 s.
- [ ] Foveation visibly changes per preset (Safe=1 … Cinematic=0).
- [ ] No nausea triggers: no auto camera animation, vignette during motion, snap turn default 30°.
- [ ] Text on panels legible at 1–2 m (24 px serif titles / 19 px UI on 760-px canvases).
- [ ] Flat-screen precision stage and bloom composer are absent from both eyes; every native laboratory model remains present and stereo-correct.

## 7 · Exports & audit

- [ ] Wrist Status → Export capabilities JSON: includes enabledFeatures, frame rates, hands/anchors/hit-test flags, quality, hashes, disclaimer.
- [ ] Info panel: formula_registry.json, source_registry.json, validation_report.json (all current self-tests pass), state.json + CSV from FBS3R panel.
- [ ] Every export contains ISO timestamp, version, registry hashes, "not a topology detection" disclaimer.

## 8 · Honesty audit

- [ ] No UI text implies camera access, eye tracking, body tracking, or scene-mesh APIs.
- [ ] Unsupported features show "no" in the status panel, never fake data.
- [ ] All discipline phrases present: conditional reconstruction · model visualization · published FBS3R relation · source-tagged formula · not a topology detection · not a ΛCDM replacement unless explicitly tested.
