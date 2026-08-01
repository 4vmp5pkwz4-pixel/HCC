# Stellar and Black-Hole Best-of-Both Audit

## Scope

This audit covers every S3 laboratory whose primary subject is a star, compact
object, stellar explosion, accreting engine or emitted gravitational wave. It
also checks the null-ray and lensing laboratories that define the project's
visual-quality benchmark. The goal is not to assign merit by author. It is to
recover the strongest scientific and visual decisions from each repository
generation, remove regressions, and state exactly what every scene can and
cannot predict.

The audit used the complete single-file runtime, repository history, the Atlas
and formula registries, prediction contracts, lifecycle ownership, typed
Multi-View links, self-tests and live WebGL inspection. Important lineage:

| Object | Historical root | Later reconstruction used in this audit |
|---|---:|---:|
| neutron star | `6fc6753` | `f4e8020` plus restored spatial configuration family |
| supernova, pulsar, quasar | `2dc5cbe` | `f4e8020`, `04e2d08`, `1800288` |
| black-hole thermodynamics | `aa5123c` | current Kerr/Schwarzschild two-station rebuild |
| Schwarzschild ray image | `744fe0b`, fast path `f7845e5` | retained as a separate null-ray instrument |
| gravitational lensing | `a32364d` | retained as the optical benchmark |
| gravitational waves | `1e8ed25` | current native wavefront/polarization rebuild |

## Decisions

### Neutron star

The live TOV cutaway, density shells and compactness/lapse readouts remain. The
original mass-radius idea was scientifically valuable, but a flat chart inside
the scene was not. It is restored as a curved family of actual miniature TOV
configurations. Stable and unstable branches and the current solution are
spatial states rather than slide graphics.

### Supernova

The bounded deterministic GPU ejecta, non-wrapping age, Bateman decay chain,
grey gamma deposition, stable Arnett recurrence, conditional photosphere,
continuous free-expansion/Sedov radius and radiative transition remain the
reference implementation. Radiation-MHD is a typed outbound bridge, not a
hidden addition to this solver. The finite box-counting slope remains a
resolution-tagged rendered-sample diagnostic and is never called a universal
fractal dimension.

### Pulsar

The dipole congruence, open-field region and observer crossing remain. The
Goldreich-Julian light cylinder, striped current sheet, phase-resolved pulse
orbit, detector crossing and rotating-vector polarization direction restore the
original model's missing observational leg without restoring its flat pulse or
P-Pdot charts. Spin-down, characteristic age, field estimate, light-cylinder
radius and polarization angle are published independently.

### Quasar

The existing black horizon, photon ring, differential GPU accretion and thin
streamline jets already satisfy the project's optical grammar. They are kept
rather than rewritten. Eddington scaling and Schwarzschild-ISCO efficiency are
numeric contracts; disk and jet morphology remain schematic. A typed bridge to
the reconnection station exposes the missing plasma question without claiming a
coupled GRMHD disk.

### Black-hole thermodynamics

The old graph-like scene is replaced by two non-confusable stations. The Kerr
station evaluates outer-horizon radius, area, angular velocity, surface-gravity
temperature and Bekenstein-Hawking entropy; its dark horizon, restrained
ergosurface, area samples and frame-dragging ribbons are coordinate encodings.
The evaporation station is explicitly Schwarzschild-only and uses a
non-looping worldtube with the endpoint withheld. It does not reuse the null-ray
image or imply that an embedding is an observed black-hole appearance.

### Gravitational waves

The leading-order quasi-circular chirp remains, but the flat waveform strip and
large glow objects are removed. Thin outgoing null-wavefront shells encode
phase and visibly magnified tensor strain; a wireframe quadrupole lobe encodes
the phase-averaged angular power; the normalized Stokes state and test-mass ring
show polarization and local detector response. No element is a numerical-
relativity merger waveform or a calibrated LIGO template.

## New missing rung: white dwarfs

Main-sequence energy production, spectra, supernovae, neutron stars, pulsars,
quasars and black holes were represented, but electron-degenerate stars were
not. A white-dwarf laboratory therefore adds the highest-value missing causal
rung between nuclear composition and Type-Ia explosions. It evaluates the
composition-dependent Chandrasekhar endpoint and Nauenberg zero-temperature
mass-radius relation, displays a cutaway and a curved family of actual stellar
configurations, publishes radius/mass/density, exports the model state and joins
the stellar-cycle Multi-View preset.

This is preferable to adding many decorative spectral classes. Ordinary stellar
types are already covered structurally by the Solar, black-body and nuclear
laboratories. Further dedicated objects should be added only when they introduce
a new solver or observable: a magnetar requires force-free/PIC magnetospheres;
an X-ray binary or tidal-disruption event requires coupled transfer and
accretion dynamics; a core-collapse engine requires neutrino radiation-MHD.

## New bridge: Radiation-MHD and magnetic helicity

Five spatial reference stations expose the missing invariants shared by stellar
explosions, pulsars and accretion engines:

1. ideal frozen-flux deformation with the divergence constraint declared by
   construction;
2. closed-domain linked flux tubes with the Gauss linking integral and mutual
   helicity;
3. Sweet-Parker reconnection with Lundquist-number scaling and a disclosed
   plasmoid-regime flag;
4. Rankine-Hugoniot normal-shock compression with a reduced cooling-zone
   encoding;
5. normalized magnetized Rayleigh-Taylor growth or stabilization.

These are benchmark stations, not a radiation-GRMHD time evolution. Their
scientific purpose is to make conservation laws, topology and limiting behavior
inspectable before a future high-performance solver is admitted.

## Cross-system integration

- `stellar-cycle`: white dwarf, supernova, neutron star and radiation-MHD.
- `magnetized-plasma`: radiation-MHD, pulsar, quasar and electromagnetic
  Hopfion, with an explicit topology-not-identity firewall.
- Compact-object mass, normalized magnetic field and tempo are linked through
  typed controls with per-laboratory domain clipping.
- Every new group is owned by `s3Group`, included in transient release, and
  cannot leak into Solar, Observable, Cycles, Field or Fractal modes.
- Prediction manifests carry live bus outputs, formulas, validation results,
  epistemic limits, Multi-View context and dedicated white-dwarf or
  radiation-MHD diagnostic payloads.

## Scientific sources

- Nauenberg, *Analytic Approximations to the Mass-Radius Relation and Energy of
  Zero-Temperature Stars*, 1972: https://ui.adsabs.harvard.edu/abs/1972ApJ...175..417N/abstract
- Goldreich and Julian, *Pulsar Electrodynamics*, 1969:
  https://adsabs.harvard.edu/pdf/1969ApJ...157..869G
- Hawking, *Particle Creation by Black Holes*, 1975:
  https://ui.adsabs.harvard.edu/abs/1975CMaPh..43..199H/abstract
- Thorne, *Disk-Accretion onto a Black Hole. II*, 1974:
  https://ui.adsabs.harvard.edu/abs/1974ApJ...191..507T/abstract
- Wu and Most, *General-relativistic gauge-invariant magnetic helicity transport*,
  2024: https://arxiv.org/abs/2406.02837
- Huang and Bhattacharjee, plasmoid instability of Sweet-Parker sheets, 2010:
  https://arxiv.org/abs/1003.5951
- Event Horizon Telescope M87* first results, 2019:
  https://ui.adsabs.harvard.edu/abs/2019ApJ...875L...1E/abstract
- Event Horizon Telescope Sgr A* first results, 2022:
  https://ui.adsabs.harvard.edu/abs/2022ApJ...930L..12E/abstract

## Trust gate

The repository validator checks syntax, ownership, controls, formula/source
provenance, prediction coverage, typed links and numerical benchmark identities.
Live browser QA separately checks scene composition, console errors, WebGL
lifecycle, cross-mode containment, Multi-View routing and context recovery.
Passing these gates establishes implementation consistency, not empirical
calibration or completeness of astrophysics.
