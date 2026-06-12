# VALIDATION — S³ LIGHT-TRISPHERE / FBS3R Interactive 3D Model

## Automated checks

Run from the repository root (requires Node ≥ 18):

```bash
node scripts/validate.mjs
```

The script asserts (161 checks, all passing at last commit):

| # | Check |
|---|---|
| 1 | Inline ES module extracts and passes `node --check` (JavaScript syntax) |
| 2 | No Cyrillic characters anywhere in `index.html` (UI fully English) |
| 3 | All six mode buttons declared and each has a `setMode`/`buildCtl`/`tick` branch |
| 4 | Every `querySelector('#…')` / `getElementById('…')` target id is created in markup or a control-panel template (no missing event-handler targets) |
| 5 | Selection registry present (≥15 `registerSel` call-sites → ~60 runtime entries), provenance container and `SOURCE_MAP` exist |
| 6 | Mobile: `max-width:760px` media query, iOS `env(safe-area-inset-*)`, `viewport-fit=cover`, pinch handler, bottom-sheet toggles |
| 7 | Core formula fragments present verbatim: `V = 2π²R³`, `Γ(χ)`, `A(χ)=4πR²sin²χ`, `R(N)=l_P·φᴺ`, `N(L)=ln(L/l_P)/lnφ`, `φ⁻³ᴺ`, `F_N≈φᴺ/√5`, eigenvalue ladder |
| 8 | JSON & CSV export functions wired to buttons |
| 9 | Discipline guard: the app never claims topology detection as established fact; explicit conditional-reconstruction disclaimer present |
| 10 | Every `onclick`/`oninput`/`onchange` assignment target exists |

## Manual test checklist (desktop)

- [ ] Open `index.html` — title, ornamental clock (real UTC + sim time) visible.
- [ ] All six modes open: Solar System / Cycles & Events / Observable Universe / S³ Carrier & Hopf / φ FBS3R Levels / Fractal Explorer.
- [ ] Click any planet body or label → card with data, formula provenance, source tags (hover tag → full citation).
- [ ] Focus flies and follows; Land gives first-person surface view (true-scale sky, Sun at real angular size); Esc leaves.
- [ ] Moon: select → phase/elongation/node rows; Land works.
- [ ] Date picker (Solar System & Cycles) jumps to an exact date; "today" returns.
- [ ] Cycles: galactic clock moves at Myr/s speeds; precession axis traces its cone; seasons markers match listed equinox/solstice dates (±1 h); eclipse jump shows gold syzygy line at greatest-eclipse time, paused, true scale.
- [ ] Cycles dashboard: every 👁 button switches mode/speed/focus correctly.
- [ ] S³ → Section: χ slider live A(χ)/Γ(χ); photon loop reaches Γ=100 % at t ≥ 1722.6 Gyr.
- [ ] S³ → Hopf: density rebuilds fibres; flow beads slide; moving fibre A/B never unlinks; base-S² dots track.
- [ ] S³ → Eigenmodes: β/m sliders repaint Y_ℓm; readouts update (λ_β, k_β, g_β=β², wavelength).
- [ ] FBS3R: slider with epoch ticks, chips, exact-N input, length+unit input (fm…Gly) → correct N (e.g. 1 m → N≈166.5); formula matrix live; shells clickable; cycle animation ping-pongs 0→299.
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

## Screenshots

No headless browser is available in the CI container, so screenshots are a manual
step: open each of the six modes and capture one frame per mode
(desktop ≥1280 px and a phone viewport). Suggested names:
`shots/01-solar.png … 06-fractal.png`.

## Known accuracy envelopes (by design, disclosed in-app)

- Planets: JPL approximate elements, ~arcminute level, valid 1800–2050 (degrades outside).
- Moon: principal-term Meeus theory ~0.1–0.3°; eclipse instants therefore come from
  the NASA Canon catalogue, the in-scene syzygy line is approximate geometry.
- Equinox/solstice solver: mean Kepler elements, no nutation/aberration → ~1 h.
- Star catalogue: curated bright stars, ~0.1°.
- Galactic year 230 Myr and precession 25,772 yr: standard quoted values.
- S³ and FBS3R numbers: verbatim from the tagged publications (SOURCE_MAP).
