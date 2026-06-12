# COMPATIBILITY — graceful behaviour per platform

| Platform | 3D app | WebXR VR | WebXR MR | Hands | Haptics | Motion sensors | Notes |
|---|---|---|---|---|---|---|---|
| Desktop Chrome/Edge | ✅ full | ✅ with headset via WebXR | ⚠ device-dependent | n/a | via headset | ❌ | best authoring target |
| Desktop Firefox | ✅ full | ⚠ behind flags/runtime | ❌ | n/a | — | ❌ | flat experience identical |
| Desktop Safari | ✅ full | ❌ | ❌ | n/a | — | ❌ | `XR: unsupported browser` |
| iPhone / iPad Safari | ✅ mobile UI | ❌ (no WebXR) | ❌ | n/a | — | ✅ after `requestPermission` (HTTPS + tap) | 📱 Motion modes replace XR |
| Android Chrome | ✅ mobile UI | ⚠ phone-AR class devices | ⚠ `immersive-ar` on ARCore devices | n/a | — | ✅ (no permission prompt) | gate shows real support |
| **Meta Quest 3 — Quest Browser** | ✅ | ✅ `immersive-vr` | ✅ `immersive-ar` passthrough | ✅ feature-detected | ✅ feature-detected | n/a | primary XR target |
| Any browser, `file://` | ✅ flat | ❌ `XR: HTTPS required` | ❌ | — | — | iOS: ❌ (needs HTTPS) | see QUEST3_START_HERE |

## Degradation rules (all feature-detected, never faked)

- **No WebXR** → XR buttons disabled with the exact reason; flat app untouched.
- **VR yes / MR no** → only 🥽 appears; MR button hidden.
- **No hand tracking** → controller rays only; flag `hands:no` in status panel & exports.
- **No anchors / plane-detection / hit-test** → MR placement degrades to static
  placement in front of the user; flags reported honestly.
- **No haptics** → silent no-op (`hapticActuators` guarded).
- **No motion sensors / permission denied** → “motion sensors unavailable” note;
  touch controls always preserved.
- **Low GPU (phones)** → DPR capped 1.6, quality preset `questBalanced` default;
  in XR the automatic guard steps quality down below ~63 FPS.
- **Old browsers without BigInt/ES2020** → not supported (documented floor:
  Chrome 80+/Safari 14+/Quest Browser current).

## Self-diagnosis order

1. `?xrtest=1` (isolates app vs environment)
2. XR CHECK panel (secure context, navigator.xr, isSessionSupported, errors)
3. `xr_diagnostics.json` export → attach to issue reports
