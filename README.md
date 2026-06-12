# S³ LIGHT-TRISPHERE — Interactive 3D Universe Model

A rigorous, source-auditable, fully interactive 3D explorer for the **Solar System**,
the **compact S³ Light-Trisphere universe** (Preece & Batenin 2026, v38
"light sphere screens") and the **FB(S³)R golden-ratio fractal ladder**
(Preece & Batenin 2025). One self-contained `index.html`, desktop **and**
smartphone, fully in English, with per-object formula provenance.

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

**Desktop:** drag = orbit · wheel = zoom · right-drag = pan · Esc = leave surface/deselect.
**Mobile:** 1 finger orbit · 2-finger pinch zoom (φ-ladder depth in FBS3R, FOV when landed) ·
⚙/ⓘ bottom-sheet panels · horizontal mode row · iOS safe-area aware · DPR capped for stable FPS.

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
Explorer is excluded from XR (fullscreen mono raymarch is not stereo-safe).

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

## The six modes

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
Three sub-laboratories:
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
  (Planck → proton → atom → human → Earth → AU → ly → galaxy → recombination
  N=266 → particle horizon → S³ radius);
- **exact-N input** and **physical-length input** with units fm/nm/mm/cm/m/km/AU/ly/Gly
  via N(L) = ln(L/l_P)/ln φ;
- endless-zoom nested φ-shells (clickable), golden spiral, re-quantization wave,
  continuous-cyclicity animation, phase indicator (fractal φ-phase ≤ 266 <
  exponential H-phase), familiar-scale comparator;
- **live formula matrix** and **exports**: app-state **JSON** and the full
  313-row φ-ladder benchmark **CSV**.

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
ρ(N)/ρ_P = φ⁻³ᴺ        F_N ≈ φᴺ/√5             N(t_rec) = 266
```

## Source / provenance policy

All constants live in tagged blocks (`S3`, `FBS`, `SOURCE_MAP`, planetary
elements, lunar theory, eclipse catalogue) and every selection card shows its
source tags — hover for the full citation: **S3-v38**, **FBS3R**, **JPL-approx**,
**Meeus**, **CODATA**, **IAU**, **NASA-Canon**, **astro-std**, **derived**.
Accuracy envelopes are disclosed in `VALIDATION.md`. The app never presents the
S³ topology or the FBS3R ladder as detected facts.

## Validation

```bash
node scripts/validate.mjs     # 161 automated checks — see VALIDATION.md
```

## FBS3R web sources

[figshare 28631525](https://figshare.com/articles/preprint/_sup_strong_Fractal_Bindu_S3_of_Reality_The_Golden_Ratio_as_the_Principle_of_Perfection_and_Harmony_in_Interdependent_Existence_strong_sup_/28631525) ·
[PhilArchive PREFBS](https://philarchive.org/archive/PREFBS) ·
[PhilArchive PREFAC-3](https://philarchive.org/rec/PREFAC-3) ·
[OSF vdfwh](https://osf.io/preprints/osf/vdfwh_v2)

## Technology

Three.js r160 (WebGL2, OrbitControls, CSS2DRenderer, logarithmic depth, GLSL
raymarching), Cinzel + Manrope, one self-contained HTML file, no build step.
