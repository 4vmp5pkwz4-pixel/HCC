# Galactic Butterfly implementation plan

**Goal:** Add a source-grounded, immersive instrument to the existing Cycles world, sharing AtlasTime, Three.js renderer, navigation and XR session.

**Design:** Five selectable scientific views: observer-centred celestial planes; Earth–Venus orbital chords; an explicitly synthetic solar butterfly; a schematic bipolar planetary nebula; and Galactic Fermi lobes. A sources panel distinguishes modern Hunab Ku symbolism, historical calendar arithmetic, astronomical geometry and morphological analogy. No shape establishes causation or predicts an event.

**Constraints:** Reuse the existing planetary ephemeris. Planetary outputs outside 1800–2050 are unavailable. Fixed J2000 sky directions and a mean precession cone are educational references. Solar activity and bipolar shells are labelled schematic and carry no fabricated observational timeline. One renderer, one epoch, lazy geometry, bounded buffers, no private animation loop. Preserve existing labs and public audience.

- [x] Implement pure geometry, calendar arithmetic and relation metadata in `core/cycles/galactic-butterfly.mjs`; verify independent reference values, domain rejection and negative epochs in `test/galactic-butterfly.test.mjs`.
- [x] Implement lazy scene and controls in `visual/galactic-butterfly.mjs`; connect one Cycles view, shared date/rate, event jumps, source links and a shareable route in `index.html`.
- [x] Integrate current main, including its repaired Chronometry and linked-view checks. Preserve the existing Fermi quantitative laboratory at `butterfly`; add this explorer at `butterfly-explorer` with a direct link between them.
- [ ] Run the required source checks and bounded geometry/lifecycle checks; update the visible release and manifest identity, commit, open and merge the PR, then verify Pages delivery.

**Validation limits:** Physical headset and visual browser QA are not claimed. A schematic, constant-period model is not an ephemeris or empirical reconstruction. This research covers the identified meanings and documented links, not an exhaustive proof about every use of the name.
