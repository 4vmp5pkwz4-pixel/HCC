# VALIDATION — S³ LIGHT-TRISPHERE / FBS3R Interactive 3D Model

> XR-specific validation lives in `XR_VALIDATION.md` and `QUEST3_TEST_PLAN.md`.
> The automated suite covers the desktop, mobile and WebXR contracts. The app
> also runs its current numerical self-test registry at startup, exportable as
> `validation_report.json`. Counts are generated at runtime rather than frozen here.

## Automated checks

Run from the repository root (requires Node ≥ 18):

```bash
node scripts/validate.mjs
```

The script asserts the following classes of checks. Because IDs and scientific
contracts are checked individually, the exact PASS count grows with the atlas.

| # | Check |
|---|---|
| 1 | Inline ES module extracts and passes `node --check` (JavaScript syntax) |
| 2 | Complete EN/RU/DE localization dictionaries are present |
| 3 | All seven mode buttons are declared and each has a `setMode`/`buildCtl`/`tick` branch |
| 4 | Every `querySelector('#…')` / `getElementById('…')` target id is created in markup or a control-panel template (no missing event-handler targets) |
| 5 | Selection registry present (≥15 `registerSel` call-sites → ~60 runtime entries), provenance container and `SOURCE_MAP` exist |
| 6 | Mobile: `max-width:760px` media query, iOS `env(safe-area-inset-*)`, `viewport-fit=cover`, pinch handler, bottom-sheet toggles |
| 7 | Core formula fragments present verbatim: `V = 2π²R³`, `Γ(χ)`, `A(χ)=4πR²sin²χ`, `R(N)=l_P·φᴺ`, `N(L)=ln(L/l_P)/lnφ`, `φ⁻³ᴺ`, `F_N≈φᴺ/√5`, eigenvalue ladder |
| 8 | JSON & CSV export functions wired to buttons |
| 9 | Discipline guard: the app never claims topology detection as established fact; explicit conditional-reconstruction disclaimer present |
| 10 | Every `onclick`/`oninput`/`onchange` assignment target exists |
| 11 | FB(S³)R published epoch labels are kept distinct from the CoScale clock |
| 12 | Inverse Atlas refuses an untyped scalar and labels cross-quantity scans as numerical coincidences |
| 13 | Invariant Nexus declares all eight relation classes, both exported embeddings, typed pathfinding, Multiview composition, JSON export, QA diagnostics and the non-metric epistemic firewall |
| 14 | Symmetry Discovery declares five exact transformation spaces, finite-orbit scanning, controlled symmetry breaking, candidate residuals, Atlas/Nexus/Multiview wiring, reproducible JSON and a non-theorem/non-exhaustive firewall |
| 15 | Holonomy Observatory declares five closed-path stations, analytic identities, independent finite closure checks, gauge/conjugacy invariants, Atlas/Nexus/Multiview wiring, reproducible JSON and a cross-domain epistemic firewall |
| 16 | Contact & Action Observatory declares five exact stations, native R⁴ contact/KS checks, return-map and semiclassical invariants, Atlas/Nexus/Multiview wiring, reproducible JSON and a native-dimension epistemic firewall |
| 17 | Spinor & Light-Cone Observatory declares five exact native-space stations, Pauli/Lorentz/Möbius/null-tetrad/conformal identities, Atlas/Nexus/Multiview wiring, reproducible JSON and a flat-space epistemic firewall |
| 18 | Premium visual engine is disabled on a fresh browser, exposed through one persistent settings switch, fully CSS/render scoped, and still declares sRGB/ACES output, complete 68-laboratory coverage, bounded adaptive bloom, reduced-motion support and XR/Multiview exclusions when opted in |

## Manual test checklist (desktop)

- [ ] Open `index.html` — title, ornamental clock (real UTC + sim time) visible.
- [ ] All seven modes open: Solar System / Cycles & Events / Observable Universe / S³ Carrier & Hopf / φ FBS3R Levels / Field Lab / Fractal Explorer.
- [ ] In a fresh browser, **Premium visuals** reads `Off`: no precision-stage rings, corner frame, transition veil, premium panel restyle, ACES profile or global label decluttering is active; the presentation matches the pre-premium release.
- [ ] **More → Interface → Premium visuals** enables the complete layer in one action and persists the explicit opt-in; switching it Off restores the classic presentation immediately without reloading.
- [ ] With Premium visuals On, switch repeatedly across Nexus, Spinor, KAM and CMB: accent, precision stage and panel highlights update as one system; no stale palette or transition layer remains.
- [ ] The cinematic stage always stays behind the active model, follows camera framing without parallax jumps, and never appears as a selectable object or exported scientific datum.
- [ ] Dense CSS2D scenes retain major/selected labels while lower-priority collisions disappear; resize, camera movement and selection recompute the layout without orphan labels.
- [ ] Simulated WebGL context loss returns to a rendered scene and conservative bloom budget; no white/frozen viewport or duplicate canvas remains.
- [ ] Click any planet body or label → card with data, formula provenance, source tags (hover tag → full citation).
- [ ] Focus flies and follows; Land gives first-person surface view (true-scale sky, Sun at real angular size); Esc leaves.
- [ ] Moon: select → phase/elongation/node rows; Land works.
- [ ] Date picker (Solar System & Cycles) jumps to an exact date; "today" returns.
- [ ] Cycles: galactic clock moves at Myr/s speeds; precession axis traces its cone; seasons markers match listed equinox/solstice dates (±1 h); eclipse jump shows gold syzygy line at greatest-eclipse time, paused, true scale.
- [ ] Cycles dashboard: every 👁 button switches mode/speed/focus correctly.
- [ ] S³ → Section: χ slider live A(χ)/Γ(χ); photon loop reaches Γ=100 % at t ≥ 1722.6 Gyr.
- [ ] S³ → Hopf: density rebuilds fibres; flow beads slide; moving fibre A/B never unlinks; base-S² dots track.
- [ ] S³ → Eigenmodes: β/m sliders repaint Y_ℓm; readouts update (λ_β, k_β, g_β=β², wavelength).
- [ ] S³ → Invariant Nexus: 67 luminous laboratory nodes and 130 typed relations appear across six labelled domains; the HUD reports one connected universe and no console error occurs.
- [ ] Nexus relation filters show only the selected edge class; node color/proximity never removes the visible disclaimer that graph distance is non-metric.
- [ ] Nexus dimensional morph moves continuously from disciplinary geography (`0`) to invariant-signature geography (`1`), remains finite at both ends and is reversible.
- [ ] Nexus path Spin → Black-hole thermodynamics resolves; each hop displays its edge class and claim. A restrictive disconnected filter reports “no path” instead of fabricating one.
- [ ] Clicking/tapping a Nexus node opens its relation-space contract; double-click focuses it; **open focused laboratory** enters the real laboratory.
- [ ] **Compare path in Multiview** opens the first 2–4 path laboratories without treating their sequence as causal.
- [ ] Nexus JSON export parses, contains 67 nodes and 130 relations, both coordinate arrays, typed/status-bearing edges and the non-metric/non-equivalence disclaimer.
- [ ] S³ → Spinor & Light Cone: all five station chips rebuild finite stereo-safe 3D geometry, a moving marker, invariant core and phase dial without console errors or orphan labels.
- [ ] Spinor → null ray: `k·k`, `det(2ψψ†)`, normalization and common-phase direction drift remain below tolerance while `k⁰>0` over the full two-control sweep.
- [ ] `SL(2,C)` → Lorentz: `det A=1`, the Minkowski interval and time orientation close; replacing `A` with `−A` leaves the induced transformation unchanged.
- [ ] Celestial Möbius: projective-spinor and transformed-null directions agree, nullity closes and the complex four-point cross-ratio remains invariant.
- [ ] Null tetrad: all tetrad contractions close and opposite dyad phase leaves `l,n` fixed while the displayed spin-one and spin-two phases track `χ` and `2χ`.
- [ ] Conformal diamond: the event round-trip closes, `U=const` outgoing and `V=const` ingoing families remain null, and the scope stays visibly restricted to radial flat spacetime.
- [ ] Spinor & Light Cone **compare exact neighbours** opens the declared four-view Multiview preset without turning a representation or analogy into physical identity.
- [ ] Spinor & Light Cone JSON parses with all five station contracts, native values, conventions, deterministic sample counts, residuals and the explicit non-observation/non-curved-spacetime firewall.
- [ ] S³ → Holonomy Observatory: all five station chips rebuild a finite 3D path, moving marker, invariant core and return-phase dial without console errors or orphan labels.
- [ ] S² station: sweep both controls; `K·A` remains equal to `Ω` when `R` changes and the 1,024-step transport residual stays within its declared tolerance.
- [ ] Berry station: increase the local-gauge amplitude through its full range; the 257-vertex phase remains gauge invariant and stays converged on `−Ω/2` within the displayed polygon tolerance.
- [ ] SU(2), Wigner and Möbius stations: noncommuting order produces a visible return defect while unit norm/determinant/interval and conjugacy trace remain closed.
- [ ] Holonomy **Open exact anchors in Multiview** produces a four-laboratory comparison for every station without treating shared closed-path structure as physical identity.
- [ ] Holonomy JSON parses with five station contracts, raw path/matrix values, deterministic discretisation metadata and the explicit non-measurement/non-exhaustive firewall.
- [ ] S³ → Contact & Action: all five station chips rebuild finite 3D paths, moving marker, tangent/action cue and invariant core without console errors or non-finite geometry.
- [ ] Reeb station: `λ₀(R)=1`, `ι_Rdλ₀=0` and constant Hopf image close in native R⁴; the projected two-fibre Gauss integral remains within the declared finite tolerance of `|Lk|=1`.
- [ ] Ellipsoid return station: the section map preserves determinant one; rational presets visibly close after the reported denominator while the golden-ratio preset is explicitly reported as non-closed at the finite search bound.
- [ ] Legendrian station: every coprime `(p,q)` preset closes and the sampled maximum `|λ₀(γ̇)|` stays within tolerance; the Reeb push-off is visually distinct.
- [ ] KS station: a full U(1) gauge sweep leaves the R³ image fixed, `|X(u)|=|u|²` closes and the collision chart reports the `2/3` physical-time exponent without claiming a general N-body solution.
- [ ] Maslov station: the 2,048-edge action integral agrees with `(n+1/2)ħ`, counts `μ=2`, and distinguishes the classical `2π` return from the metaplectic `−1` and `4π` return.
- [ ] Contact & Action **Open exact bridges in Multiview** produces the declared four-laboratory comparison for every station without upgrading a bridge to physical identity.
- [ ] Contact & Action JSON parses with all five station contracts, sample counts, native-dimensional residuals and the non-measurement/non-general-theorem firewall.
- [ ] S³ → Symmetry Discovery: switch across SO(3), Lorentz, U(1), symplectic and Möbius spaces; the cyan exact orbit, current marker and four residual pillars stay finite.
- [ ] At `epsilon_break=0`, the nine declared exact candidates pass at `10^-9` while every displayed negative control changes over its 65-sample orbit.
- [ ] Increase `epsilon_break` to `0.12`: a coral orbit separates from cyan and at least one formerly stable candidate fails in every transformation space; reset restores exact results.
- [ ] **Open exact anchors in Multiview** produces the documented 3–4 laboratory comparison for every space without claiming physical identity.
- [ ] Symmetry Discovery JSON parses with 65 samples, four candidate values per sample, normalized residuals, perturbation contract and the explicit “not a theorem / not exhaustive” firewall.
- [ ] FBS3R: slider with epoch ticks, chips, exact-N input, length+unit input (fm…Gly) → correct N (e.g. 1 m → N≈166.5); formula matrix live; shells clickable; cycle animation ping-pongs 0→299.
- [ ] FBS3R: quick-access chips have explicit labels and increase by N; N★207 is not appended after cosmological scales.
- [ ] FBS3R: the N_rec=266 publication label shows CoScale t(266)≈66.6 kyr separately from the 380 kyr cosmological label.
- [ ] Inverse Atlas: entering a number without selecting a quantity kind produces no matches; the 2.224566 MeV preset returns only the energy observable unless the explicit exploratory all-kinds mode is selected.
- [ ] FBS3R exports: State JSON downloads and parses; φ-ladder CSV opens with 313 rows + header.
- [ ] Day/Night theme toggle persists after reload.
- [ ] Milky Way band passes through Cygnus–Cassiopeia and is brightest toward Sagittarius/Scorpius; zodiac glyphs lie along the gold ecliptic.

## Manual test checklist (smartphone)

- [ ] Mode row scrolls horizontally; nothing overlaps; clock visible.
- [ ] ⚙ / ⓘ bottom buttons open one panel at a time as bottom sheets.
- [ ] One-finger orbit, two-finger pinch zoom; in FBS3R pinch travels the φ-ladder; landed pinch zooms FOV.
- [ ] Tap selection works for planets, screens, instruments, shells, constellations.
- [ ] Safe-area: no UI under the notch / home indicator (iOS).
- [ ] Stable FPS (pixel ratio capped at 1.6 on mobile).
- [ ] With the optional layer On, its frame respects safe areas; with it Off, no premium ornament occupies the 390×844 or 360×800 viewport.
- [ ] Under sustained GPU pressure only bloom-buffer resolution steps down; laboratory geometry, solver resolution, controls and displayed values remain unchanged.
- [ ] Spinor & Light Cone station chips, both controls, native residuals, Multiview and export remain usable in the mobile bottom sheet; long contracts wrap without horizontal clipping.
- [ ] Holonomy station chips, two normalized controls, transport toggle, invariant readouts and export remain usable in the mobile bottom sheet; the scope contract is readable without horizontal clipping.
- [ ] Contact & Action station chips, two normalized controls, action/contact readouts, Multiview and export remain usable in the mobile bottom sheet; long station contracts wrap without horizontal clipping.
- [ ] Symmetry Discovery world chips, sweep, symmetry-break slider, tolerance and residual list remain usable in the mobile bottom sheet; no control is clipped by the safe area.

## Screenshots

Screenshot comparison remains a manual release gate: open each of the seven modes
and capture one frame per mode (desktop ≥1280 px and a phone viewport). Suggested
names: `shots/01-solar.png … 07-fractal.png`.

## Known accuracy envelopes (by design, disclosed in-app)

- Planets: JPL approximate elements, ~arcminute level, valid 1800–2050 (degrades outside).
- Moon: principal-term Meeus theory ~0.1–0.3°; eclipse instants therefore come from
  the NASA Canon catalogue, the in-scene syzygy line is approximate geometry.
- Equinox/solstice solver: mean Kepler elements, no nutation/aberration → ~1 h.
- Star catalogue: curated bright stars, ~0.1°.
- Galactic year 230 Myr and precession 25,772 yr: standard quoted values.
- S³ and FBS3R inputs are source-tagged. Derived values are recomputed from the
  displayed formulas; publication labels and independent CoScale results are not
  silently conflated.
- Spinor & Light-Cone identities are exact only for normalized two-spinors,
  Hermitian `2×2` matrices, proper orthochronous flat-spacetime Lorentz maps,
  the displayed local null frame and the radial `1+1` flat conformal section.
  Binary64 residuals are implementation checks; 3D positions are projections,
  not native Lorentzian distances or observations.
- Holonomy stations are exact only within their declared round-S², ideal
  two-level, SU(2), orthogonal-boost or real SL(2,R) families. The sphere and
  Berry closures are finite deterministic discretisations, not measurements.
- Contact & Action stations are exact only for the declared standard contact
  S³, integrable ellipsoid, displayed Legendrian family, KS radial collision
  chart and harmonic oscillator. Projected linking/action loops are finite
  deterministic checks, not measurements or general contact-topology proofs.
