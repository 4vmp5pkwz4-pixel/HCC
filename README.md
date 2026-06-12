# S³ LIGHT-TRISPHERE — Interactive 3D Universe Model

An interactive, fully three-dimensional model of the **Solar System** and of the
**Universe as a compact three-sphere carrier S³_R**, built in exact accordance with
the article *“Conditional Reconstruction of a Quasi-Local Observable Domain within
Compact S³ Geometry”* (Preece & Batenin, v38, “light sphere screens”) and the
companion **FB(S³)R — Fractal Bindu (S³) of Reality** model by the same authors.

**Works on desktop and smartphones** (responsive layout, touch orbit/pinch
gestures, bottom-sheet panels). Fully in English.

## Run

Open `index.html` in any modern browser (internet access needed for the Three.js
CDN). No build step:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

Desktop: drag = rotate, wheel = zoom, right-drag = pan.
Mobile: 1 finger = rotate, 2 fingers = pinch zoom; ⚙/ⓘ buttons open panels.

## Interactivity (all modes)

- **Every object is selectable** — tap/click its 3D body or its floating name.
  A live data card shows its parameters, updated in real time.
- **Focus** — the camera flies to and then follows any selected object.
- **Land** (planets) — first-person view from the planet's surface: drag to look
  around, scroll/pinch to zoom (FOV). The sky auto-switches to true scale, so the
  Sun appears at its real angular diameter (0.53° from Earth) and other planets
  become realistic dots of light. Esc / 🚀 to leave.
- **Clock** — real UTC time plus the simulation clock of the active mode.

## Five modes

### ☀ Solar System (1 unit = 1 AU)
8 planets + Pluto on **exact Keplerian orbits** (J2000 elements from JPL
approximate ephemerides; Kepler's equation solved by Newton iteration), time
control from days/s to millennia/s, asteroid belt, Saturn's rings, true-scale
toggle — the honest proportion demo of locally Euclidean physics (U ⊂ S³_R, U ≃ ℝ³).

### ◯ Observable Universe (1 unit = 1 Gly)
The article's invariant **light-sphere screens** S²_χ(p): the light-age sphere
ct₀ = 13.788 Gly, the last-scattering screen S²_LSS, and the particle-horizon
screen S²_ph = 46.125 Gly, with clustered large-scale structure inside the
geodesic ball B³_χ(p). Screens are reconstruction boundaries, never cosmic
edges: ∂S³_R = ∅.

### ⬡ Global S³ Carrier (1 unit = 100 Gly)
Great 2-sphere section of the compact carrier with R = 548.324513026856 Gly:
the observable Universe as a 4.82° cap (Γ_obs = 0.0126 %), interactive screen
S²_χ with the exact laws A(χ) = 4πR²sin²χ and Γ(χ) = (χ − ½sin 2χ)/π
(“boundary without boundary”), a photon circling the great circle
C = 2πR = 3445.2 Gly with the causal-accessibility counter Γ(T) and
t_coh = πR/c = 1722.6 Gyr, and the **Hopf fibration** S¹ ↪ S³ → S² in
stereographic projection.

### φ FBS3R Levels — fractal-level transitions
Interactive 3D visualization of the **FB(S³)R golden-ratio ladder**, using the
published relations verbatim:

| FBS3R relation | Value / law |
|---|---|
| Ladder law | **R(N) = l_P · φᴺ** |
| Seed (N = 0) | l_P = 1.616×10⁻³⁵ m, t_P = 5.39×10⁻⁴⁴ s |
| Recombination anchor | **N(t_rec) = 266** (t ≈ 380,000 yr) |
| Density law | **ρ ∝ V⁻¹ ∝ φ⁻³ᴺ** (fixed energy budget) |
| Energy quantization | **Eₙ ∝ Fibonacci Fₙ ≈ φⁿ/√5** |
| Particle horizon 46.13 Gly | N ≈ 293.8 |
| **S³ radius 548.3 Gly** | **N ≈ 299.1 — the Light-Trisphere consistency bridge** |

Features: endless-zoom **nested φ-shells** (scroll/pinch or slider travels the
ladder), ± level transitions (×φ / ÷φ), **jump-to-epoch** navigator (Planck seed →
proton → atom → human → Earth → AU → light-year → galaxy → recombination N=266 →
particle horizon → S³ radius), every epoch marker selectable with live
N, R(N), ρ/ρ_P and F_N readouts, the **golden spiral** winding by the golden
angle per level, the **nonlocal re-quantization wave**, and a **continuous
cyclicity** animation (expansion phase ↗ / re-quantization phase ↘) — the
model's eternal cycle instead of a singular Big Bang.

### ❄ Fractal Explorer
Real-time GPU raymarching of the Mandelbulb z → zⁿ + c (distance estimator,
adjustable power/iterations) — a playground for self-similar structure at
every zoom depth.

## Fiducial S³ values (verbatim from the article's benchmark table)

R = 548.324513026856 Gly · 2R = 1096.65 Gly · πR = 1722.61 Gly ·
2πR = 3445.22 Gly · V = 2π²R³ = 3.254×10⁹ Gly³ · K = 3.326×10⁻⁶ Gly⁻² ·
t_coh = 1722.61 Gyr · t₀ = 13.7877 Gyr · D_particle = 46.1252 Gly ·
θ_particle = 4.8197° · θ₀ = 1.4407° · Γ_obs = 1.2614×10⁻⁴ · Γ_ST = 4.255×10⁻¹⁰

## Model discipline (kept from the sources)

Conditional reconstruction, not a topology detection; round S³ selects no
preferred axis (SO(4)); t_R = 548.3 Gyr is not the age of the Universe; the
particle horizon is a background-dependent input; quotients S³/Γ (Poincaré
dodecahedral space) are the excluded sector of the simply connected choice
Γ = {1}; FBS3R cyclicity is the authors' published framework, rendered as-is.

## FBS3R sources (web)

- A. Preece & B. Batenin, *Fractal Bindu (S³) of Reality: The Golden Ratio as the
  Principle of Perfection and Harmony in Interdependent Existence* —
  [figshare 28631525](https://figshare.com/articles/preprint/_sup_strong_Fractal_Bindu_S3_of_Reality_The_Golden_Ratio_as_the_Principle_of_Perfection_and_Harmony_in_Interdependent_Existence_strong_sup_/28631525),
  [PhilArchive PREFBS](https://philarchive.org/archive/PREFBS),
  [OSF preprint vdfwh](https://osf.io/preprints/osf/vdfwh_v2)
- A. Preece & B. Batenin, *FB(S³)R: A Causally Interdependent Cyclic Model of the
  Universe* — [PhilArchive PREFAC-3](https://philarchive.org/rec/PREFAC-3)

## Technology

Three.js r160 (WebGL2, OrbitControls, CSS2DRenderer, logarithmic depth buffer,
GLSL raymarching), one self-contained HTML file, no build step.
