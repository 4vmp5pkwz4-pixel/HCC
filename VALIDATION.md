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

## Manual test checklist (desktop)

- [ ] Open `index.html` — title, ornamental clock (real UTC + sim time) visible.
- [ ] All seven modes open: Solar System / Cycles & Events / Observable Universe / S³ Carrier & Hopf / φ FBS3R Levels / Field Lab / Fractal Explorer.
- [ ] Click any planet body or label → card with data, formula provenance, source tags (hover tag → full citation).
- [ ] Focus flies and follows; Land gives first-person surface view (true-scale sky, Sun at real angular size); Esc leaves.
- [ ] Moon: select → phase/elongation/node rows; Land works.
- [ ] Date picker (Solar System & Cycles) jumps to an exact date; "today" returns.
- [ ] Cycles: galactic clock moves at Myr/s speeds; precession axis traces its cone; seasons markers match listed equinox/solstice dates (±1 h); eclipse jump shows gold syzygy line at greatest-eclipse time, paused, true scale.
- [ ] Cycles dashboard: every 👁 button switches mode/speed/focus correctly.
- [ ] S³ → Section: χ slider live A(χ)/Γ(χ); photon loop reaches Γ=100 % at t ≥ 1722.6 Gyr.
- [ ] S³ → Hopf: density rebuilds fibres; flow beads slide; moving fibre A/B never unlinks; base-S² dots track.
- [ ] S³ → Eigenmodes: β/m sliders repaint Y_ℓm; readouts update (λ_β, k_β, g_β=β², wavelength).
- [ ] S³ → Invariant Nexus: 64 luminous laboratory nodes and 102 typed relations appear across six labelled domains; the HUD reports one connected universe and no console error occurs.
- [ ] Nexus relation filters show only the selected edge class; node color/proximity never removes the visible disclaimer that graph distance is non-metric.
- [ ] Nexus dimensional morph moves continuously from disciplinary geography (`0`) to invariant-signature geography (`1`), remains finite at both ends and is reversible.
- [ ] Nexus path Spin → Black-hole thermodynamics resolves; each hop displays its edge class and claim. A restrictive disconnected filter reports “no path” instead of fabricating one.
- [ ] Clicking/tapping a Nexus node opens its relation-space contract; double-click focuses it; **open focused laboratory** enters the real laboratory.
- [ ] **Compare path in Multiview** opens the first 2–4 path laboratories without treating their sequence as causal.
- [ ] Nexus JSON export parses, contains 64 nodes and 102 relations, both coordinate arrays, typed/status-bearing edges and the non-metric/non-equivalence disclaimer.
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
